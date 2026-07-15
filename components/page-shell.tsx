import { Badge } from "./ui";
export function PageShell({ eyebrow, title, description, actions, children }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return <main className="app-page"><header className="page-heading"><div><Badge>{eyebrow}</Badge><h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-actions">{actions}</div>}</header>{children}</main>;
}
