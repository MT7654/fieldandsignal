import { NextResponse } from "next/server";
import { databaseConfigured } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase";
export async function GET(){if(!databaseConfigured)return NextResponse.json({configured:false,reachable:false,schemaReady:false},{status:503});try{const {data,error}=await createServerSupabase().from("agents").select("id").limit(20);if(error)return NextResponse.json({configured:true,reachable:true,schemaReady:false,error:error.code},{status:503});return NextResponse.json({configured:true,reachable:true,schemaReady:true,agents:data?.length??0})}catch{return NextResponse.json({configured:true,reachable:false,schemaReady:false},{status:502})}}
