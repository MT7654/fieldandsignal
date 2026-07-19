import { NextResponse } from "next/server";
import { z } from "zod";
import { agentDefinitions } from "@/lib/agents";
import { structuredInference } from "@/lib/inference";
import { databaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase";

const input=z.object({token:z.string().min(10).max(128),messages:z.array(z.object({speaker:z.enum(["Daniel","You"]),text:z.string().max(3000)})).max(30),approvedGuide:z.array(z.string()).min(1),stopping:z.boolean().optional()});
const output=z.object({message:z.string(),complete:z.boolean(),summary:z.string().optional(),themes:z.array(z.string()).optional()});

export async function POST(request:Request){try{const data=input.parse(await request.json());const result=data.stopping?{message:"Thank you. I’ve stopped the interview as requested.",complete:true}:await structuredInference(`${agentDefinitions.fieldwork.system} Ask one concise question. Avoid questions already answered. If the guide is complete, end politely and provide a short summary and themes.`,data,output,"interview_reply","{message:string,complete:boolean,summary?:string,themes?:string[]}",{maxTokens:900});if(databaseConfigured){const db=createServerSupabase();const {data:participant}=await db.from("interview_participants").select("id").eq("public_token",data.token).single();if(participant){const {data:interview}=await db.from("interviews").select("id").eq("participant_id",participant.id).eq("status","in_progress").maybeSingle();if(interview){const last=data.messages.at(-1);if(last?.speaker==="You")await db.from("interview_messages").insert({interview_id:interview.id,speaker:"participant",content:last.text});await db.from("interview_messages").insert({interview_id:interview.id,speaker:"agent",content:result.message});if(result.complete)await db.from("interviews").update({status:"complete",completed_at:new Date().toISOString(),summary:"summary" in result?result.summary??null:null,themes_json:"themes" in result?result.themes??[]:[]}).eq("id",interview.id)}}}return NextResponse.json(result)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Interview inference failed"},{status:502})}}
