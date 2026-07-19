import { NextResponse } from "next/server";
import { inferenceConfigured } from "@/lib/env";
import { reviseResearchPlan } from "@/lib/agents";
import { planRevisionRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const input = planRevisionRequestSchema.parse(await request.json());
    if (!inferenceConfigured) return NextResponse.json({ error: "No inference provider is configured." }, { status: 503 });
    return NextResponse.json({ plan: await reviseResearchPlan(input) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to revise plan" }, { status: 400 });
  }
}
