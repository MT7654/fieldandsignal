import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { env } from "./env";
import { hfStructured } from "./huggingface";
import { researchPlanSchema, briefSchema } from "./schemas";

export const agentDefinitions = {
  director: { name: "John Lim", system: "You are the AI Research Director. Clarify a business decision and produce a bounded, approval-gated research plan. State limitations. Do not begin fieldwork." },
  secondary: { name: "Maya Chen", system: "You are the AI Secondary Research Analyst. Use only supplied or tool-retrieved sources. Never invent citations or URLs. Record reliability and claim support." },
  methodologist: { name: "Aisha Rahman", system: "You are the AI Research Methodologist. Design proportionate surveys and interviews. Minimise personal data and surface sampling limitations." },
  fieldwork: { name: "Daniel Wong", system: "You are the AI Fieldwork Lead. Interview only consenting participants, one question at a time, within the approved guide. Respect skip and stop immediately." },
  insights: { name: "Sofia Tan", system: "You are the AI Insights Analyst. Use only supplied evidence and responses. Separate observation, respondent statement, interpretation and inference." },
  strategy: { name: "Marcus Lee", system: "You are the AI Strategy Consultant. Recommend based only on linked evidence. Include risks, change conditions, next actions and limitations." },
} as const;

function client(){ if(!env.OPENAI_API_KEY) throw new Error("OpenAI is not configured; use demo mode."); return new OpenAI({ apiKey: env.OPENAI_API_KEY }); }
export async function generateResearchPlan(input: unknown){
  if(env.HF_TOKEN)return hfStructured(agentDefinitions.director.system,input,researchPlanSchema,"{decisionStatement:string,objectives:string[],hypotheses:string[],secondaryWorkstreams:{title:string,evidenceExpected:string[]}[],evidenceGaps:string[],primaryMethodology:string,targetRespondents:string,sampleSizeRecommendation:string,timeline:string,estimatedOperationalCosts:string,deliverables:string[],limitations:string[]}");
  const response = await client().responses.parse({ model: env.OPENAI_MODEL, instructions: agentDefinitions.director.system, input: JSON.stringify(input), text: { format: zodTextFormat(researchPlanSchema, "research_plan") } });
  if(!response.output_parsed) throw new Error("Research plan returned no structured output"); return response.output_parsed;
}
export async function generateBrief(evidence: unknown){
  if(env.HF_TOKEN)return hfStructured(agentDefinitions.strategy.system,evidence,briefSchema,"{executiveRecommendation:string,rationale:string[],risks:string[],changeConditions:string[],nextActions:string[],evidenceLinks:{claimId:string,evidenceType:'source'|'survey_result'|'transcript_excerpt',evidenceId:string,interpretation?:string}[]}");
  const response = await client().responses.parse({ model: env.OPENAI_MODEL, instructions: agentDefinitions.strategy.system, input: JSON.stringify(evidence), text: { format: zodTextFormat(briefSchema, "strategic_brief") } });
  if(!response.output_parsed) throw new Error("Brief returned no structured output"); return response.output_parsed;
}
