import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "coral" | "gold" | "blue" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Button({ href, children, variant = "primary", className }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string }) {
  return <Link href={href} className={cn("button", `button-${variant}`, className)}>{children}<ArrowUpRight size={16} /></Link>;
}
export function SectionLabel({ children }: { children: React.ReactNode }) { return <div className="section-label"><span />{children}</div>; }
export function Metric({ value, label, note }: { value: string; label: string; note?: string }) { return <div className="metric"><strong>{value}</strong><span>{label}</span>{note && <small>{note}</small>}</div>; }
export function IconBox({ icon: Icon }: { icon: LucideIcon }) { return <span className="icon-box"><Icon size={19} /></span>; }
export function Progress({ value }: { value: number }) { return <div className="progress" aria-label={`${value}% complete`}><span style={{ width: `${value}%` }} /></div>; }
