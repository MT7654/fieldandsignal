import { notFound } from "next/navigation";
import { databaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase";
import { InterviewExperience } from "./interview-experience";

export default async function InterviewPage({ params }: { params: Promise<{ publicToken: string }> }) {
  const { publicToken } = await params;
  if (publicToken === "northstar-jamie") return <InterviewExperience token={publicToken} study={{ title: "Cinema location study", introduction: "A conversation about how people choose cinema locations.", firstQuestion: "When did you last visit a cinema, and what shaped your choice of venue?", participantName: "Practice participant", demo: true }} />;
  if (!databaseConfigured) notFound();
  const db = createServerSupabase();
  const { data: participant } = await db.from("interview_participants").select("id,project_id,name,status").eq("public_token", publicToken).maybeSingle();
  if (!participant) notFound();
  const [{ data: project }, { data: task }] = await Promise.all([
    db.from("research_projects").select("title,business_question").eq("id", participant.project_id).single(),
    db.from("agent_tasks").select("output_json").eq("project_id", participant.project_id).eq("task_type", "primary_instruments").maybeSingle(),
  ]);
  const guide = task?.output_json?.interviewGuide;
  if (!guide) notFound();
  return <InterviewExperience token={publicToken} study={{ title: guide.title || project?.title || "Research interview", introduction: guide.introduction || project?.business_question || "", firstQuestion: guide.questions?.[0]?.question || "Could you tell me about your recent experience?", participantName: participant.name || "Participant", demo: false }} />;
}
