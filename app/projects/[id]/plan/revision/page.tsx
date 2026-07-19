"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AgentAvatar } from "@/components/agent-avatar";
import { PageShell } from "@/components/page-shell";
import { Badge, Button } from "@/components/ui";
import type { ResearchPlan } from "@/lib/research-plan";
import { Lightbulb, ShieldCheck } from "lucide-react";

type BudgetPreference = "maintain" | "reduce" | "cap";
type TimingPreference = "maintain" | "faster" | "specific_date";

export default function PlanRevisionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [plan, setPlan] = useState<ResearchPlan>();
  const [project, setProject] = useState<unknown>();
  const [revisionCount, setRevisionCount] = useState(0);
  const [budgetPreference, setBudgetPreference] = useState<BudgetPreference>("maintain");
  const [timingPreference, setTimingPreference] = useState<TimingPreference>("maintain");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedPlan = localStorage.getItem("field-signal-live-plan");
    const storedProject = localStorage.getItem("field-signal-live-project");
    if (storedPlan) try { setPlan(JSON.parse(storedPlan) as ResearchPlan); } catch { /* handled below */ }
    if (storedProject) try { setProject(JSON.parse(storedProject)); } catch { /* project context is optional */ }
    setRevisionCount(Number(localStorage.getItem("field-signal-live-revision-count") ?? "0") || 0);
  }, []);

  async function submitRevision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!plan) { setError("The current live plan could not be found. Return to the engagement and generate a plan first."); return; }
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/research-plan/revise", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPlan: plan, project, revisionRequest: {
          budgetPreference,
          budgetCap: budgetPreference === "cap" ? String(data.get("budgetCap") ?? "") : undefined,
          timingPreference,
          targetDate: timingPreference === "specific_date" ? String(data.get("targetDate") ?? "") : undefined,
          businessPriorities: String(data.get("businessPriorities") ?? ""),
          scopeTradeoffs: String(data.get("scopeTradeoffs") ?? ""),
          newContext: String(data.get("newContext") ?? ""),
        } }),
      });
      const result = await response.json() as { plan?: ResearchPlan; error?: string };
      if (!response.ok || !result.plan) throw new Error(result.error ?? "John could not revise the plan.");
      const nextCount = revisionCount + 1;
      localStorage.setItem("field-signal-live-plan", JSON.stringify(result.plan));
      localStorage.setItem("field-signal-live-revision-count", String(nextCount));
      localStorage.removeItem("field-signal-live-plan-approved");
      router.push(`/projects/${id}/plan`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "John could not revise the plan.");
      setLoading(false);
    }
  }

  return (
    <PageShell eyebrow={`Plan revision · Round ${revisionCount + 1}`} title="Tell John what needs to change." description="Share the business constraints that changed or do not yet fit. John will protect research quality while revising scope, cost and timing where defensible." actions={<Button href={`/projects/${id}/plan`} variant="secondary">Back to plan</Button>}>
      {revisionCount >= 2 && <aside className="plan-nudge"><Lightbulb size={20} /><div><strong>The plan has already been revised {revisionCount} times.</strong><p>If it now meets the essential budget, timing and decision needs, approval is the fastest route to evidence. Another revision is still available when a material constraint remains.</p></div></aside>}
      <div className="revision-layout">
        <form className="panel revision-form" onSubmit={submitRevision}>
          <section><span className="revision-step">01 · Budget</span><h2>What should change about the budget?</h2><div className="revision-options">
            <Choice name="budget" checked={budgetPreference === "maintain"} onChange={() => setBudgetPreference("maintain")} label="Keep the estimate" detail="No cost-driven change is needed." />
            <Choice name="budget" checked={budgetPreference === "reduce"} onChange={() => setBudgetPreference("reduce")} label="Explore a lower-cost plan" detail="John may reduce optional depth or sample size and will state the trade-offs." />
            <Choice name="budget" checked={budgetPreference === "cap"} onChange={() => setBudgetPreference("cap")} label="Work within a firm cap" detail="Provide the maximum approved research budget." />
          </div>{budgetPreference === "cap" && <Field label="Maximum budget"><input name="budgetCap" required placeholder="e.g. S$2,000" /></Field>}</section>

          <section><span className="revision-step">02 · Timing</span><h2>What should change about timing?</h2><div className="revision-options">
            <Choice name="timing" checked={timingPreference === "maintain"} onChange={() => setTimingPreference("maintain")} label="Keep the timeline" detail="The current schedule works." />
            <Choice name="timing" checked={timingPreference === "faster"} onChange={() => setTimingPreference("faster")} label="Explore a faster plan" detail="John may reduce lower-priority depth and will disclose the limitations." />
            <Choice name="timing" checked={timingPreference === "specific_date"} onChange={() => setTimingPreference("specific_date")} label="Meet a decision date" detail="Tell John when the evidence is needed." />
          </div>{timingPreference === "specific_date" && <Field label="Decision deadline"><input name="targetDate" required placeholder="e.g. Board meeting on 30 September" /></Field>}</section>

          <section><span className="revision-step">03 · Business priorities</span><h2>What must the revised plan help you decide?</h2><Field label="Essential outcomes"><textarea name="businessPriorities" required minLength={3} rows={4} placeholder="e.g. Prioritise confidence in the CBD versus heartland location decision. We can accept less detail on brand positioning." /></Field><Field label="Lower-priority areas or acceptable trade-offs (optional)"><textarea name="scopeTradeoffs" rows={3} placeholder="e.g. Reduce interviews before reducing the survey; paid competitor reports are optional." /></Field><Field label="New context John should know (optional)"><textarea name="newContext" rows={3} placeholder="e.g. The decision date moved, a location dropped out, or finance set a new cap." /></Field></section>

          {error && <div className="notice" role="alert">{error}</div>}
          <div className="revision-submit"><button className="button button-primary" disabled={loading} type="submit">{loading ? "John is revising the plan…" : "Generate revised plan →"}</button><small>You can review, revise again or approve the replacement plan.</small></div>
        </form>

        <aside className="revision-sidebar"><section className="panel"><AgentAvatar slug="john-lim" size="lg" /><Badge>John Lim · AI Research Director</Badge><h2>Business constraints in. Methodological judgement retained.</h2><p>Your priorities can change the budget, pace and depth. John remains responsible for choosing defensible methods and making any quality trade-offs visible.</p></section><section className="revision-guardrail"><ShieldCheck size={22} /><div><strong>Why the form is structured this way</strong><p>It steers revision toward information only you can provide: commercial limits, deadlines, decision priorities and changed context. You do not need to redesign the methodology.</p></div></section></aside>
      </div>
    </PageShell>
  );
}

function Choice({ name, checked, onChange, label, detail }: { name: string; checked: boolean; onChange: () => void; label: string; detail: string }) { return <label className="revision-choice"><input type="radio" name={name} checked={checked} onChange={onChange} /><span><strong>{label}</strong><small>{detail}</small></span></label>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field revision-field"><span>{label}</span>{children}</label>; }
