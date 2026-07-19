"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AgentAvatar } from "@/components/agent-avatar";
import { FieldworkActionStatus } from "@/components/fieldwork-action-status";
import { PageShell } from "@/components/page-shell";
import { Badge, Button, Progress } from "@/components/ui";
import { surveyQuestions } from "@/lib/demo-data";
import { SurveyExportTools } from "@/components/survey-export-tools";
import { BarChart3, Check, Copy, ExternalLink, Linkedin, Mail, MessageCircle, RefreshCw, Share2, Sparkles } from "lucide-react";

type Question = { id: string; type: "single" | "multiple" | "rating" | "text"; question: string; options_json?: string[]; required: boolean; position: number };
type Snapshot = { project: { business_question: string }; instrument?: { survey?: { estimatedMinutes?: number }; questionRationales?: { position: number; rationale: string }[] }; instrumentStatus: string; survey?: { id: string; title: string; introduction: string; status: string; shareUrl: string; sharePath?: string }; questions: Question[]; responses: { id: string }[]; answers: { response_id: string; question_id: string; answer_json: unknown }[] };

const demoSnapshot: Snapshot = {
  project: { business_question: "Should Northstar Cinemas open its next venue in a heartland mall or the city centre?" },
  instrumentStatus: "complete",
  instrument: { survey: { estimatedMinutes: 4 }, questionRationales: surveyQuestions.map((_, index) => ({ position: index + 1, rationale: "Measures a decision driver identified in the approved research plan." })) },
  survey: { id: "demo", title: "How people choose a cinema", introduction: "Help us understand the occasions, trade-offs and practical factors that shape cinema choice.", status: "published", shareUrl: `${typeof window === "undefined" ? "" : window.location.origin}/survey/northstar-demo` },
  questions: surveyQuestions.map((q, index) => ({ ...q, options_json: q.options, position: index + 1 })),
  responses: [], answers: [],
};

async function readApiResponse(response: Response, fallback: string) {
  const body = await response.text();
  if (!body) {
    if (!response.ok) throw new Error(fallback);
    return {} as Record<string, unknown>;
  }
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    throw new Error(response.ok ? "The workspace received an unreadable server response. Please retry." : fallback);
  }
}

function browserHostedUrl(url: string, path?: string) {
  if (typeof window === "undefined") return url;
  try {
    const publicPath = path || new URL(url).pathname;
    return new URL(publicPath, window.location.origin).toString();
  } catch {
    return url;
  }
}

