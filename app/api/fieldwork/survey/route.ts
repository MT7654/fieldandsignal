import { NextResponse } from "next/server";
import { z } from "zod";
import { loadFieldworkContext } from "@/lib/fieldwork";

const editSchema = z.object({
  title: z.string().min(4).max(180),
  introduction: z.string().min(10).max(1200),
  questions: z.array(z.object({ id: z.string().uuid(), question: z.string().min(4).max(500), required: z.boolean(), options: z.array(z.string().min(1).max(160)).max(12) })).min(6).max(14),
});
export async function PATCH(request: Request) {
  try {
    const input = editSchema.parse(await request.json());
    const { db, survey, questions } = await loadFieldworkContext();
    if (!survey || survey.status !== "draft") return NextResponse.json({ error: "Only a draft survey can be edited" }, { status: 409 });
    if (input.questions.some((item) => !questions.some((question) => question.id === item.id))) return NextResponse.json({ error: "Question set does not match this survey" }, { status: 400 });
    const { error: surveyError } = await db.from("surveys").update({ title: input.title, introduction: input.introduction }).eq("id", survey.id);
    if (surveyError) throw surveyError;
    for (const [index, question] of input.questions.entries()) {
      const { error } = await db.from("survey_questions").update({ question: question.question, required: question.required, options_json: question.options, position: index + 1 }).eq("id", question.id).eq("survey_id", survey.id);
      if (error) throw error;
    }
    return NextResponse.json({ saved: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save survey" }, { status: 400 }); }
}
