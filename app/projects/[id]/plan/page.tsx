"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AgentAvatar } from "@/components/agent-avatar";
import { PageShell } from "@/components/page-shell";
import { Badge, Button } from "@/components/ui";
import { CheckCircle2, CircleDollarSign, Clock3, Compass, FileCheck2, Lightbulb, ListChecks, Search, Users } from "lucide-react";
import { fallbackCostBreakdown, getCostBreakdown, type ResearchPlan } from "@/lib/research-plan";

const demoPlan: ResearchPlan = {
  decisionStatement: "Choose the location archetype most likely to produce sustainable attendance and contribution: a major heartland regional mall or a city-centre mall.",
  objectives: ["Estimate drivers of cinema choice and repeat visitation.", "Compare catchment, access, competition and positioning.", "Understand differences between family, young-adult and occasion-led audiences."],
  hypotheses: ["Heartland sites support higher repeat visitation through convenience.", "City-centre sites support premium pricing and occasion visits.", "Rent and direct competition may offset central demand advantages."],
  secondaryWorkstreams: [
    { title: "Population and catchment", evidenceExpected: ["Catchment size", "Household composition"], rationale: "This establishes the addressable audience around each location before the team asks customers about preference." },
    { title: "Access and competition", evidenceExpected: ["Journey time", "Competing cinema supply"], rationale: "This tests whether convenience or competitive intensity could offset apparent demand." },
  ],
  evidenceGaps: ["Willingness to travel by segment", "Premium-format price elasticity"],
  primaryMethodology: "Consumer survey and seven semi-structured, consent-based browser interviews.",
  primaryRationale: "Published data can size the opportunity, but only direct customer research can explain trade-offs, willingness to travel and the reasons behind location preference.",
  targetRespondents: "Recent cinema-goers aged 18+, weighted toward candidate catchments.",
  sampleSizeRecommendation: "n=150 for directional segment analysis; the sample workspace uses a clearly labelled synthetic n=48 preview until live responses arrive.",
  timeline: "Fourteen working days",
  estimatedOperationalCosts: "Illustrative S$3,000 total for primary and secondary research.",
  costBreakdown: fallbackCostBreakdown,
  deliverables: ["Evidence library", "Integrated analysis", "Decision-ready brief"],
  limitations: ["Demo responses and transcripts are synthetic.", "Live work requires candidate-site economics and a representative sample."],
};

