import { PageShell } from "@/components/page-shell";
import { EngagementModeSelector } from "./mode-selector";

export default function NewProject() {
  return (
    <PageShell
      eyebrow="New engagement · Step 1 of 3"
      title="Right-sized for the decision."
      description="Choose the level of investigation your decision needs. You can refine the scope with John before approving any research plan."
    >
      <EngagementModeSelector />
    </PageShell>
  );
}
