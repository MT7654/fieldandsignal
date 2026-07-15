import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
const env=Object.fromEntries(fs.readFileSync(".env.local","utf8").split(/\r?\n/).filter(Boolean).map(line=>{const at=line.indexOf("=");return [line.slice(0,at),line.slice(at+1)]}));
const db=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SECRET_KEY,{auth:{persistSession:false},realtime:{transport:WebSocket}});
const tables=["profiles","agents","research_projects","clarifying_questions","research_plans","agent_tasks","sources","surveys","survey_questions","survey_responses","survey_answers","interview_participants","interviews","interview_messages","research_findings","research_briefs","agent_activity"];
let ready=true;
for(const table of tables){const {error}=await db.from(table).select("*").limit(1);console.log(`${error?"MISSING":"READY"} ${table}${error?` (${error.code})`:""}`);if(error)ready=false}
if(!ready)process.exitCode=1;
