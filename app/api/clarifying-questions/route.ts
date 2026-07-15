import { NextResponse } from "next/server";
import { z } from "zod";
import { agentDefinitions } from "@/lib/agents";
import { hfStructured } from "@/lib/huggingface";
const output=z.object({questions:z.array(z.string()).min(3).max(5)});
export async function POST(request:Request){try{return NextResponse.json(await hfStructured(`${agentDefinitions.director.system} Ask only the most decision-relevant clarifying questions.`,await request.json(),output,"{questions:string[3..5]}"));}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Inference failed"},{status:502})}}
