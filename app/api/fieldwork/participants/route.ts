import { NextResponse } from "next/server";
import { z } from "zod";
import { loadFieldworkContext, publicUrl } from "@/lib/fieldwork";

const inputSchema = z.object({ name: z.string().max(100).optional(), practice: z.boolean().optional().default(false) });

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    const { db, projectId, instrumentTask } = await loadFieldworkContext();
    if (!instrumentTask?.output_json) return NextResponse.json({ error: "Generate the interview guide first" }, { status: 400 });
    if (!input.practice && !instrumentTask.output_json.guideApprovedAt) return NextResponse.json({ error: "Approve Daniel’s interview guide before creating a research session" }, { status: 409 });
    const name = input.name?.trim() || (input.practice ? "Practice participant" : "Interview participant");
    const result = await db.from("interview_participants").insert({ project_id: projectId, name, status: "invited", consent_source: input.practice ? "practice session" : null }).select("id,public_token,name,status").single();
    if (result.error || !result.data) throw result.error ?? new Error("Could not create interview session");
    return NextResponse.json({ participant: result.data, interviewUrl: publicUrl(`/interview/${result.data.public_token}`, request.url) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create interview" }, { status: 400 });
  }
}
