import { NextResponse } from "next/server";
import { loadFieldworkContext, publicUrl } from "@/lib/fieldwork";

export async function GET(request: Request) {
  try {
    const context = await loadFieldworkContext();
    const { project, plan, instrumentTask, survey, questions, responses, answers, participants, interviews, messages } = context;
    return NextResponse.json({
      project,
      plan,
      instrument: instrumentTask?.output_json ?? null,
      instrumentStatus: instrumentTask?.status ?? "not_started",
      survey: survey ? { ...survey, sharePath: `/survey/${survey.public_token}`, shareUrl: publicUrl(`/survey/${survey.public_token}`, request) } : null,
      questions,
      responses,
      answers,
      participants: participants.map((participant) => ({ ...participant, interviewPath: `/interview/${participant.public_token}`, interviewUrl: publicUrl(`/interview/${participant.public_token}`, request) })),
      interviews,
      messages,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load fieldwork" }, { status: 401 });
  }
}
