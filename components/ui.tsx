"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Badge({ children, tone = "default", className, title, ariaLabel }: { children: React.ReactNode; tone?: "default" | "coral" | "gold" | "blue"; className?: string; title?: string; ariaLabel?: string }) {
  return <span className={cn("badge", `badge-${tone}`, className)} title={title} aria-label={ariaLabel}>{children}</span>;
}
export function Button({ href, children, variant = "primary", className }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string }) {
  const pathname = usePathname();
  const resolvedHref = pathname.startsWith("/projects/northstar-cinemas/") && href.startsWith("/projects/live/") ? href.replace("/projects/live/", "/projects/northstar-cinemas/") : href;
  return <Link href={resolvedHref} className={cn("button", `button-${variant}`, className)}>{children}<ArrowUpRight size={16} /></Link>;
}
export function SectionLabel({ children }: { children: React.ReactNode }) { return <div className="section-label"><span />{children}</div>; }
export function Metric({ value, label, note }: { value: string; label: string; note?: string }) { return <div className="metric"><strong>{value}</strong><span>{label}</span>{note && <small>{note}</small>}</div>; }
export function IconBox({ icon: Icon }: { icon: LucideIcon }) { return <span className="icon-box"><Icon size={19} /></span>; }
export function Progress({ value }: { value: number }) { return <div className="progress" aria-label={`${value}% complete`}><span style={{ width: `${value}%` }} /></div>; }