export function SurveyWorkspace({ demo }: { demo: boolean }) {
  const [data, setData] = useState<Snapshot | null>(demo ? demoSnapshot : null);
  const [busy, setBusy] = useState<"generate" | "publish" | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const load = useCallback(async () => { if (demo) return; const response = await fetch("/api/fieldwork/status", { cache: "no-store" }); const result = await readApiResponse(response, "The survey workspace could not be loaded. Please refresh and try again."); if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "The survey workspace could not be loaded."); setData(result as unknown as Snapshot); }, [demo]);
  useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);
  async function act(kind: "generate" | "publish") { setBusy(kind); setError(""); try { const response = await fetch(`/api/fieldwork/${kind}`, { method: "POST" }); const fallback = kind === "generate" ? "Aisha's generation was interrupted before the instruments were saved. Please retry; no draft was published." : "The survey could not be published. Please retry."; const result = await readApiResponse(response, fallback); if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : fallback); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Action failed"); } finally { setBusy(null); } }
  const results = useMemo(() => {
    if (!data) return [];
    return data.questions.map((question) => {
      const values = data.answers.filter((a) => a.question_id === question.id).flatMap((a) => Array.isArray(a.answer_json) ? a.answer_json.map(String) : [String(a.answer_json)]);
      const counts = values.reduce<Record<string, number>>((acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }), {});
      return { question, values, counts };
    });
  }, [data]);
  if (!data) return <PageShell eyebrow="Primary research" title="Preparing the survey workspace." description="Aisha is loading the approved plan and available fieldwork."><section className="panel research-loading"><AgentAvatar slug="aisha-rahman" size="lg"/><h2>Connecting the research instruments</h2><Progress value={28}/></section></PageShell>;
  const liveCount = data.responses.length;
  const synthetic = liveCount === 0;
  const shareUrl = data.survey ? browserHostedUrl(data.survey.shareUrl, data.survey.sharePath) : "";
  const surveyTitle = data.survey?.title ?? "Field & Signal study";
  const shareText = `Please take part in our short research survey: ${surveyTitle}`;
  async function copy() { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); }
  async function nativeShare() { if (navigator.share) await navigator.share({ title: surveyTitle, text: shareText, url: shareUrl }); else await copy(); }
  return <PageShell eyebrow={demo ? "Sample engagement · Interactive synthetic data" : "Primary research · Live survey"} title="Ask the market, directly." description="Aisha turns the approved decision into respondent-friendly questions. Review the rationale, publish the study and monitor genuine responses as they arrive." actions={<>{!demo && data.survey?.status === "draft" && <Button href="/projects/live/survey/edit" variant="secondary">Edit questionnaire</Button>}{data.survey?.status === "published" && <Button href="/projects/live/interviews">Continue to interviews</Button>}</>}>
    {error && <div className="notice" role="alert"><strong>Survey workspace needs attention.</strong><p>{error}</p></div>}
    {busy && <FieldworkActionStatus operation={busy === "generate" ? "design" : "publish"}/>}
    {data.survey?.status === "published" && <SurveyExportTools url={shareUrl} title={surveyTitle} questions={data.questions} responses={data.responses} answers={data.answers}/>} 
    {!data.survey ? <section className="panel fieldwork-empty"><AgentAvatar slug="aisha-rahman" size="lg"/><Badge>Aisha Rahman · Research Methodologist</Badge><h2>Generate the research instruments</h2><p>Aisha will create a survey and interview guide from the business question, approved plan and Maya’s evidence gaps.</p><button className="button button-primary" disabled={Boolean(busy)} onClick={() => act("generate")}><Sparkles size={17}/>{busy ? "Aisha is designing…" : "Generate survey and interview guide"}</button></section> : <>
      <div className="grid-4"><div className="metric"><strong>{liveCount}</strong><span>Live responses</span><small>{synthetic ? "No real responses yet" : "Actual submissions only"}</small></div><div className="metric"><strong>{data.questions.length}</strong><span>Approved questions</span></div><div className="metric"><strong>{data.instrument?.survey?.estimatedMinutes ?? 4} min</strong><span>Estimated completion</span></div><div className="metric"><strong>{data.survey.status === "published" ? "Live" : "Draft"}</strong><span>Fieldwork status</span></div></div>
      <div className="dashboard-grid"><section className="panel instrument-panel"><div className="panel-header"><div className="agent-inline"><AgentAvatar slug="aisha-rahman"/><div><Badge>Aisha · AI Methodologist</Badge><h2>Questionnaire</h2></div></div><Badge tone={data.survey.status === "published" ? "default" : "gold"}>{data.survey.status}</Badge></div><h3>{data.survey.title}</h3><p className="muted-copy instrument-introduction">{data.survey.introduction}</p>{data.questions.map((q) => <article className="question-card" key={q.id}><header><Badge>{q.type}</Badge><span>Q{q.position}</span></header><p>{q.question}{q.required && <b className="required"> *</b>}</p>{q.options_json?.length ? <div className="options">{q.options_json.map((option) => <span className="option" key={option}>{option}</span>)}</div> : null}<small className="question-rationale"><strong>Why Aisha included this</strong><span>{data.instrument?.questionRationales?.find((r) => r.position === q.position)?.rationale ?? "Supports an objective in the approved research plan."}</span></small></article>)}</section>
        <aside>{data.survey.status !== "published" ? <section className="panel"><Sparkles/><h2>Ready to publish</h2><p>Publishing creates an anonymous response link. The questionnaire remains under client control until this approval.</p><button className="button button-primary" disabled={Boolean(busy)} onClick={() => act("publish")}>{busy ? "Publishing…" : "Approve and publish"}</button></section> : <section className="panel"><Share2/><h2>Share the survey</h2><code className="share-link">{shareUrl}</code><div className="share-actions"><button onClick={copy} aria-label="Copy survey link">{copied ? <Check/> : <Copy/>}</button><button onClick={nativeShare} aria-label="Open share sheet"><Share2/></button><a href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`} target="_blank" rel="noreferrer" aria-label="Share on WhatsApp"><MessageCircle/></a><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" aria-label="Share on LinkedIn"><Linkedin/></a><a href={`mailto:?subject=${encodeURIComponent(data.survey.title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`} aria-label="Share by email"><Mail/></a><a href={shareUrl} target="_blank" rel="noreferrer" aria-label="Open public survey"><ExternalLink/></a></div><p className="muted-copy">Consent required · no respondent account · mobile friendly</p></section>}
        <section className="panel" style={{ marginTop: 20 }}><BarChart3/><h2>Response preview</h2>{synthetic ? <div className="synthetic-callout"><Badge tone="coral">Synthetic preview</Badge><p>No public responses have arrived. The example distribution below demonstrates the eventual analysis and is not market evidence.</p><div className="mini-bars"><span style={{width:"58%"}}>Heartland convenience · 58%</span><span style={{width:"42%"}}>CBD access · 42%</span></div></div> : <><Badge>Live n={liveCount}</Badge>{liveCount < 10 && <p className="muted-copy">A small live base is shown honestly; no synthetic responses are mixed in.</p>}{results.filter((r) => Object.keys(r.counts).length).slice(0, 2).map((r) => <div key={r.question.id} className="result-block"><strong>{r.question.question}</strong>{Object.entries(r.counts).map(([label, count]) => <div key={label}><span>{label}</span><b>{count}</b></div>)}</div>)}</>}</section>
        {!demo && data.survey.status === "draft" && <button className="button button-secondary full-button" onClick={() => act("generate")} disabled={Boolean(busy)}><RefreshCw size={16}/> Regenerate draft instruments</button>}</aside></div>
    </>}
  </PageShell>;
}
