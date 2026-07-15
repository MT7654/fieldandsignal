/**
 * Full visual demo data is defined in lib/demo-data.ts so the app works without credentials.
 * In a configured environment, copy the same labelled records into Supabase under an authenticated owner.
 * Usage: npx tsx scripts/seed-demo.ts <owner-uuid>
 */
import { createClient } from "@supabase/supabase-js";
const ownerId=process.argv[2]; const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.SUPABASE_SECRET_KEY;
if(!ownerId||!url||!key) throw new Error("owner UUID and Supabase environment variables are required");
const db=createClient(url,key);
const {error}=await db.from("research_projects").insert({owner_id:ownerId,title:"Northstar Cinemas expansion",business_question:"Should Northstar Cinemas open its next outlet in a heartland mall or a city-centre mall?",business_description:"Demonstration engagement for a cinema location decision.",industry:"Cinema exhibition",geography:"Singapore",research_mode:"primary_secondary",objective:"Choose a location archetype",status:"analysis",current_phase:"integrated_analysis",demo_mode:true});
if(error) throw error; console.log("Seeded labelled Northstar demonstration project.");
