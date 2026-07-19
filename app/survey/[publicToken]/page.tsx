import { notFound } from "next/navigation";
import { databaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase";
import { surveyQuestions } from "@/lib/demo-data";
import { PublicSurvey } from "./public-survey";

export default async function SurveyPage({ params }: { params: Promise<{ publicToken: string }> }) {
  const { publicToken } = await params;
  if (publicToken === "northstar-demo") return <PublicSurvey demo token={publicToken} survey={{ title: "How people choose a cinema", introduction: "Help us understand the occasions, trade-offs and practical factors that shape cinema choice.", projectTitle: "Northstar Cinemas", estimatedMinutes: 4, questions: surveyQuestions.map((q, index) => ({ ...q, options_json: q.options, position: index + 1 })) }} />;
  if (!databaseConfigured) notFound();
  const db = createServerSupabase();
  const { data: survey } = await db.from("surveys").select("id,title,introduction,project_id,status").eq("public_token", publicToken).eq("status", "published").maybeSingle();
  if (!survey) notFound();
  const [{ data: project }, { data: questions }] = await Promise.all([
    db.from("research_projects").select("title").eq("id", survey.project_id).single(),
    db.from("survey_questions").select("id,type,question,options_json,required,position").eq("survey_id", survey.id).order("position"),
  ]);
  return <PublicSurvey token={publicToken} survey={{ title: survey.title, introduction: survey.introduction ?? "", projectTitle: project?.title ?? "Field & Signal study", estimatedMinutes: 4, questions: questions ?? [] }} />;
}
