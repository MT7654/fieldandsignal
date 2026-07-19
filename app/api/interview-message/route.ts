import { NextResponse } from "next/server";
import { z } from "zod";
import { agentDefinitions } from "@/lib/agents";
import { databaseConfigured } from "@/lib/env";
import { structuredInference } from "@/lib/inference";
import { createServerSupabase } from "@/lib/supabase";
export const maxDuration = 60;

const inputSchema = z.object({ token: z.string().min(10).max(128), answer: z.string().max(5000).optional(), stopping: z.boolean().optional().default(false) });
const outputSchema = z.object({ message: z.string(), complete: z.boolean(), summary: z.string().optional(), themes: z.array(z.string()).optional(), guideCoverage: z.number().min(0).max(100).optional() });
const demoGuide = ["Recent cinema visit and venue choice", "Effect of travel time and occasion", "Heartland versus city-centre trade-offs", "Conditions that would change the preference"];

export async function POST(request: Request) {
  try {
    const input = inputSchema.parse(await request.json());
    let guide: unknown = demoGuide;
    let projectContext: unknown = { businessQuestion: "How do people choose between heartland and city-centre cinemas?" };
    let interviewId: string | undefined;
    let transcript: { speaker: string; content: string }[] = [];
    const demo = input.token === "northstar-jamie" || !databaseConfigured;
    const db = demo ? null : createServerSupabase();
    if (db) {
      const { data: participant } = await db.from("interview_participants").select("id,project_id").eq("public_token", input.token).single();
      if (!participant) return NextResponse.json({ error: "Interview invitation not found" }, { status: 404 });
      const [{ data: project }, { data: task }, { data: interview }] = await Promise.all([
        db.from("research_projects").select("business_question,business_description,industry,geography,objective").eq("id", participant.project_id).single(),
        db.from("agent_tasks").select("output_json").eq("project_id", participant.project_id).eq("task_type", "primary_instruments").single(),
        db.from("interviews").select("id,status").eq("participant_id", participant.id).eq("status", "in_progress").maybeSingle(),
      ]);
      if (!interview) return NextResponse.json({ error: "Record consent before beginning" }, { status: 409 });
      interviewId = interview.id;
      projectContext = project;
      guide = task?.output_json?.interviewGuide ?? demoGuide;
      transcript = (await db.from("interview_messages").select("speaker,content").eq("interview_id", interview.id).order("created_at")).data ?? [];
      if (input.answer?.trim()) { await db.from("interview_messages").insert({ interview_id: interview.id, speaker: "participant", content: input.answer.trim() }); transcript.push({ speaker: "participant", content: input.answer.trim() }); }
    } else if (input.answer) transcript = [{ speaker: "participant", content: input.answer }];

    const result = input.stopping ? { message: "Thank you. I’ve stopped the interview as requested.", complete: true, summary: "The participant chose to stop the interview.", themes: [] } : await structuredInference(
      `${agentDefinitions.fieldwork.system} You are conducting a spoken, semi-structured interview. Ask exactly one short, natural question at a time. Acknowledge the participant briefly only when useful. Probe what they actually said, do not repeat answered questions, accept 'I don't know', and stay within the server-approved guide. If the guide is sufficiently covered or 10 substantive answers have been given, close politely. Never claim the participant said something absent from the transcript.`,
      { projectContext, approvedGuide: guide, transcript }, outputSchema, "interview_turn", "{message:string,complete:boolean,summary?:string,themes?:string[],guideCoverage?:number}", { maxTokens: 850, attempts: 3 },
    );
    if (db && interviewId) {
      await db.from("interview_messages").insert({ interview_id: interviewId, speaker: "agent", content: result.message });
      if (result.complete) {
        await db.from("interviews").update({ status: "complete", completed_at: new Date().toISOString(), summary: result.summary ?? null, themes_json: result.themes ?? [] }).eq("id", interviewId);
      }
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Interview inference failed" }, { status: 502 });
  }
}
