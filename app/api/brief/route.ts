import { NextResponse } from "next/server";
import { agentDefinitions } from "@/lib/agents";
import { loadFieldworkContext } from "@/lib/fieldwork";
import { structuredInference } from "@/lib/inference";
import { decisionBriefSchema } from "@/lib/schemas";
export const maxDuration = 60;

export async function GET() {
  try {
    const context = await loadFieldworkContext();
    const [{ data: analysisTask }, { data: briefs }] = await Promise.all([
      context.db.from("agent_tasks").select("output_json,completed_at").eq("project_id", context.projectId).eq("task_type", "integrated_analysis").maybeSingle(),
      context.db.from("research_briefs").select("*").eq("project_id", context.projectId).order("version", { ascending: false }).limit(1),
    ]);
    const brief = briefs?.[0] ?? null;
    const stale = Boolean(brief && analysisTask?.completed_at && new Date(analysisTask.completed_at).getTime() > new Date(brief.created_at).getTime());
    return NextResponse.json({ brief: brief?.content_json ?? null, version: brief?.version ?? 0, createdAt: brief?.created_at ?? null, stale, analysisReady: Boolean(analysisTask?.output_json), analysis: analysisTask?.output_json ?? null });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load brief" }, { status: 401 }); }
}

export async function POST() {
  try {
    const context = await loadFieldworkContext();
    const { data: analysisTask } = await context.db.from("agent_tasks").select("output_json,completed_at").eq("project_id", context.projectId).eq("task_type", "integrated_analysis").maybeSingle();
    if (!analysisTask?.output_json) return NextResponse.json({ error: "Complete Sofia’s integrated analysis first" }, { status: 409 });
    const findings = (await context.db.from("research_findings").select("finding_type,title,summary,confidence,evidence_links_json").eq("project_id", context.projectId)).data ?? [];
    const brief = await structuredInference(
      `${agentDefinitions.strategy.system} Write a concise decision-ready client brief. Do not overstate synthetic survey data or small samples. If the evidence is insufficient for a confident recommendation, say so directly and recommend the smallest next action that would resolve the decision. Every evidence summary must cite supplied evidence IDs.`,
      { project: context.project, approvedPlan: context.plan, analysis: analysisTask.output_json, persistedFindings: findings }, decisionBriefSchema, "decision_brief", "{title:string,executiveRecommendation:string,rationale:string[],evidenceSummary:[{claim:string,support:string,evidenceIds:string[]}],risks:string[],changeConditions:string[],nextActions:string[],methodology:string,limitations:string[]}", { maxTokens: 4000, attempts: 3 },
    );
    const { data: previous } = await context.db.from("research_briefs").select("version").eq("project_id", context.projectId).order("version", { ascending: false }).limit(1).maybeSingle();
    const version = (previous?.version ?? 0) + 1;
    const content = { ...brief, dataMode: analysisTask.output_json.dataMode, liveResponseCount: analysisTask.output_json.liveResponseCount, syntheticResponseCount: analysisTask.output_json.syntheticResponseCount, completedInterviews: analysisTask.output_json.completedInterviews, secondarySourceCount: analysisTask.output_json.secondarySourceCount, dataCutoff: analysisTask.output_json.dataCutoff };
    const { error } = await context.db.from("research_briefs").insert({ project_id: context.projectId, version, content_json: content });
    if (error) throw error;
    await context.db.from("research_projects").update({ current_phase: "brief", status: "complete" }).eq("id", context.projectId);
    return NextResponse.json({ complete: true, brief: content, version });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Brief generation failed" }, { status: 502 }); }
}
