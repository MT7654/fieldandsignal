import "server-only";

import { createHash } from "crypto";
import { cookies } from "next/headers";
import { createServerSupabase } from "./supabase";
import type { StoredSecondaryResearchState } from "./secondary-research-types";

export const RESEARCH_SESSION_COOKIE = "field_signal_research_session";
export const hashResearchToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function resolveResearchSession() {
  const value = (await cookies()).get(RESEARCH_SESSION_COOKIE)?.value;
  const [projectId, token] = value?.split(".") ?? [];
  if (!projectId || !token) throw new Error("Live research session not found");
  const db = createServerSupabase();
  const { data: task, error } = await db.from("agent_tasks").select("id,project_id,status,progress,output_json").eq("project_id", projectId).eq("task_type", "secondary_research").maybeSingle();
  if (error || !task) throw new Error("Secondary research task not found");
  const state = task.output_json as StoredSecondaryResearchState;
  if (!state?.accessHash || state.accessHash !== hashResearchToken(token)) throw new Error("Live research session is invalid");
  return { db, task, state, projectId };
}

export function publicResearchState(state: StoredSecondaryResearchState) {
  const { accessHash: _accessHash, ...safe } = state;
  void _accessHash;
  return safe;
}
