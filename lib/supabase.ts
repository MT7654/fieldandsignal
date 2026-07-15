import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export function createServerSupabase(){
  if(!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SECRET_KEY) throw new Error("Supabase server credentials are not configured");
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
