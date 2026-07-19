import { PageShell } from "@/components/page-shell";
import { AgentAvatar } from "@/components/agent-avatar";
import { Badge, Button } from "@/components/ui";
import { sources } from "@/lib/demo-data";
import { BookOpenCheck, Search } from "lucide-react";
import { LiveSecondaryResearch } from "./secondary-research-live";

export default async function Secondary({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "live") return <LiveSecondaryResearch />;
  return <PageShell eyebrow="Secondary research · Demo source library" title="Evidence before opinion." description="Maya has organised every source around the claim it can—and cannot—support. Records below are clearly labelled demonstration citations." actions={<Button href="/projects/northstar-cinemas/survey">Review evidence gaps</Button>}><div className="grid-4"><div className="metric"><strong>24</strong><span>Sources reviewed</span><small>6 shown in demo library</small></div><div className="metric"><strong>17</strong><span>Claims supported</span></div><div className="metric"><strong>4</strong><span>Evidence gaps</span></div><div className="metric"><strong>82%</strong><span>High-reliability records</span></div></div><div className="dashboard-grid"><section className="panel"><div className="panel-header"><div style={{display:"flex",gap:12,alignItems:"center"}}><AgentAvatar slug="maya-chen"/><div><Badge>Maya Chen · AI Analyst</Badge><h2 style={{marginTop:7}}>Source library</h2></div></div><Search size={18}/></div>{sources.map(s=><article className="source-card" key={s.id}><div className="source-id">{s.id}</div><div><h3>{s.title}</h3><small>{s.publisher} · {s.date}</small><p><strong>Supports:</strong> {s.claim}</p><p><strong>Reliability:</strong> {s.note}</p></div><Badge tone="coral">Demo</Badge></article>)}</section><aside><section className="panel"><BookOpenCheck/><h2 style={{marginTop:16}}>Emerging view</h2><p style={{lineHeight:1.65,color:"var(--muted)"}}>Regional locations appear advantaged on convenience and family catchment; central locations on premium cues and occasion traffic. Site economics remain decisive.</p></section></aside></div></PageShell>;
}
