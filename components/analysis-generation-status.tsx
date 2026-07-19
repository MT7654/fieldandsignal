"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { AgentAvatar } from "./agent-avatar";
import { formatGenerationElapsed } from "./plan-generation-status";

const stages = [
  { at: 0, label: "Taking inventory of sources, survey responses and completed interviews" },
  { at: 7, label: "Calculating response bases without mixing synthetic and live evidence" },
  { at: 16, label: "Reviewing transcript themes and the evidence behind each claim" },
  { at: 29, label: "Comparing agreements, contradictions and remaining gaps" },
  { at: 46, label: "Checking confidence levels and decision implications" },
  { at: 75, label: "Still working — a larger evidence set can take a little longer" },
];

export function analysisStageAt(elapsed: number) {
  return [...stages].reverse().find((stage) => elapsed >= stage.at) ?? stages[0];
}

export function AnalysisGenerationStatus() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const activeStage = analysisStageAt(elapsed);
  const activeIndex = stages.indexOf(activeStage);
  return <aside className="generation-status analysis-generation-status" aria-live="polite" aria-busy="true">
    <div className="generation-status-head"><AgentAvatar slug="sofia-tan" size="sm"/><div><span>Sofia is actively working</span><strong>Integrating the evidence</strong></div><LoaderCircle className="generation-spinner" aria-hidden="true"/></div>
    <div className="generation-track" aria-hidden="true"><span/></div>
    <div className="generation-stage"><span className="generation-pulse" aria-hidden="true"/><p>{activeStage.label}</p><time aria-hidden="true">{formatGenerationElapsed(elapsed)}</time></div>
    <ol className="generation-checkpoints" aria-label="Analysis progress">{stages.slice(0, 5).map((stage, index) => <li className={index < activeIndex ? "complete" : index === activeIndex ? "active" : ""} key={stage.label}>{index < activeIndex ? <Check size={12}/> : <span/>}</li>)}</ol>
    <small>Please keep this page open. Sofia is checking traceability as well as synthesising the evidence; this usually takes under two minutes.</small>
  </aside>;
}
