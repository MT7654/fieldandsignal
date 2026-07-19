"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, FlaskConical } from "lucide-react";
import { Logo } from "./logo";

export function Nav() {
  const path = usePathname();
  const projectId = path.match(/^\/projects\/([^/]+)\//)?.[1];
  return <>
    <header className="topbar">
      <Logo />
      <nav aria-label="Primary navigation">
        <Link className={path === "/" ? "active" : ""} href="/">Firm</Link>
        <Link href="/projects/northstar-cinemas/command-centre">Sample engagement</Link>
      </nav>
      <Link className="nav-cta" href="/projects/new"><Plus size={16} /> New engagement</Link>
    </header>
    {projectId && projectId !== "new" && <ProjectNav projectId={projectId} />}
  </>;
}

function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const items = [
    ["Command centre", "command-centre"], ["Plan", "plan"], ["Evidence", "secondary-research"], ["Survey", "survey"], ["Interviews", "interviews"], ["Analysis", "analysis"], ["Brief", "brief"],
  ];
  const sample = projectId === "northstar-cinemas";
  return <div className="project-nav"><div><FlaskConical size={16} /><strong>{sample ? "Northstar Cinemas" : "Live engagement"}</strong>{sample && <span className="demo-dot">Sample</span>}</div><nav>{items.map(([label, slug]) => <Link key={slug} className={pathname.endsWith(slug) ? "active" : ""} href={`/projects/${projectId}/${slug}`}>{label}</Link>)}</nav></div>;
}
