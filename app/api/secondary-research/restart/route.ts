import { NextResponse } from "next/server";
import { publicResearchState, resolveResearchSession } from "@/lib/research-session";
import type { StoredSecondaryResearchState } from "@/lib/secondary-research-types";

export async function POST() {
  try {
    const session = await resolveResearchSession();
    const state: StoredSecondaryResearchState = {
      accessHash: session.state.accessHash,
      status: "queued",
      phase: "queued",
      currentActivity: "Preparing a fresh, relevance-filtered source search",
      plan: session.state.plan,
      researchMode: session.state.researchMode,
      queries: [],
      candidates: [],
      sources: [],
      usage: { searchRequests: 0, pageFetches: 0, proxyRequests: 0, llmCalls: 0, estimatedInputTokens: 0, maxOutputTokens: 0 },
    };
    const [{ error: sourceError }, { error: taskError }, { error: projectError }] = await Promise.all([
      session.db.from("sources").delete().eq("project_id", session.projectId),
      session.db.from("agent_tasks").update({ status: "queued", progress: 0, output_json: state, started_at: null, completed_at: null }).eq("id", session.task.id),
      session.db.from("research_projects").update({ status: "approved", current_phase: "secondary_research", updated_at: new Date().toISOString() }).eq("id", session.projectId),
    ]);
    if (sourceError || taskError || projectError) throw sourceError ?? taskError ?? projectError;
    return NextResponse.json({ state: publicResearchState(state), progress: 0 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not restart secondary research" }, { status: 400 });
  }
}
