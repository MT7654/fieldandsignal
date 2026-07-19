import { NextResponse } from "next/server";
import { agentDefinitions } from "@/lib/agents";
import { loadFieldworkContext } from "@/lib/fieldwork";
import { structuredInference } from "@/lib/inference";
import { generatedInstrumentSchema } from "@/lib/schemas";
export const maxDuration = 60;

export async function POST() {
  try {
    const context = await loadFieldworkContext();
    const { db, projectId, project, plan } = context;
    if (context.survey?.status === "published" || context.responses.length > 0) return NextResponse.json({ error: "A published survey with fieldwork cannot be regenerated. Create a new instrument version in a future engagement instead." }, { status: 409 });
    const generated = await structuredInference(
      `${agentDefinitions.methodologist.system} Create a respondent-friendly survey and a semi-structured interview guide. Questions must be answerable by ordinary target respondents, neutral, concise, non-duplicative, and directly useful to the approved decision. Avoid unnecessary personal data. Rating questions must use exactly five labelled options. Provide a client-facing rationale for every question.`,
      { project, approvedPlan: plan },
      generatedInstrumentSchema,
      "primary_research_instruments",
      "{survey:{title:string,introduction:string,estimatedMinutes:number,questions:[{type:'single'|'multiple'|'rating'|'text',question:string,options:string[],required:boolean,rationale:string}]},interviewGuide:{title:string,introduction:string,objectives:string[],questions:[{question:string,rationale:string,probes:string[]}]}}",
      { maxTokens: 4200, attempts: 3 },
    );

    let surveyId = context.survey?.id as string | undefined;
    if (surveyId) {
      const { error } = await db.from("surveys").update({ title: generated.survey.title, introduction: generated.survey.introduction, status: "draft", published_at: null }).eq("id", surveyId);
      if (error) throw error;
      await db.from("survey_questions").delete().eq("survey_id", surveyId);
    } else {
      const result = await db.from("surveys").insert({ project_id: projectId, title: generated.survey.title, introduction: generated.survey.introduction, status: "draft" }).select("id").single();
      if (result.error || !result.data) throw result.error ?? new Error("Could not create survey");
      surveyId = result.data.id;
    }
    const { error: questionError } = await db.from("survey_questions").insert(generated.survey.questions.map((question, index) => ({
      survey_id: surveyId,
      type: question.type,
      question: question.question,
      options_json: question.options,
      required: question.required,
      position: index + 1,
    })));
    if (questionError) throw questionError;

    const { data: aisha, error: agentError } = await db.from("agents").select("id").eq("slug", "aisha-rahman").single();
    if (agentError || !aisha) throw agentError ?? new Error("Aisha is unavailable");
    const output = { ...generated, generatedAt: new Date().toISOString(), guideApprovedAt: null, questionRationales: generated.survey.questions.map((q, index) => ({ position: index + 1, rationale: q.rationale })) };
    if (context.instrumentTask) {
      const { error } = await db.from("agent_tasks").update({ status: "complete", progress: 100, output_json: output, completed_at: new Date().toISOString() }).eq("id", context.instrumentTask.id);
      if (error) throw error;
    } else {
      const { error } = await db.from("agent_tasks").insert({ project_id: projectId, agent_id: aisha.id, task_type: "primary_instruments", title: "Design survey and interview guide", status: "complete", progress: 100, output_json: output, started_at: new Date().toISOString(), completed_at: new Date().toISOString() });
      if (error) throw error;
    }
    await db.from("research_projects").update({ current_phase: "primary_research" }).eq("id", projectId);
    return NextResponse.json({ generated: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Instrument generation failed" }, { status: 502 });
  }
}
