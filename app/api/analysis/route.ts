import { NextResponse } from "next/server";
import { agentDefinitions } from "@/lib/agents";
import { loadFieldworkContext } from "@/lib/fieldwork";
import { structuredInference } from "@/lib/inference";
import { analysisOutputSchema } from "@/lib/schemas";
export const maxDuration = 60;

function aggregateSurvey(context: Awaited<ReturnType<typeof loadFieldworkContext>>) {
  if (context.project.research_mode === "secondary") return { mode: "not_applicable", liveResponseCount: 0, syntheticResponseCount: 0, questions: [] };
  const live = context.responses.length > 0;
  const questions = context.questions.map((question) => {
    const values = context.answers.filter((answer) => answer.question_id === question.id).flatMap((answer) => Array.isArray(answer.answer_json) ? answer.answer_json.map(String) : [String(answer.answer_json)]);
    const counts = values.reduce<Record<string, number>>((acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }), {});
    if (live) return { id: `survey-q${question.position}`, question: question.question, base: values.length, counts, openText: question.type === "text" ? values.slice(0, 12) : undefined };
    const options = Array.isArray(question.options_json) ? question.options_json.map(String) : [];
    const syntheticBase = 48;
    const syntheticCounts = options.length ? Object.fromEntries(options.map((option, index) => [option, Math.floor(syntheticBase / options.length) + (index === 0 ? syntheticBase % options.length : 0)])) : {};
    return { id: `synthetic-q${question.position}`, question: question.question, base: syntheticBase, counts: syntheticCounts, openText: question.type === "text" ? ["Synthetic illustrative comment: convenience matters when the visit is part of another trip."] : undefined };
  });
  return { mode: live ? "live" : "synthetic", liveResponseCount: context.responses.length, syntheticResponseCount: live ? 0 : 48, questions };
}

export async function GET() {
  try {
    const context = await loadFieldworkContext();
    const [{ data: task }, { data: findings }] = await Promise.all([
      context.db.from("agent_tasks").select("status,progress,output_json,completed_at").eq("project_id", context.projectId).eq("task_type", "integrated_analysis").maybeSingle(),
      context.db.from("research_findings").select("*").eq("project_id", context.projectId),
    ]);
    const practiceParticipantIds = new Set(context.participants.filter((participant) => String(participant.consent_source ?? "").includes("practice session")).map((participant) => participant.id));
    const survey = aggregateSurvey(context);
    const completedInterviews = context.interviews.filter((i) => i.status === "complete" && !practiceParticipantIds.has(i.participant_id)).length;
    const secondarySources = context.state.sources?.length ?? 0;
    const previous = task?.output_json as { liveResponseCount?: number; completedInterviews?: number; secondarySourceCount?: number } | null;
    const hasNewEvidence = Boolean(previous && (
      survey.liveResponseCount !== (previous.liveResponseCount ?? 0) ||
      completedInterviews !== (previous.completedInterviews ?? 0) ||
      secondarySources !== (previous.secondarySourceCount ?? 0)
    ));
    return NextResponse.json({ status: task?.status ?? "not_started", progress: task?.progress ?? 0, analysis: task?.output_json ?? null, findings: findings ?? [], hasNewEvidence, evidence: { survey, completedInterviews, secondarySources } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load analysis" }, { status: 401 }); }
}

export async function POST() {
  try {
    const context = await loadFieldworkContext();
    const survey = aggregateSurvey(context);
    const practiceParticipantIds = new Set(context.participants.filter((participant) => String(participant.consent_source ?? "").includes("practice session")).map((participant) => participant.id));
    const completed = context.interviews.filter((interview) => interview.status === "complete" && !practiceParticipantIds.has(interview.participant_id));
    const interviewEvidence = completed.map((interview, index) => ({ id: `interview-i${index + 1}`, summary: interview.summary, themes: interview.themes_json, transcript: context.messages.filter((message) => message.interview_id === interview.id).map((message) => ({ speaker: message.speaker, content: message.content })) }));
    const secondary = (context.state.sources ?? []).map((source) => ({ id: source.id, title: source.title, evidence: source.supportedClaim || source.excerpt, workstream: source.workstream, reliability: source.reliability }));
    const result = await structuredInference(
      `${agentDefinitions.insights.system} Integrate only the supplied evidence. Distinguish observation from interpretation. Every finding must cite supplied evidence IDs. Do not imply interview evidence exists when none is supplied. If survey.mode is synthetic, state that the survey pattern is illustrative and cannot support a market claim. If live survey bases are small, lower confidence and say so. Confidence means: High = convergent directly relevant evidence; Medium = useful support with material limitations; Directional = early indication requiring validation.`,
      { project: context.project, approvedPlan: context.plan, secondaryEvidence: secondary, surveyEvidence: survey, interviewEvidence }, analysisOutputSchema, "integrated_analysis", "{overview:string,findings:[{type:'secondary'|'survey'|'interview'|'integrated',title:string,observation:string,interpretation:string,implication:string,confidence:'High'|'Medium'|'Directional',evidenceIds:string[],limitations:string[]}],agreements:string[],contradictions:string[],remainingGaps:string[]}", { maxTokens: 4200, attempts: 3 },
    );
    const { db, projectId } = context;
    const { data: sofia } = await db.from("agents").select("id").eq("slug", "sofia-tan").single();
    if (!sofia) throw new Error("Sofia is unavailable");
    await db.from("research_findings").delete().eq("project_id", projectId);
    const { error: findingError } = await db.from("research_findings").insert(result.findings.map((finding) => ({ project_id: projectId, agent_id: sofia.id, finding_type: finding.type, title: finding.title, summary: `${finding.observation}\n\nInterpretation: ${finding.interpretation}\n\nDecision implication: ${finding.implication}`, confidence: finding.confidence, evidence_links_json: (finding.evidenceIds as string[]).map((id: string) => ({ evidenceId: id })) })));
    if (findingError) throw findingError;
    const output = { ...result, dataMode: survey.mode, liveResponseCount: survey.liveResponseCount, syntheticResponseCount: survey.syntheticResponseCount, completedInterviews: completed.length, secondarySourceCount: secondary.length, dataCutoff: new Date().toISOString() };
    const { data: task } = await db.from("agent_tasks").select("id").eq("project_id", projectId).eq("task_type", "integrated_analysis").maybeSingle();
    if (task) await db.from("agent_tasks").update({ status: "complete", progress: 100, output_json: output, completed_at: new Date().toISOString() }).eq("id", task.id);
    else await db.from("agent_tasks").insert({ project_id: projectId, agent_id: sofia.id, task_type: "integrated_analysis", title: "Integrate published and field evidence", status: "complete", progress: 100, output_json: output, started_at: new Date().toISOString(), completed_at: new Date().toISOString() });
    await db.from("research_projects").update({ current_phase: "analysis" }).eq("id", projectId);
    return NextResponse.json({ complete: true, analysis: output });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Analysis failed" }, { status: 502 }); }
}
