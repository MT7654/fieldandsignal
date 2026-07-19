"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { AgentAvatar } from "./agent-avatar";
import { formatGenerationElapsed } from "./plan-generation-status";

export type FieldworkOperation = "design" | "publish" | "approve" | "start";

const operations: Record<FieldworkOperation, {
  agent: string;
  slug: string;
  title: string;
  note: string;
  stages: { at: number; label: string }[];
}> = {
  design: {
    agent: "Aisha",
    slug: "aisha-rahman",
    title: "Designing the research instruments",
    note: "Aisha is checking both instruments before saving the draft. Please keep this page open.",
    stages: [
      { at: 0, label: "Reviewing the approved plan and evidence gaps" },
      { at: 7, label: "Drafting neutral, respondent-friendly survey questions" },
      { at: 17, label: "Building the interview guide and useful probes" },
      { at: 30, label: "Checking question clarity and decision relevance" },
      { at: 48, label: "Validating the instruments before saving the draft" },
      { at: 75, label: "Still working — detailed instruments can take a little longer" },
    ],
  },
  publish: {
    agent: "Aisha",
    slug: "aisha-rahman",
    title: "Publishing the survey",
    note: "Aisha is creating the hosted response link and confirming that it is ready to share.",
    stages: [
      { at: 0, label: "Locking the approved questionnaire version" },
      { at: 3, label: "Creating the public survey and response endpoint" },
      { at: 7, label: "Checking consent and mobile presentation" },
      { at: 12, label: "Confirming the share link is ready" },
      { at: 20, label: "Completing the publication checks" },
      { at: 35, label: "Still working — keeping the publication request active" },
    ],
  },
  approve: {
    agent: "Daniel",
    slug: "daniel-wong",
    title: "Approving the interview guide",
    note: "Daniel is locking the reviewed guide and its research guardrails before interviews begin.",
    stages: [
      { at: 0, label: "Checking the guide version selected for approval" },
      { at: 3, label: "Confirming the research objectives and guardrails" },
      { at: 7, label: "Locking the guide for participant sessions" },
      { at: 12, label: "Updating the interview workspace" },
      { at: 20, label: "Completing the approval checks" },
      { at: 35, label: "Still working — keeping the approval request active" },
    ],
  },
  start: {
    agent: "Daniel",
    slug: "daniel-wong",
    title: "Preparing the interview room",
    note: "Daniel is creating a consented, hosted session. The interview will open as soon as it is ready.",
    stages: [
      { at: 0, label: "Creating a new participant session" },
      { at: 3, label: "Attaching the approved interview guide" },
      { at: 7, label: "Preparing consent and transcript controls" },
      { at: 12, label: "Checking the hosted interview link" },
      { at: 20, label: "Opening the interview room" },
      { at: 35, label: "Still working — keeping the session request active" },
    ],
  },
};

export function fieldworkStageAt(operation: FieldworkOperation, elapsed: number) {
  const stages = operations[operation].stages;
  return [...stages].reverse().find((stage) => elapsed >= stage.at) ?? stages[0];
}

export function FieldworkActionStatus({ operation }: { operation: FieldworkOperation }) {
  const [elapsed, setElapsed] = useState(0);
  const statusRef = useRef<HTMLElement>(null);
  const config = operations[operation];

  useEffect(() => {
    statusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const startedAt = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeStage = fieldworkStageAt(operation, elapsed);
  const activeIndex = config.stages.indexOf(activeStage);

  return <aside ref={statusRef} className="generation-status fieldwork-action-status" aria-live="polite" aria-busy="true">
    <div className="generation-status-head"><AgentAvatar slug={config.slug} size="sm"/><div><span>{config.agent} is actively working</span><strong>{config.title}</strong></div><LoaderCircle className="generation-spinner" aria-hidden="true"/></div>
    <div className="generation-track" aria-hidden="true"><span/></div>
    <div className="generation-stage"><span className="generation-pulse" aria-hidden="true"/><p>{activeStage.label}</p><time aria-hidden="true">{formatGenerationElapsed(elapsed)}</time></div>
    <ol className="generation-checkpoints" aria-label={`${config.title} progress`}>{config.stages.slice(0, 5).map((stage, index) => <li className={index < activeIndex ? "complete" : index === activeIndex ? "active" : ""} key={stage.label}>{index < activeIndex ? <Check size={12}/> : <span/>}</li>)}</ol>
    <small>{config.note}</small>
  </aside>;
}
