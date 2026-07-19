import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { databaseConfigured } from "@/lib/env";
import { projectInputSchema, researchPlanSchema } from "@/lib/schemas";
import { hashResearchToken, RESEARCH_SESSION_COOKIE } from "@/lib/research-session";
import type { StoredSecondaryResearchState } from "@/lib/secondary-research-types";
import { z } from "zod";

const approvalSchema = z.object({ project: projectInputSchema, plan: researchPlanSchema });

export async function POST(request: Request) {
  try {
    if (!databaseConfigured) return NextResponse.json({ error: "Research persistence is not configured." }, { status: 503 });
    const { project, plan } = approvalSchema.parse(await request.json());
    const db = createServerSupabase();
    const { data: researchProject, error: projectError } = await db.from("research_projects").insert({
      owner_id: null,
      title: plan.decisionStatement.slice(0, 120),
      business_question: project.businessQuestion,
      business_description: project.businessDescription,
      industry: project.industry,
      geography: project.geography,
      research_mode: project.researchMode,
      objective: project.objective || null,
      status: "approved",
      current_phase: "secondary_research",
      demo_mode: true,
    }).select("id").single();
    if (projectError || !researchProject) throw projectError ?? new Error("Could not create the live engagement");

    const { error: planError } = await db.from("research_plans").insert({ project_id: researchProject.id, version: 1, structured_plan_json: plan, status: "approved", approved_at: new Date().toISOString() });
    if (planError) throw planError;
    const { data: maya, error: agentError } = await db.from("agents").select("id").eq("slug", "maya-chen").single();
    if (agentError || !maya) throw agentError ?? new Error("Maya's agent record is unavailable");

    const token = randomBytes(24).toString("hex");
    const initialState: StoredSecondaryResearchState = {
      accessHash: hashResearchToken(token),
      status: "queued",
      phase: "queued",
      currentActivity: "Waiting to begin source discovery",
      plan: { decisionStatement: plan.decisionStatement, secondaryWorkstreams: plan.secondaryWorkstreams, evidenceGaps: plan.evidenceGaps },
      researchMode: project.researchMode,
      queries: [], candidates: [], sources: [],
      usage: { searchRequests: 0, pageFetches: 0, proxyRequests: 0, llmCalls: 0, estimatedInputTokens: 0, maxOutputTokens: 0 },
    };
    const { error: taskError } = await db.from("agent_tasks").insert({ project_id: researchProject.id, agent_id: maya.id, task_type: "secondary_research", title: "Find and assess published market evidence", description: plan.secondaryWorkstreams.map((item) => item.title).join("; "), status: "queued", progress: 0, output_json: initialState });
    if (taskError) throw taskError;

    const response = NextResponse.json({ approved: true });
    response.cookies.set(RESEARCH_SESSION_COOKIE, `${researchProject.id}.${token}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not approve the plan" }, { status: 400 });
  }
}
