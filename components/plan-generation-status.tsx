"use client";

import { useEffect, useState } from "react";
import { AgentAvatar } from "./agent-avatar";
import { Check, LoaderCircle } from "lucide-react";

type Mode = "create" | "revise";

const stages: Record<Mode, { at: number; label: string }[]> = {
  create: [
    { at: 0, label: "Reviewing your answers and decision context" },
    { at: 8, label: "Framing the research objectives and evidence gaps" },
    { at: 20, label: "Designing proportionate research workstreams" },
    { at: 35, label: "Estimating timing, costs and trade-offs" },
    { at: 55, label: "Checking the plan structure for completeness" },
    { at: 90, label: "Still working — complex plans can take a little longer" },
  ],
  revise: [
    { at: 0, label: "Reviewing your requested changes" },
    { at: 8, label: "Protecting the essential research safeguards" },
    { at: 20, label: "Rebalancing scope, timing and budget" },
    { at: 35, label: "Updating costs and methodological trade-offs" },
    { at: 55, label: "Checking the revised plan for completeness" },
    { at: 90, label: "Still working — complex revisions can take a little longer" },
  ],
};

export function generationStageAt(mode: Mode, elapsed: number) {
  return [...stages[mode]].reverse().find((stage) => elapsed >= stage.at) ?? stages[mode][0];
}

export function formatGenerationElapsed(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

export function PlanGenerationStatus({ mode }: { mode: Mode }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeStage = generationStageAt(mode, elapsed);
  const activeIndex = stages[mode].indexOf(activeStage);

  return (
    <aside className="generation-status" aria-live="polite" aria-busy="true">
      <div className="generation-status-head">
        <AgentAvatar slug="john-lim" size="sm" />
        <div><span>John is actively working</span><strong>{mode === "create" ? "Building your research plan" : "Revising your research plan"}</strong></div>
        <LoaderCircle className="generation-spinner" aria-hidden="true" />
      </div>
      <div className="generation-track" aria-hidden="true"><span /></div>
      <div className="generation-stage">
        <span className="generation-pulse" aria-hidden="true" />
        <p>{activeStage.label}</p>
        <time aria-hidden="true">{formatGenerationElapsed(elapsed)}</time>
      </div>
      <ol className="generation-checkpoints" aria-label="Plan generation progress">
        {stages[mode].slice(0, 5).map((stage, index) => <li className={index < activeIndex ? "complete" : index === activeIndex ? "active" : ""} key={stage.label}>{index < activeIndex ? <Check size={12} /> : <span />}</li>)}
      </ol>
      <small>Please keep this page open. Generation usually takes under two minutes, but a complex plan can take up to three.</small>
    </aside>
  );
}
