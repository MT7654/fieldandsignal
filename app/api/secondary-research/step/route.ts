import { NextResponse } from "next/server";
import { publicResearchState, resolveResearchSession } from "@/lib/research-session";
import { runResearchStep } from "@/lib/secondary-research-server";

export const maxDuration = 300;

export async function POST() {
  try {
    const session = await resolveResearchSession();
    const state = await runResearchStep(session);
    const { data: task } = await session.db.from("agent_tasks").select("progress").eq("id", session.task.id).single();
    return NextResponse.json({ state: publicResearchState(state), progress: task?.progress ?? session.task.progress });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not continue secondary research" }, { status: 400 }); }
}
