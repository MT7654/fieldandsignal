import { z, type ZodType } from "zod";
import { env } from "./env";

const completionSchema=z.object({choices:z.array(z.object({message:z.object({content:z.string()})})).min(1)});
type Message={role:"system"|"user"|"assistant";content:string};

export function extractJson(text:string){
  const fenced=text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const source=(fenced??text).trim();
  const start=source.indexOf("{");
  if(start<0)throw new SyntaxError("The response did not contain a JSON object.");
  let depth=0,end=-1,inString=false,escaped=false;
  for(let index=start;index<source.length;index++){
    const character=source[index];
    if(inString){if(escaped)escaped=false;else if(character==="\\")escaped=true;else if(character==='"')inString=false;continue}
    if(character==='"'){inString=true;continue}
    if(character==="{")depth++;
    if(character==="}"&&--depth===0){end=index;break}
  }
  if(end<start)throw new SyntaxError("The JSON object was cut off before its closing brace.");
  return JSON.parse(source.slice(start,end+1));
}

export function structuredRetryInstruction(error:unknown){
  const detail=error instanceof Error?error.message:"unknown validation error";
  const syntax=error instanceof SyntaxError;
  return `Previous ${syntax?"JSON syntax":"schema validation"} error: ${detail}\n${syntax?"The response may have been truncated. Regenerate the complete object from the input; do not continue the previous response.":"Correct the reported field types."} Keep the JSON compact: use 2-4 concise items per list, no prose outside JSON, and no markdown.`;
}

export async function hfChat(messages:Message[],options?:{maxTokens?:number;temperature?:number}){
  if(!env.HF_TOKEN) throw new Error("Hugging Face inference is not configured");
  const response=await fetch("https://router.huggingface.co/v1/chat/completions",{method:"POST",headers:{authorization:`Bearer ${env.HF_TOKEN}`,"content-type":"application/json"},signal:AbortSignal.timeout(180_000),body:JSON.stringify({model:env.HF_MODEL,messages,temperature:options?.temperature??0.3,top_p:0.8,presence_penalty:1.2,top_k:20,chat_template_kwargs:{enable_thinking:false},max_tokens:options?.maxTokens??700})});
  if(!response.ok){const requestId=response.headers.get("x-request-id");throw new Error(`Hugging Face inference failed (${response.status})${requestId?` [${requestId}]`:""}`)}
  return completionSchema.parse(await response.json()).choices[0].message.content;
}

export async function hfStructured<T>(system:string,input:unknown,schema:ZodType<T>,schemaDescription:string){
  const prompt=`Return only one complete, valid JSON object. No markdown or commentary. Keep values concise and use 2-4 items per list so the entire object fits in one response. JSON contract: ${schemaDescription}\nInput: ${JSON.stringify(input)}`;
  let lastError:unknown;
  for(let attempt=0;attempt<2;attempt++){try{const correction=attempt>0?`\n${structuredRetryInstruction(lastError)}`:"";return schema.parse(extractJson(await hfChat([{role:"system",content:system},{role:"user",content:`${prompt}${correction}`}],{maxTokens:2800,temperature:0.1})))}catch(error){lastError=error}}
  throw new Error(`The model did not return valid structured output: ${lastError instanceof Error?lastError.message:"unknown error"}`);
}

export const hfStatus=()=>({provider:"Hugging Face Inference Providers",model:env.HF_MODEL,routing:env.HF_MODEL.split(":")[1]??"automatic"});
