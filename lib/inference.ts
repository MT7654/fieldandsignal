import "server-only";

import OpenAI from "openai";
import type { ZodType } from "zod";
import { env } from "./env";
import { extractJson, hfChat, hfStatus, hfStructured, structuredRetryInstruction } from "./huggingface";

let openAIClient: OpenAI | undefined;
export function getOpenAIClient() {
  if (!env.OPENAI_API_KEY) throw new Error("OpenAI is not configured");
  openAIClient ??= new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return openAIClient;
}

export async function structuredInference<T>(system: string, input: unknown, schema: ZodType<T>, schemaName: string, schemaDescription: string, options?: { maxTokens?: number; attempts?: number }) {
  if (!env.OPENAI_API_KEY) return hfStructured(system, input, schema, schemaDescription, options);
  const prompt = `Return only one complete JSON object matching this contract: ${schemaDescription}\nInput: ${JSON.stringify(input)}`;
  let lastError: unknown;
  for (let attempt = 0; attempt < (options?.attempts ?? 2); attempt++) {
    try {
      const correction = attempt ? `\n${structuredRetryInstruction(lastError)}` : "";
      const response = await getOpenAIClient().responses.create({
        model: env.OPENAI_MODEL,
        instructions: `${system}\nThe response is machine-consumed. Return JSON only, without markdown or commentary.`,
        input: `${prompt}${correction}`,
        max_output_tokens: options?.maxTokens ?? 2800,
        reasoning: { effort: "low" },
        store: false,
        text: { format: { type: "json_object" } },
        metadata: { schema: schemaName },
      });
      return schema.parse(extractJson(response.output_text));
    } catch (error) { lastError = error; }
  }
  throw new Error(`OpenAI did not return valid structured output: ${lastError instanceof Error ? lastError.message : "unknown error"}`);
}

export async function inferenceHealthCheck() {
  if (env.OPENAI_API_KEY) {
    const response = await getOpenAIClient().responses.create({ model: env.OPENAI_MODEL, input: "Reply with exactly: ready", max_output_tokens: 120, reasoning: { effort: "low" }, store: false });
    return { configured: true, provider: "OpenAI", model: env.OPENAI_MODEL, reachable: response.output_text.toLowerCase().includes("ready") };
  }
  if (env.HF_TOKEN) {
    const reply = await hfChat([{ role: "system", content: "Reply with exactly: ready" }, { role: "user", content: "Health check" }], { maxTokens: 40, temperature: 0.1 });
    return { configured: true, ...hfStatus(), reachable: reply.toLowerCase().includes("ready") };
  }
  return { configured: false, reachable: false };
}
