import { NextResponse } from "next/server";
import { inferenceConfigured } from "@/lib/env";
import { generateResearchPlan } from "@/lib/agents";
import { projectInputSchema } from "@/lib/schemas";

export async function POST(request: Request){try{const input=projectInputSchema.passthrough().parse(await request.json());if(!inferenceConfigured)return NextResponse.json({error:"No inference provider is configured."},{status:503});return NextResponse.json({demo:false,plan:await generateResearchPlan(input)});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to generate plan"},{status:400})}}
