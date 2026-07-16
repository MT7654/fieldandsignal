import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { InferenceStatus } from "@/components/inference-status";
import { IntakeForm } from "../intake-form";

export default async function ProjectDetails({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  const mode = params.mode === "secondary" ? "secondary" : "primary_secondary";
  const label = mode === "secondary" ? "Secondary research" : "Primary + secondary research";

  return (
    <PageShell
      eyebrow="New engagement · Step 2 of 3"
      title="What decision are we helping you make?"
      description="Start with the business choice—not a research method. John will use this context to surface the questions that matter."
      actions={<InferenceStatus />}
    >
      <div className="selected-mode-bar"><div><span>Selected engagement</span><strong>{label}</strong></div><Link href="/projects/new"><ArrowLeft size={15} /> Change mode</Link></div>
      <IntakeForm initialMode={mode} />
    </PageShell>
  );
}
