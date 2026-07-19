import { NextResponse } from "next/server";
import { z } from "zod";
import { directorConsultationInstructions } from "@/lib/agents";
import { structuredInference } from "@/lib/inference";
const output=z.object({questions:z.array(z.string()).min(3).max(5)});
export async function POST(request:Request){try{return NextResponse.json(await structuredInference(directorConsultationInstructions,await request.json(),output,"clarifying_questions","{questions:string[3..4]}. Each item must be a short plain-language question. If a question asks for a figure, say that an estimate or 'I don't know' is acceptable.",{maxTokens:900}));}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Inference failed"},{status:502})}}
