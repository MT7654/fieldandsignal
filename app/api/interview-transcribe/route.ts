import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getOpenAIClient } from "@/lib/inference";
import { createServerSupabase } from "@/lib/supabase";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    if (!env.OPENAI_API_KEY) return NextResponse.json({ error: "Voice transcription is not configured" }, { status: 503 });
    const form = await request.formData();
    const audio = form.get("audio");
    const referer = request.headers.get("referer");
    const token = String(form.get("token") ?? (referer ? new URL(referer).pathname.split("/").filter(Boolean).at(-1) : ""));
    if (token !== "northstar-jamie") { const db=createServerSupabase(); const {data:participant}=await db.from("interview_participants").select("id,status").eq("public_token",token).maybeSingle(); if(!participant||participant.status!=="in_progress") return NextResponse.json({error:"Active interview session not found"},{status:401}); }
    if (!(audio instanceof File) || audio.size === 0) return NextResponse.json({ error: "No recording received" }, { status: 400 });
    if (audio.size > 12 * 1024 * 1024) return NextResponse.json({ error: "Recording is too large; keep each answer under a few minutes" }, { status: 413 });
    const transcript = await getOpenAIClient().audio.transcriptions.create({ file: audio, model: env.OPENAI_TRANSCRIBE_MODEL });
    return NextResponse.json({ text: transcript.text });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Transcription failed" }, { status: 502 });
  }
}
