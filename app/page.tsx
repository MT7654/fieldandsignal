import Image from "next/image";
import { ArrowDownRight, ClipboardCheck, Eye, ShieldCheck } from "lucide-react";
import { LandingCarousel } from "@/components/landing-carousel";
import { Button, SectionLabel } from "@/components/ui";

export default function Home() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <SectionLabel>Autonomous research firm</SectionLabel>
          <h1>Market research that goes out and <em>asks the market.</em></h1>
          <p>Meet the autonomous research team that investigates your business question, publishes shareable surveys, guides voice interviews and delivers a decision-ready brief.</p>
          <div className="hero-actions">
            <Button href="/projects/new">Start a research engagement</Button>
            <Button href="/projects/northstar-cinemas/command-centre" variant="secondary">View sample engagement</Button>
          </div>
          <div className="hero-proof">
            <span><Eye size={15} /> Visible methods</span>
            <span><ClipboardCheck size={15} /> Approval gates</span>
            <span><ShieldCheck size={15} /> Traceable evidence</span>
          </div>
        </div>
        <div className="landing-hero-image">
          <Image
            src="/fieldwork-team.webp"
            alt="A fictional research consultancy team reviewing fieldwork observations together"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 44vw"
          />
          <div className="hero-image-caption">
            <span>Field notes · evidence review</span>
            <strong>Human research craft, delivered by AI specialists.</strong>
          </div>
        </div>
        <a className="hero-scroll-cue" href="#how-it-works"><ArrowDownRight size={18} /> Meet the firm</a>
      </section>

      <LandingCarousel />

      <section className="trust-section" aria-labelledby="trust-title">
        <div className="trust-intro">
          <SectionLabel>Built for responsible research</SectionLabel>
          <h2 id="trust-title">Autonomous work. Human control.</h2>
          <p>The team can investigate quickly, while publication, participant contact and consequential decisions stay behind explicit approval gates.</p>
        </div>
        <div className="trust-grid">
          <article><span>01</span><h3>Approval before action</h3><p>Plans, fieldwork instruments and external spending remain under your control.</p></article>
          <article><span>02</span><h3>Consent in the field</h3><p>Public surveys and Daniel’s assisted voice interviews disclose the AI, require consent and respect skip and stop requests.</p></article>
          <article><span>03</span><h3>Evidence you can inspect</h3><p>Live responses stay separate from labelled synthetic previews; recommendations connect back to sources and confirmed transcripts.</p></article>
        </div>
      </section>

      <section className="landing-cta">
        <p>Six specialists are ready to investigate your next decision.</p>
        <h2>Your next research team is ready.</h2>
        <Button href="/projects/new" variant="secondary">Frame your business question</Button>
      </section>
    </main>
  );
}
