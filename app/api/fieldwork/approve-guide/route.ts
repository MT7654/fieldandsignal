import { NextResponse } from "next/server";
import { loadFieldworkContext } from "@/lib/fieldwork";

export async function POST() {
  try {
    const context = await loadFieldworkContext();
    if (!context.instrumentTask?.output_json?.interviewGuide) return NextResponse.json({ error: "Generate the interview guide first" }, { status: 400 });
    const output = { ...context.instrumentTask.output_json, guideApprovedAt: new Date().toISOString() };
    const { error } = await context.db.from("agent_tasks").update({ output_json: output }).eq("id", context.instrumentTask.id);
    if (error) throw error;
    return NextResponse.json({ approved: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not approve guide" }, { status: 400 }); }
}
