import { PageShell } from "@/components/page-shell";
import { InferenceStatus } from "@/components/inference-status";
import { IntakeForm } from "./intake-form";

export default function NewProject(){return <PageShell eyebrow="New engagement · Step 1 of 3" title="What decision are we helping you make?" description="Start with the business choice—not a research method. John will use this context to surface the questions that matter." actions={<InferenceStatus/>}><IntakeForm/></PageShell>}
