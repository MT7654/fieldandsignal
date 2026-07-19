import { InterviewsWorkspace } from "./interviews-workspace";

export default async function InterviewsPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <InterviewsWorkspace demo={id !== "live"}/>; }
