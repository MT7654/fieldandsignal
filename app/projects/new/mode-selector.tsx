import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, Check, MessagesSquare } from "lucide-react";
import { Badge } from "@/components/ui";

const modes = [
  {
    value: "secondary",
    badge: "Focused",
    title: "Secondary research",
    description: "Build a cited view from published market evidence before committing to fieldwork.",
    icon: BookOpenCheck,
    items: ["Market and competitor evidence", "Customer and category analysis", "Cited decision-ready brief", "Lower operational cost"],
  },
  {
    value: "primary_secondary",
    badge: "Full engagement",
    title: "Primary + secondary",
    description: "Add original surveys and interviews when the unanswered question lives in the market.",
    icon: MessagesSquare,
    items: ["Everything in secondary research", "AI-generated survey design", "Consent-based interviews", "Integrated quantitative and qualitative analysis"],
    featured: true,
  },
];

export function EngagementModeSelector() {
  return (
    <div className="engagement-mode-grid">
      {modes.map(({ value, badge, title, description, icon: Icon, items, featured }) => (
        <article className={`engagement-mode-card ${featured ? "featured" : ""}`} key={value}>
          <div className="mode-card-heading"><span className="mode-icon"><Icon size={23} /></span><Badge tone={featured ? "coral" : "default"}>{badge}</Badge></div>
          <h2>{title}</h2>
          <p>{description}</p>
          <ul>{items.map((item) => <li key={item}><Check size={17} />{item}</li>)}</ul>
          <Link className={`button ${featured ? "button-secondary" : "button-primary"}`} href={`/projects/new/details?mode=${value}`}>Choose this engagement <ArrowUpRight size={16} /></Link>
        </article>
      ))}
    </div>
  );
}
