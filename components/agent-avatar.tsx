import Image from "next/image";
import { agents } from "@/lib/demo-data";

export function AgentAvatar({ slug, size = "md" }: { slug: string; size?: "sm" | "md" | "lg" }) {
  const agent = agents.find((item) => item.slug === slug) ?? agents[0];
  return (
    <div className={`avatar avatar-${size}`} style={{ "--agent": agent.color } as React.CSSProperties}>
      <Image src={agent.portrait} alt={`${agent.name}, fictional AI research specialist`} fill sizes={size === "lg" ? "112px" : size === "md" ? "72px" : "42px"} />
      <span className="avatar-initials" aria-hidden="true">{agent.initials}</span>
    </div>
  );
}
