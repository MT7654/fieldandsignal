"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgentAvatar } from "@/components/agent-avatar";
import { PageShell } from "@/components/page-shell";
import { Badge, Button, Progress } from "@/components/ui";
import { SECONDARY_RESEARCH_LIMITS, type SecondaryResearchState } from "@/lib/secondary-research-types";
import { AlertTriangle, ArrowUpRight, BookOpenCheck, Check, LoaderCircle, RefreshCw, Search, ShieldCheck } from "lucide-react";

type ResearchResponse = { state?: SecondaryResearchState; progress?: number; error?: string };

export function LiveSecondaryResearch() {
  const [state, setState] = useState<SecondaryResearchState>();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(true);
  const started = useRef(false);

  const request = useCallback(async (url: string, method: "GET" | "POST" = "POST", body?: unknown) => {
    const response = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
    const result = await response.json() as ResearchResponse;
    if (!response.ok) throw new Error(result.error ?? "Maya's research task could not continue.");
    if (result.state) { setState(result.state); setProgress(result.progress ?? 0); localStorage.setItem("field-signal-secondary-research", JSON.stringify(result.state)); }
    return result;
  }, []);

  const run = useCallback(async () => {
    setRunning(true); setError("");
    try {
      let result: ResearchResponse;
      try { result = await request("/api/secondary-research/status", "GET"); }
      catch {
        const project = localStorage.getItem("field-signal-live-project");
        const plan = localStorage.getItem("field-signal-live-plan");
        if (!project || !plan) throw new Error("The approved live plan is missing. Return to New engagement and create the plan again.");
        const approval = await fetch("/api/projects/approve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ project: JSON.parse(project), plan: JSON.parse(plan) }) });
        const approvalResult = await approval.json() as { error?: string };
        if (!approval.ok) throw new Error(approvalResult.error ?? "The live research session could not be created.");
        result = await request("/api/secondary-research/status", "GET");
      }
      if (result.state?.status === "queued") result = await request("/api/secondary-research/start");
      let current = result.state;
      for (let step = 0; current && current.status === "in_progress" && step < 32; step++) {
        result = await request("/api/secondary-research/step");
        current = result.state;
      }
      if (current?.status === "in_progress") throw new Error("Maya paused after reaching the safe processing limit. Select Resume research to continue.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Maya's research task could not continue."); }
    finally { setRunning(false); }
  }, [request]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const cached = localStorage.getItem("field-signal-secondary-research");
    if (cached) try { setState(JSON.parse(cached) as SecondaryResearchState); } catch { /* retrieve server state */ }
    void run();
  }, [run]);

  const rerun = useCallback(async () => {
    setRunning(true); setError("");
    try { await request("/api/secondary-research/restart"); await run(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Maya could not restart the research task."); setRunning(false); }
  }, [request, run]);

  const actions = state?.status === "complete" ? <><button className="button button-secondary" disabled={running} onClick={() => void rerun()}><RefreshCw size={15}/> Run improved search</button><Button href={state.researchMode === "secondary" ? "/projects/live/analysis" : "/projects/live/survey"}>{state.researchMode === "secondary" ? "Continue to analysis" : "Continue to primary research"}</Button></> : undefined;

  return <PageShell eyebrow={`Secondary research · ${state?.status === "complete" ? "Completed" : "Live fieldwork"}`} title="Evidence before opinion." description="Maya searches for public evidence against the approved workstreams, inspects each retained source and keeps the remaining gaps visible." actions={actions}>
    {state?.status !== "complete" && <MayaResearchProgress state={state} progress={progress} running={running} />}
    {error && <div className="research-error" role="alert"><AlertTriangle size={20}/><div><strong>Research paused</strong><p>{error}</p></div><button className="button button-secondary" disabled={running} onClick={() => void run()}><RefreshCw size={15}/> Resume research</button></div>}
    {state && <ResearchResults state={state} />}
  </PageShell>;
}

function MayaResearchProgress({ state, progress, running }: { state?: SecondaryResearchState; progress: number; running: boolean }) {
  const searched = state?.queries.filter((query) => query.status !== "pending").length ?? 0;
  const reviewed = state?.usage.pageFetches ?? 0;
  return <section className="maya-progress" aria-live="polite" aria-busy={running}>
    <div className="maya-progress-head"><div className="maya-identity"><AgentAvatar slug="maya-chen" size="lg"/><div><Badge>Maya Chen · AI Secondary Research Analyst</Badge><h2>{state?.phase === "synthesizing" ? "Maya is comparing the evidence" : "Maya is finding sources"}</h2><p>{state?.currentActivity ?? "Connecting to the live research task"}</p></div></div>{running && <LoaderCircle className="generation-spinner" aria-hidden="true"/>}</div>
    <Progress value={progress} />
    <div className="maya-live-metrics"><div><strong>{searched}/{state?.queries.length ?? "—"}</strong><span>Searches completed</span></div><div><strong>{state?.candidates.length ?? 0}</strong><span>Relevant candidates</span></div><div><strong>{reviewed}</strong><span>Pages inspected</span></div><div><strong>{state?.sources.length ?? 0}</strong><span>Sources retained</span></div></div>
    <small>Results appear as they pass relevance review. Keep this page open; if it closes, Maya resumes from the last saved step.</small>
  </section>;
}

function ResearchResults({ state }: { state: SecondaryResearchState }) {
  const rejected = state.candidates.filter((candidate) => candidate.status === "rejected").length;
  const highReliability = state.sources.filter((source) => source.reliability === "High").length;
  const coverage = useMemo(() => state.plan.secondaryWorkstreams.map((workstream) => ({ title: workstream.title, sources: state.sources.filter((source) => source.workstream === workstream.title) })), [state]);
  return <>
    <div className="grid-4 research-metrics"><div className="metric"><strong>{state.sources.length}</strong><span>Relevant sources retained</span><small>{state.usage.pageFetches} pages inspected</small></div><div className="metric"><strong>{highReliability}</strong><span>High-reliability sources</span></div><div className="metric"><strong>{rejected}</strong><span>Candidates rejected</span><small>Failed or insufficiently relevant</small></div><div className="metric"><strong>{state.plan.evidenceGaps.length}</strong><span>Original evidence gaps</span></div></div>

    <div className="research-dashboard">
      <section className="panel real-source-library"><div className="panel-header"><div className="maya-identity compact"><AgentAvatar slug="maya-chen"/><div><Badge>Live web search · open-source extraction</Badge><h2>Evidence source library</h2></div></div><Search size={18}/></div>
        {state.sources.length === 0 ? <div className="empty-evidence"><Search/><h3>No source has passed review yet</h3><p>Maya retains only pages that match both the geographic market and the business decision.</p></div> : state.sources.map((source) => <article className="source-card real-source-card" key={source.id}><div className="source-id">{source.id}</div><div><div className="source-title-row"><h3>{source.title}</h3><a href={source.url} target="_blank" rel="noreferrer" aria-label={`Open ${source.title}`}><ArrowUpRight size={17}/></a></div><small>{source.publisher}{source.publicationDate ? ` · ${formatDate(source.publicationDate)}` : ""} · Retrieved {formatDate(source.retrievedAt)}</small><p><strong>Evidence:</strong> {source.excerpt}</p><p className="source-workstream"><strong>Workstream:</strong> {source.workstream}</p><p><strong>Reliability:</strong> {source.reliabilityNote}</p></div><Badge tone={source.reliability === "High" ? "default" : source.reliability === "Medium" ? "gold" : "coral"}>{source.reliability}</Badge></article>)}
      </section>

      <aside className="research-sidebar">
        <section className="panel coverage-panel"><ShieldCheck/><h2>Evidence coverage</h2>{coverage.map((item) => <div className="coverage-row" key={item.title}><div><strong>{item.title}</strong><span>{item.sources.length ? `${item.sources.length} retained source${item.sources.length === 1 ? "" : "s"}` : "Evidence still needed"}</span></div><div className={`coverage-state ${item.sources.length >= 2 ? "strong" : item.sources.length === 1 ? "partial" : "gap"}`}>{item.sources.length >= 2 ? <Check size={15}/> : item.sources.length || "—"}</div></div>)}</section>
        {state.synthesis && <section className="panel emerging-view"><BookOpenCheck/><Badge>Evidence-bounded synthesis</Badge><h2>Emerging view</h2><p>{state.synthesis.emergingView}</p>{state.synthesis.claims.slice(0, 3).map((claim) => <div className="synthesis-claim" key={claim.statement}><p>{claim.statement}</p><span>{claim.sourceIds.join(" · ")}</span></div>)}</section>}
        <section className="panel usage-panel"><h2>Research usage</h2><dl><div><dt>Web searches</dt><dd>{state.usage.searchRequests}/{SECONDARY_RESEARCH_LIMITS.queries}</dd></div><div><dt>Page fetches</dt><dd>{state.usage.pageFetches}/{SECONDARY_RESEARCH_LIMITS.pageFetches}</dd></div><div><dt>Sources retained</dt><dd>{state.sources.length}/{SECONDARY_RESEARCH_LIMITS.sources}</dd></div><div><dt>Synthesis calls</dt><dd>{state.usage.llmCalls}/1</dd></div><div><dt>Estimated synthesis input</dt><dd>{state.usage.estimatedInputTokens.toLocaleString()} tokens</dd></div></dl><small>GPT-5.6 Luna performs focused source discovery and is called once more for compact synthesis. Page extraction is deterministic and does not use model tokens.</small></section>
        <section className="panel gap-panel"><AlertTriangle/><h2>Remaining gaps</h2><ul>{(state.synthesis?.remainingGaps ?? state.plan.evidenceGaps).map((gap) => <li key={gap}>{gap}</li>)}</ul></section>
      </aside>
    </div>
  </>;
}

function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short", year: "numeric" }).format(date); }
