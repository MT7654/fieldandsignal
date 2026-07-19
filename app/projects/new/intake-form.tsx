"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AgentAvatar } from "@/components/agent-avatar";
import { Badge } from "@/components/ui";
import { PlanGenerationStatus } from "@/components/plan-generation-status";

type ProjectInput = {
  businessQuestion: string;
  businessDescription: string;
  industry: string;
  geography: string;
  objective?: string;
  researchMode: "secondary" | "primary_secondary";
};

const fallbackQuestions = [
  "What outcome would make this decision successful 12 months after launch?",
  "Which assumptions are you least confident about today?",
  "Are there non-negotiable operational or financial constraints?",
  "Which customer groups should carry the most weight?",
];

export function IntakeForm({ initialMode = "primary_secondary" }: { initialMode?: "secondary" | "primary_secondary" }) {
  const [step, setStep] = useState(1);
  const [project, setProject] = useState<ProjectInput>();
  const [questions, setQuestions] = useState<string[]>(fallbackQuestions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const input: ProjectInput = {
      businessQuestion: String(data.get("businessQuestion")),
      businessDescription: String(data.get("businessDescription")),
      industry: String(data.get("industry")),
      geography: String(data.get("geography")),
      objective: String(data.get("objective")),
      researchMode: initialMode,
    };
    setProject(input);
    try {
      const response = await fetch("/api/clarifying-questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = await response.json() as { questions?: string[] };
      if (response.ok && result.questions) setQuestions(result.questions);
      else setError("John is using the fallback consultation questions because live inference was unavailable.");
    } catch {
      setError("John is using the fallback consultation questions because live inference was unavailable.");
    } finally {
      setLoading(false);
      setStep(2);
    }
  }

  async function createPlan(answers: string[]) {
    if (!project) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/research-plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...project,
          clarifyingAnswers: questions.map((question, index) => ({ question, answer: answers[index] })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      localStorage.setItem("field-signal-live-plan", JSON.stringify(result.plan));
      localStorage.setItem("field-signal-live-project", JSON.stringify(project));
      localStorage.setItem("field-signal-live-revision-count", "0");
      localStorage.removeItem("field-signal-live-plan-approved");
      router.push("/projects/live/plan");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Plan generation failed");
      setLoading(false);
    }
  }

  return (
    <div className="grid-2 intake-layout">
      <section className="panel">
        {step === 1 ? (
          <form className="form-grid" onSubmit={start}>
            <Field full label="Business question"><textarea name="businessQuestion" required minLength={12} rows={3} placeholder="e.g. Which customer segment should we prioritise next?" /></Field>
            <Field full label="Business description"><textarea name="businessDescription" required minLength={12} rows={3} placeholder="What does the business do, and what context should the team know?" /></Field>
            <Field label="Industry"><input name="industry" required placeholder="e.g. Retail" /></Field>
            <Field label="Geographic market"><input name="geography" required placeholder="e.g. Singapore" /></Field>
            <Field full label="Decision objective"><input name="objective" placeholder="Growth, market entry, positioning…" /></Field>
            <button disabled={loading} className="button button-primary" type="submit">{loading ? "John is reviewing…" : "Continue to consultation →"}</button>
          </form>
        ) : (
          <Consultation questions={questions} loading={loading} error={error} onComplete={createPlan} />
        )}
      </section>
      <aside>
        <div className="panel intake-director">
          <AgentAvatar slug="john-lim" size="lg" />
          <Badge>John Lim · AI Research Director</Badge>
          <h2>I’ll turn your decision into a researchable plan.</h2>
          <p>The consultation and plan are generated through the configured inference model. Fieldwork still requires approval.</p>
          <small>Fictional AI specialist · illustrative portrait</small>
        </div>
        <div className="notice" style={{ marginTop: 14 }}><strong>Human approval by design.</strong><br />Plan approval, survey publication, interview guide and external spending remain under your control.</div>
      </aside>
    </div>
  );
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={`field ${full ? "full" : ""}`}><label>{label}</label>{children}</div>;
}

function Consultation({ questions, loading, error, onComplete }: { questions: string[]; loading: boolean; error: string; onComplete: (answers: string[]) => void }) {
  const [answers, setAnswers] = useState(() => questions.map(() => ""));
  return (
    <div>
      <Badge>Step 3 · Live AI consultation</Badge>
      <h2 style={{ font: "500 34px var(--font-serif)", marginTop: 18 }}>A few questions from John</h2>
      <p className="consultation-guidance"><strong>You do not need to know every answer.</strong> Estimates and “I don’t know” are useful—John will turn uncertainty into an evidence gap for the research team.</p>
      {error && <div className="notice">{error}</div>}
      {questions.map((question, index) => (
        <div className="field" key={question} style={{ marginTop: 18 }}>
          <label>{index + 1}. {question}</label>
          <textarea required rows={2} value={answers[index] ?? ""} onChange={(event) => setAnswers((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} placeholder="Your answer" />
        </div>
      ))}
      <button disabled={loading || answers.some((answer) => !answer.trim())} className="button button-primary" style={{ marginTop: 24 }} onClick={() => onComplete(answers)}>{loading ? "John is building your plan…" : "Generate research plan →"}</button>
      {loading && <PlanGenerationStatus mode="create" />}
    </div>
  );
}
