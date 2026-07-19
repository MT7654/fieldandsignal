import { SurveyWorkspace } from "./survey-workspace";

export default async function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SurveyWorkspace demo={id !== "live"} />;
}
