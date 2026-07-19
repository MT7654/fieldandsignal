import { NextResponse } from "next/server";
import { publicResearchState, resolveResearchSession } from "@/lib/research-session";

export async function GET() {
  try { const session = await resolveResearchSession(); return NextResponse.json({ state: publicResearchState(session.state), progress: session.task.progress }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Research session unavailable" }, { status: 401 }); }
}
