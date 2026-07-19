"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { AgentAvatar } from "./agent-avatar";
import { formatGenerationElapsed } from "./plan-generation-status";

const stages = [
  { at: 0, label: "Reviewing Sofia’s findings and their linked evidence IDs" },
  { at: 7, label: "Drafting the recommendation without overstating confidence" },
  { at: 17, label: "Separating rationale, risks and decision-changing conditions" },
  { at: 30, label: "Turning evidence gaps into practical next actions" },
  { at: 47, label: "Checking every section for traceability and consistency" },
  { at: 75, label: "Still working — a detailed evidence base can take a little longer" },
];

export function briefStageAt(elapsed: number) {
  return [...stages].reverse().find((stage) => elapsed >= stage.at) ?? stages[0];
}

export function BriefGenerationStatus() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const activeStage = briefStageAt(elapsed);
  const activeIndex = stages.indexOf(activeStage);
  return <aside className="generation-status brief-generation-status" aria-live="polite" aria-busy="true">
    <div className="generation-status-head"><AgentAvatar slug="marcus-lee" size="sm"/><div><span>Marcus is actively working</span><strong>Assembling the decision brief</strong></div><LoaderCircle className="generation-spinner" aria-hidden="true"/></div>
    <div className="generation-track" aria-hidden="true"><span/></div>
    <div className="generation-stage"><span className="generation-pulse" aria-hidden="true"/><p>{activeStage.label}</p><time aria-hidden="true">{formatGenerationElapsed(elapsed)}</time></div>
    <ol className="generation-checkpoints" aria-label="Brief generation progress">{stages.slice(0, 5).map((stage, index) => <li className={index < activeIndex ? "complete" : index === activeIndex ? "active" : ""} key={stage.label}>{index < activeIndex ? <Check size={12}/> : <span/>}</li>)}</ol>
    <small>Please keep this page open. Marcus is checking the recommendation against the evidence before publishing the next version.</small>
  </aside>;
}
