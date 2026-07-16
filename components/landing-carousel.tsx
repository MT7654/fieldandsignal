"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ClipboardList, FileCheck2, MessageSquareText, Pause, Play, Search, Sparkles } from "lucide-react";
import { AgentAvatar } from "@/components/agent-avatar";
import { Badge, SectionLabel } from "@/components/ui";
import { agents } from "@/lib/demo-data";

const slideLabels = ["Meet the team", "How the firm works", "How the app works"];

export function LandingCarousel() {
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (userPaused || interactionPaused || reducedMotion) return;
    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % slideLabels.length);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [active, userPaused, interactionPaused, reducedMotion]);

  function move(direction: number) {
    setActive((current) => (current + direction + slideLabels.length) % slideLabels.length);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") move(1);
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "Home") setActive(0);
    if (event.key === "End") setActive(slideLabels.length - 1);
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLElement>) {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) > 48) move(distance < 0 ? 1 : -1);
    touchStart.current = null;
    setInteractionPaused(false);
  }

  return (
    <section className="agency-carousel-section" id="how-it-works" aria-labelledby="agency-carousel-title">
      <div className="carousel-heading">
        <div>
          <SectionLabel>Inside the firm</SectionLabel>
          <h2 id="agency-carousel-title">A research agency, reimagined.</h2>
        </div>
        <p>The familiar disciplines of a rigorous research team, coordinated as transparent AI agents from question to recommendation.</p>
      </div>

      <div
        className="agency-carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label="About Field & Signal"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setInteractionPaused(true)}
        onMouseLeave={() => setInteractionPaused(false)}
        onFocusCapture={() => setInteractionPaused(true)}
        onBlurCapture={(event) => {
          const nextTarget = event.relatedTarget;
          if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) setInteractionPaused(false);
        }}
        onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; setInteractionPaused(true); }}
        onTouchEnd={handleTouchEnd}
      >
        <div className="carousel-tabs" role="tablist" aria-label="Carousel slides">
          {slideLabels.map((label, index) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={active === index}
              aria-controls={`landing-slide-${index}`}
              id={`landing-tab-${index}`}
              onClick={() => setActive(index)}
            >
              <span>0{index + 1}</span>{label}
            </button>
          ))}
        </div>

        <div className="carousel-stage" aria-live={userPaused || interactionPaused || reducedMotion ? "polite" : "off"}>
          <div id={`landing-slide-${active}`} role="tabpanel" aria-labelledby={`landing-tab-${active}`} className="carousel-slide">
            {active === 0 && <TeamSlide />}
            {active === 1 && <FirmSlide />}
            {active === 2 && <AppSlide />}
          </div>
        </div>

        <div className="carousel-controls">
          <span>{active + 1} / {slideLabels.length}</span>
          <div className="carousel-control-actions">
            <button
              className="carousel-play-control"
              type="button"
              disabled={reducedMotion}
              aria-pressed={userPaused}
              aria-label={reducedMotion ? "Automatic rotation disabled by reduced-motion preference" : userPaused ? "Resume automatic slide rotation" : "Pause automatic slide rotation"}
              onClick={() => setUserPaused((paused) => !paused)}
            >
              {userPaused || reducedMotion ? <Play size={16} /> : <Pause size={16} />}
              <span>{reducedMotion ? "Motion reduced" : userPaused ? "Play" : "Pause"}</span>
            </button>
            <button type="button" onClick={() => move(-1)} aria-label="Previous slide"><ArrowLeft size={19} /></button>
            <button type="button" onClick={() => move(1)} aria-label="Next slide"><ArrowRight size={19} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamSlide() {
  return (
    <div className="team-slide">
      <div className="slide-copy">
        <Badge>Six AI specialists</Badge>
        <h3>Meet the people-shaped team behind every engagement.</h3>
        <p>Each portrait represents a fictional AI specialist. Their individual remit and evidence trail stay visible throughout the work.</p>
        <small>Illustrative AI-generated portraits · not photographs of employees</small>
      </div>
      <div className="compact-team-grid">
        {agents.map((agent) => (
          <article className="compact-agent-card" key={agent.slug}>
            <AgentAvatar slug={agent.slug} size="md" />
            <div><h4>{agent.name}</h4><p>{agent.role}</p><span>{agent.expertise}</span></div>
            <Badge>AI</Badge>
          </article>
        ))}
      </div>
    </div>
  );
}

const firmSteps = [
  ["01", "Frame the decision", "John clarifies the choice, assumptions and evidence needed."],
  ["02", "Investigate evidence", "Maya maps the market and identifies what published evidence cannot answer."],
  ["03", "Conduct fieldwork", "Aisha and Daniel design and run approved, consent-based primary research."],
  ["04", "Recommend a strategy", "Sofia and Marcus connect findings to a practical decision and its risks."],
];

function FirmSlide() {
  return (
    <div className="process-slide">
      <div className="slide-copy">
        <Badge tone="coral">The research method</Badge>
        <h3>From a hard question to an evidence-backed decision.</h3>
        <p>The work moves through deliberate research gates, just as it would inside a careful human agency.</p>
      </div>
      <div className="carousel-process-grid">
        {firmSteps.map(([number, title, description]) => (
          <article key={number}><b>{number}</b><h4>{title}</h4><p>{description}</p></article>
        ))}
      </div>
    </div>
  );
}

const appSteps = [
  { icon: MessageSquareText, title: "Describe the decision", text: "Start with the business choice, context and market." },
  { icon: Search, title: "Clarify the question", text: "John surfaces assumptions, constraints and unknowns." },
  { icon: ClipboardList, title: "Approve the plan", text: "Review the methods, sample, timeline and limits." },
  { icon: Sparkles, title: "Watch the work", text: "Follow evidence review, surveys, interviews and analysis." },
  { icon: FileCheck2, title: "Receive the brief", text: "Get a recommendation with linked evidence and risks." },
];

function AppSlide() {
  return (
    <div className="app-slide">
      <div className="slide-copy">
        <Badge tone="gold">The product experience</Badge>
        <h3>Commission research without losing sight of the work.</h3>
        <p>The application turns the agency process into a clear, reviewable sequence with human approval at the consequential moments.</p>
      </div>
      <div className="app-steps">
        {appSteps.map(({ icon: Icon, title, text }, index) => (
          <article key={title}><span><Icon size={20} /></span><div><small>Step {index + 1}</small><h4>{title}</h4><p>{text}</p></div><Check size={17} /></article>
        ))}
      </div>
    </div>
  );
}
