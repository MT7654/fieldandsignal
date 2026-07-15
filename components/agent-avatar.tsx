import { agents } from "@/lib/demo-data";

export function AgentAvatar({ slug, size = "md" }: { slug: string; size?: "sm" | "md" | "lg" }) {
  const agent = agents.find((item) => item.slug === slug) ?? agents[0];
  return (
    <div className={`avatar avatar-${size}`} style={{ "--agent": agent.color } as React.CSSProperties} aria-label={`${agent.name}, AI agent`}>
      <div className="avatar-hair" /><div className="avatar-face"><span /></div><div className="avatar-body" />
      <b>{agent.initials}</b>
    </div>
  );
}