export default function PlanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const live = id === "live";
  const [plan, setPlan] = useState<ResearchPlan>(demoPlan);
  const [revisionCount, setRevisionCount] = useState(0);
  const [starting, setStarting] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  useEffect(() => {
    if (!live) return;
    const stored = localStorage.getItem("field-signal-live-plan");
    if (stored) {
      try { setPlan(JSON.parse(stored) as ResearchPlan); } catch { /* retain a safe preview */ }
    }
    setRevisionCount(Number(localStorage.getItem("field-signal-live-revision-count") ?? "0") || 0);
  }, [live]);

  async function approvePlan() {
    setStarting(true);
    setApprovalError("");
    try {
      if (live) {
        const storedProject = localStorage.getItem("field-signal-live-project");
        if (!storedProject) throw new Error("The live engagement context is missing. Please create the engagement again.");
        const response = await fetch("/api/projects/approve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ project: JSON.parse(storedProject), plan }) });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "The engagement could not be started.");
      }
      localStorage.setItem("field-signal-live-plan-approved", new Date().toISOString());
      localStorage.removeItem("field-signal-secondary-research");
      router.push(`/projects/${id}/secondary-research`);
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : "The engagement could not be started.");
      setStarting(false);
    }
  }

  const costs = useMemo(() => getCostBreakdown(plan), [plan]);
  const costTotal = costs.items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <PageShell
      eyebrow={`Research plan · ${live ? `Version ${revisionCount + 1}` : "Version 2 · Demo data"}`}
      title="A plan built around the decision."
      description="John has translated the business question into a bounded programme. Review what the team will do, why it matters, what it will cost and what remains uncertain."
    >
      <section className="approval plan-approval" aria-label="Plan approval">
        <div className="approval-copy">
          <CheckCircle2 aria-hidden="true" />
          <div><strong>Ready for your decision</strong><small>No fieldwork or external spending begins until you approve this plan.</small></div>
        </div>
        <div className="approval-actions">
          {live && <Button href={`/projects/${id}/plan/revision`} variant="secondary">Request revision</Button>}
          <button className="button button-primary" disabled={starting} onClick={approvePlan}>{starting ? "Starting research…" : "Approve & start research →"}</button>
        </div>
      </section>
      {approvalError && <div className="notice" role="alert">{approvalError}</div>}

      {live && revisionCount >= 2 && (
        <aside className="plan-nudge">
          <Lightbulb size={20} aria-hidden="true" />
          <div><strong>You have completed {revisionCount} revision rounds.</strong><p>If the budget, timing and business priorities now fit, approving lets Maya begin evidence collection. Request another revision only if a material constraint is still unresolved.</p></div>
        </aside>
      )}

      <section className="panel plan-document">
        <header className="plan-document-header">
          <div className="plan-director"><AgentAvatar slug="john-lim" /><div><Badge>John Lim · AI Research Director</Badge><h2>Decision architecture</h2></div></div>
          <span className="plan-review-label">Prepared for your review</span>
        </header>

        <div className="plan-grid">
          <PlanCard icon={Compass} title="Decision statement" className="plan-card-wide"><p className="plan-lead">{plan.decisionStatement}</p></PlanCard>
          <PlanCard icon={ListChecks} title="Research objectives"><List items={plan.objectives} /></PlanCard>
          <PlanCard icon={Lightbulb} title="Working hypotheses"><List items={plan.hypotheses} /></PlanCard>
          <PlanCard icon={Search} title="Secondary workstreams" className="plan-card-wide">
            <div className="workstream-grid">{plan.secondaryWorkstreams.map((workstream) => <article className="workstream" key={workstream.title}><h4>{workstream.title}</h4><p>{workstream.rationale ?? `This establishes ${workstream.evidenceExpected.join(", ").toLowerCase()} so the decision can be tested against observable market conditions.`}</p><span>Evidence expected</span><ul>{workstream.evidenceExpected.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
          </PlanCard>
          <PlanCard icon={Users} title="Primary methodology" className="plan-card-wide">
            <div className="methodology-layout"><div><span className="plan-kicker">What we will do</span><p>{plan.primaryMethodology}</p><dl><div><dt>Respondents</dt><dd>{plan.targetRespondents}</dd></div><div><dt>Recommended sample</dt><dd>{plan.sampleSizeRecommendation}</dd></div></dl></div><aside><span className="plan-kicker">Why this is needed</span><p>{plan.primaryRationale ?? "Direct customer evidence is needed to answer the behavioural and attitudinal questions that published sources cannot resolve reliably."}</p></aside></div>
          </PlanCard>
          <PlanCard icon={Search} title="Evidence gaps"><List items={plan.evidenceGaps} /></PlanCard>
          <PlanCard icon={Clock3} title="Timing"><p className="plan-lead">{plan.timeline}</p><small>Timing begins after plan approval and any required participant or source-access setup.</small></PlanCard>
          <PlanCard icon={CircleDollarSign} title="Estimated cost" className="plan-card-wide">
            <div className="cost-heading"><div><span className="plan-kicker">Combined primary + secondary estimate</span><p>{plan.estimatedOperationalCosts}</p></div><div className="cost-total"><span>Estimated total</span><strong>{formatMoney(costs.currency, costTotal)}</strong></div></div>
            <div className="cost-table-wrap"><table className="cost-table"><thead><tr><th>Cost area</th><th>What it covers</th><th>Basis</th><th>Estimate</th></tr></thead><tbody>{costs.items.map((item) => <tr key={`${item.category}-${item.description}`}><th scope="row">{item.category}</th><td>{item.description}</td><td>{item.basis}</td><td>{formatMoney(costs.currency, item.amount)}</td></tr>)}</tbody><tfoot><tr><th colSpan={3}>Estimated total</th><td>{formatMoney(costs.currency, costTotal)}</td></tr></tfoot></table></div>
            <div className="cost-assumptions"><strong>Cost assumptions</strong><List items={costs.assumptions} /></div>
          </PlanCard>
          <PlanCard icon={FileCheck2} title="Deliverables"><List items={plan.deliverables} /></PlanCard>
          <PlanCard icon={FileCheck2} title="Limitations"><List items={plan.limitations} /></PlanCard>
        </div>
      </section>
    </PageShell>
  );
}

function PlanCard({ icon: Icon, title, children, className = "" }: { icon: typeof Compass; title: string; children: React.ReactNode; className?: string }) {
  return <article className={`plan-card ${className}`}><header><span><Icon size={18} aria-hidden="true" /></span><h3>{title}</h3></header><div className="plan-card-content">{children}</div></article>;
}

function List({ items }: { items: string[] }) { return <ul className="plan-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>; }

function formatMoney(currency: string, amount: number) {
  return `${currency}${new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 }).format(amount)}`;
}
