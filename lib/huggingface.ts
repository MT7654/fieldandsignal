import { z, type ZodType } from "zod";
import { env } from "./env";

const completionSchema=z.object({choices:z.array(z.object({message:z.object({content:z.string()})})).min(1)});
type Message={role:"system"|"user"|"assistant";content:string};

export function extractJson(text:string){const fenced=text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];const candidate=fenced??text.slice(text.indexOf("{"),text.lastIndexOf("}")+1);return JSON.parse(candidate)}

export async function hfChat(messages:Message[],options?:{maxTokens?:number;temperature?:number}){
  if(!env.HF_TOKEN) throw new Error("Hugging Face inference is not configured");
  const response=await fetch("https://router.huggingface.co/v1/chat/completions",{method:"POST",headers:{authorization:`Bearer ${env.HF_TOKEN}`,"content-type":"application/json"},signal:AbortSignal.timeout(180_000),body:JSON.stringify({model:env.HF_MODEL,messages,temperature:options?.temperature??0.3,top_p:0.8,presence_penalty:1.2,top_k:20,chat_template_kwargs:{enable_thinking:false},max_tokens:options?.maxTokens??700})});
  if(!response.ok){const requestId=response.headers.get("x-request-id");throw new Error(`Hugging Face inference failed (${response.status})${requestId?` [${requestId}]`:""}`)}
  return completionSchema.parse(await response.json()).choices[0].message.content;
}

export async function hfStructured<T>(system:string,input:unknown,schema:ZodType<T>,schemaDescription:string){
  const prompt=`Return only one valid JSON object. No markdown or commentary. JSON contract: ${schemaDescription}\nInput: ${JSON.stringify(input)}`;
  let lastError:unknown;
  for(let attempt=0;attempt<2;attempt++){try{return schema.parse(extractJson(await hfChat([{role:"system",content:system},{role:"user",content:attempt===0?prompt:`${prompt}\nYour previous response was invalid. Produce smaller, strictly valid JSON.`}],{maxTokens:1100,temperature:0.1})))}catch(error){lastError=error}}
  throw new Error(`The model did not return valid structured output: ${lastError instanceof Error?lastError.message:"unknown error"}`);
}

export const hfStatus=()=>({provider:"Hugging Face Inference Providers",model:env.HF_MODEL,routing:env.HF_MODEL.split(":")[1]??"automatic"});
