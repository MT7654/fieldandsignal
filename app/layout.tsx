import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = { title: "Field & Signal — Autonomous market research", description: "An autonomous research team that investigates your business question, conducts fieldwork and delivers a decision-ready brief." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${sans.variable} ${serif.variable}`}><Nav />{children}<footer><LogoFooter /><p>Market research with visible methods, human approval and traceable evidence.</p><span>© 2026 Field & Signal</span></footer></body></html>;
}
function LogoFooter() { return <div className="footer-mark">F<span>&</span>S</div>; }
