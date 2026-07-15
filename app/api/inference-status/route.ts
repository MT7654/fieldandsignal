import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { hfChat, hfStatus } from "@/lib/huggingface";
export async function GET(){if(!env.HF_TOKEN)return NextResponse.json({configured:false},{status:503});try{const reply=await hfChat([{role:"system",content:"Reply with exactly: ready"},{role:"user",content:"Health check"}],{maxTokens:40,temperature:0.1});return NextResponse.json({configured:true,...hfStatus(),reachable:reply.toLowerCase().includes("ready")});}catch(error){return NextResponse.json({configured:true,...hfStatus(),reachable:false,error:error instanceof Error?error.message:"Inference failed"},{status:502})}}
