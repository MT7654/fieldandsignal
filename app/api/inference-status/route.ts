import { NextResponse } from "next/server";
import { inferenceHealthCheck } from "@/lib/inference";
export async function GET(){try{const result=await inferenceHealthCheck();return NextResponse.json(result,{status:result.configured?200:503});}catch(error){return NextResponse.json({configured:true,reachable:false,error:error instanceof Error?error.message:"Inference failed"},{status:502})}}
