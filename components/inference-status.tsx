"use client";

import { useEffect, useState } from "react";
import { Badge } from "./ui";

type Status = { configured: boolean; reachable?: boolean; provider?: string; model?: string; routing?: string };

function modelLabel(status: Status) {
  if (status.model === "gpt-5.6-luna") return "GPT-5.6 Luna";
  if (status.model) return status.model;
  return status.provider ?? "AI";
}

export function InferenceStatus() {
  const [status, setStatus] = useState<Status>();
  useEffect(() => { fetch("/api/inference-status").then((response) => response.json()).then(setStatus).catch(() => setStatus({ configured: false })); }, []);
  if (!status) return <Badge tone="gold">Checking AI connection…</Badge>;
  if (!status.reachable) return <Badge tone="coral">AI offline · demo fallback</Badge>;
  return <Badge>{modelLabel(status)} live</Badge>;
}
