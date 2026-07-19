import { NextResponse } from "next/server";
import { secondaryResearchConfigured } from "@/lib/env";
import { publicResearchState, resolveResearchSession } from "@/lib/research-session";
import { buildResearchQueries } from "@/lib/secondary-research-server";
import type { ResearchPlan } from "@/lib/research-plan";

export async function POST() {
  try {
    if (!secondaryResearchConfigured) return NextResponse.json({ error: "Live secondary research is not configured." }, { status: 503 });
    const session = await resolveResearchSession();
    if (session.state.status !== "queued") return NextResponse.json({ state: publicResearchState(session.state), progress: session.task.progress });
    const [{ data: project, error: projectError }, { data: planRecord, error: planError }] = await Promise.all([
      session.db.from("research_projects").select("industry,geography,business_question").eq("id", session.projectId).single(),
      session.db.from("research_plans").select("structured_plan_json").eq("project_id", session.projectId).eq("status", "approved").order("version", { ascending: false }).limit(1).single(),
    ]);
    if (projectError || planError || !project || !planRecord) throw projectError ?? planError ?? new Error("Approved research context is unavailable");
    const startedAt = new Date().toISOString();
    const state = { ...session.state, status: "in_progress" as const, phase: "searching" as const, currentActivity: "Translating the approved workstreams into source searches", queries: buildResearchQueries(planRecord.structured_plan_json as ResearchPlan, project), startedAt };
    const { error } = await session.db.from("agent_tasks").update({ status: "in_progress", progress: 5, output_json: state, started_at: startedAt }).eq("id", session.task.id);
    if (error) throw error;
    return NextResponse.json({ state: publicResearchState(state), progress: 5 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start secondary research" }, { status: 400 }); }
}
