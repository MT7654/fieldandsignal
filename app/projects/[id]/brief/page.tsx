import { BriefWorkspace } from "./brief-workspace";
export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <BriefWorkspace demo={id !== "live"}/>; }
