import "server-only";

import { resolveResearchSession } from "./research-session";

export async function loadFieldworkContext() {
  const session = await resolveResearchSession();
  const { db, projectId } = session;
  const [projectResult, planResult, instrumentTaskResult, surveyResult, participantsResult] = await Promise.all([
    db.from("research_projects").select("*").eq("id", projectId).single(),
    db.from("research_plans").select("structured_plan_json,version,status").eq("project_id", projectId).order("version", { ascending: false }).limit(1).single(),
    db.from("agent_tasks").select("id,status,progress,output_json").eq("project_id", projectId).eq("task_type", "primary_instruments").maybeSingle(),
    db.from("surveys").select("*").eq("project_id", projectId).maybeSingle(),
    db.from("interview_participants").select("*").eq("project_id", projectId).order("status"),
  ]);
  if (projectResult.error || !projectResult.data) throw projectResult.error ?? new Error("Project not found");
  if (planResult.error || !planResult.data) throw planResult.error ?? new Error("Approved plan not found");

  const survey = surveyResult.data;
  let questions: Record<string, unknown>[] = [];
  let responses: Record<string, unknown>[] = [];
  let answers: Record<string, unknown>[] = [];
  if (survey) {
    const [questionResult, responseResult] = await Promise.all([
      db.from("survey_questions").select("*").eq("survey_id", survey.id).order("position"),
      db.from("survey_responses").select("*").eq("survey_id", survey.id).order("completed_at", { ascending: false }),
    ]);
    questions = questionResult.data ?? [];
    responses = responseResult.data ?? [];
    const responseIds = responses.map((item) => String(item.id));
    if (responseIds.length) answers = (await db.from("survey_answers").select("*").in("response_id", responseIds)).data ?? [];
  }

  const participants = participantsResult.data ?? [];
  const participantIds = participants.map((item) => String(item.id));
  const interviews = participantIds.length ? (await db.from("interviews").select("*").in("participant_id", participantIds).order("started_at", { ascending: false })).data ?? [] : [];
  const interviewIds = interviews.map((item) => String(item.id));
  const messages = interviewIds.length ? (await db.from("interview_messages").select("*").in("interview_id", interviewIds).order("created_at")).data ?? [] : [];

  return {
    ...session,
    project: projectResult.data,
    plan: planResult.data.structured_plan_json,
    instrumentTask: instrumentTaskResult.data,
    survey,
    questions,
    responses,
    answers,
    participants,
    interviews,
    messages,
  };
}

export function publicUrl(path: string, requestUrl?: string) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || (requestUrl ? new URL(requestUrl).origin : "http://localhost:3000");
  return `${origin}${path}`;
}
