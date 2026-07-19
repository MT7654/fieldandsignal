import { NextResponse } from "next/server";
import { loadFieldworkContext } from "@/lib/fieldwork";

export async function POST() {
  try {
    const { db, survey } = await loadFieldworkContext();
    if (!survey) return NextResponse.json({ error: "Generate the questionnaire first" }, { status: 400 });
    const { error } = await db.from("surveys").update({ status: "published", published_at: new Date().toISOString() }).eq("id", survey.id);
    if (error) throw error;
    return NextResponse.json({ published: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not publish survey" }, { status: 400 });
  }
}
