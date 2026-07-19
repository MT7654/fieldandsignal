import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default("gpt-5.6"),
  HF_TOKEN: z.string().startsWith("hf_").optional(),
  HF_MODEL: z.string().default("Qwen/Qwen3.6-35B-A3B:featherless-ai"),
  OXYLABS_USERNAME: z.string().min(1).optional(),
  OXYLABS_PASSWORD: z.string().min(1).optional(),
  OXYLABS_PROXY_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().startsWith("sb_publishable_").optional(),
  SUPABASE_SECRET_KEY: z.string().startsWith("sb_secret_").optional(),
  SUPABASE_JWKS_URL: z.string().url().optional(),
});

export const env = envSchema.parse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  HF_TOKEN: process.env.HF_TOKEN,
  HF_MODEL: process.env.HF_MODEL,
  OXYLABS_USERNAME: process.env.OXYLABS_USERNAME,
  OXYLABS_PASSWORD: process.env.OXYLABS_PASSWORD,
  OXYLABS_PROXY_URL: process.env.OXYLABS_PROXY_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_JWKS_URL: process.env.SUPABASE_JWKS_URL,
});
export const inferenceConfigured = Boolean(env.HF_TOKEN || env.OPENAI_API_KEY);
export const databaseConfigured = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SECRET_KEY);
export const secondaryResearchConfigured = Boolean(env.OXYLABS_USERNAME && env.OXYLABS_PASSWORD && env.OXYLABS_PROXY_URL && databaseConfigured);
export const demoMode = !inferenceConfigured || !databaseConfigured;
