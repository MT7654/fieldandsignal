import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
const env=Object.fromEntries(fs.readFileSync(".env.local","utf8").split(/\r?\n/).filter(Boolean).map(line=>{const at=line.indexOf("=");return [line.slice(0,at),line.slice(at+1)]}));
const db=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SECRET_KEY,{auth:{persistSession:false},realtime:{transport:WebSocket}});
const fail=(label,error)=>{if(error)throw new Error(`${label}: ${error.message}`)};
const agents=[
  ["john-lim","John Lim","Research Director","Clarifies the decision and coordinates the engagement.","Decision framing and orchestration","#0E766E"],
  ["maya-chen","Maya Chen","Secondary Research Analyst","Investigates markets, customers, competitors and locations.","Published evidence","#477B9D"],
  ["aisha-rahman","Aisha Rahman","Research Methodologist","Designs primary-research methodology and sampling.","Study design","#C39B3B"],
  ["daniel-wong","Daniel Wong","Fieldwork Lead","Runs consent-based surveys and interviews.","Fieldwork operations","#E9785D"],
  ["sofia-tan","Sofia Tan","Insights Analyst","Analyses quantitative and qualitative evidence.","Integrated analysis","#76658D"],
  ["marcus-lee","Marcus Lee","Strategy Consultant","Turns findings into a business recommendation.","Strategy synthesis","#557A5D"],
].map(([slug,name,role,biography,specialisation,colour])=>({slug,name,role,biography,specialisation,avatar_path:`/agents/${slug}.webp`,colour,is_ai:true}));
fail("agents",(await db.from("agents").upsert(agents,{onConflict:"slug"})).error);
const project={id:"10000000-0000-0000-0000-000000000001",owner_id:null,title:"Northstar Cinemas expansion",business_question:"Should Northstar Cinemas open its next outlet in a heartland mall or a city-centre mall?",business_description:"Demonstration engagement for a cinema-location decision.",industry:"Cinema exhibition",geography:"Singapore",research_mode:"primary_secondary",objective:"Choose a location archetype",status:"fieldwork",current_phase:"survey_and_interviews",demo_mode:true};
fail("project",(await db.from("research_projects").upsert(project)).error);
fail("survey",(await db.from("surveys").upsert({id:"20000000-0000-0000-0000-000000000001",project_id:project.id,title:"Cinema location preferences",introduction:"Help Northstar understand how people choose a cinema.",public_token:"northstar-demo",status:"published",published_at:new Date().toISOString()})).error);
const questions=[
  ["21000000-0000-0000-0000-000000000001","single","How often do you visit a cinema?",["Weekly","Monthly","Every 2–3 months","Less often"],true,1],
  ["21000000-0000-0000-0000-000000000002","multiple","What most influences your choice of cinema?",["Travel time","Ticket price","Food and retail nearby","Premium screens","Family convenience"],true,2],
  ["21000000-0000-0000-0000-000000000003","rating","How appealing is a cinema in a regional heartland mall?",["1","2","3","4","5"],true,3],
  ["21000000-0000-0000-0000-000000000004","text","What would make you visit a new cinema more often?",null,false,4],
].map(([id,type,question,options_json,required,position])=>({id,survey_id:"20000000-0000-0000-0000-000000000001",type,question,options_json,required,position}));
fail("questions",(await db.from("survey_questions").upsert(questions)).error);
fail("participant",(await db.from("interview_participants").upsert({id:"30000000-0000-0000-0000-000000000001",project_id:project.id,name:"Demo participant",consent_source:"public consent screen",public_token:"northstar-jamie",status:"invited"})).error);
console.log("Seeded Field & Signal agents and public Northstar fieldwork records.");
