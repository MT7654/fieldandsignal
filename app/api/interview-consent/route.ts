import { NextResponse } from "next/server";
import { databaseConfigured } from "@/lib/env";
import { interviewConsentSchema } from "@/lib/schemas";
import { createServerSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const input = interviewConsentSchema.parse(await request.json());
    const consentedAt = new Date().toISOString();
    if (input.token === "northstar-jamie" || !databaseConfigured) return NextResponse.json({ accepted: true, demo: true, consentedAt });
    const db = createServerSupabase();
    const { data: participant, error } = await db.from("interview_participants").select("id,project_id,consent_source").eq("public_token", input.token).single();
    if (error || !participant) return NextResponse.json({ error: "Interview invitation not found" }, { status: 404 });
    let { data: interview } = await db.from("interviews").select("id").eq("participant_id", participant.id).maybeSingle();
    if (interview) {
      const { error: updateError } = await db.from("interviews").update({ status: "in_progress", consented_at: consentedAt, started_at: consentedAt }).eq("id", interview.id);
      if (updateError) throw updateError;
    } else {
      const result = await db.from("interviews").insert({ project_id: participant.project_id, participant_id: participant.id, status: "in_progress", consented_at: consentedAt, started_at: consentedAt }).select("id").single();
      if (result.error || !result.data) throw result.error ?? new Error("Could not start interview");
      interview = result.data;
    }
    const sessionKind = participant.consent_source?.includes("practice") ? "practice session" : "research session";
    await db.from("interview_participants").update({ status: "in_progress", consent_source: `${sessionKind}; browser disclosure ${input.disclosureVersion}; raw audio ${input.retainAudio ? "requested" : "not retained"}` }).eq("id", participant.id);
    const { count } = await db.from("interview_messages").select("id", { count: "exact", head: true }).eq("interview_id", interview.id);
    if (!count) {
      const { data: task } = await db.from("agent_tasks").select("output_json").eq("project_id", participant.project_id).eq("task_type", "primary_instruments").maybeSingle();
      const firstQuestion = task?.output_json?.interviewGuide?.questions?.[0]?.question;
      if (firstQuestion) await db.from("interview_messages").insert({ interview_id: interview.id, speaker: "agent", content: firstQuestion });
    }
    return NextResponse.json({ accepted: true, demo: false, consentedAt, interviewId: interview.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid consent" }, { status: 400 });
  }
}
