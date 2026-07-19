import { SurveyEditor } from "./survey-editor";
export default async function SurveyEditPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <SurveyEditor projectId={id}/>; }
