import type { Activity, Agent, Source, SurveyQuestion } from "./types";

export const agents: Agent[] = [
  { slug: "john-lim", name: "John Lim", role: "Research Director", initials: "JL", color: "#0E766E", portrait: "/agents/john-lim.webp", expertise: "Decision framing & orchestration", bio: "Turns an ambiguous business question into a rigorous, approval-ready research programme.", status: "Coordinating synthesis" },
  { slug: "maya-chen", name: "Maya Chen", role: "Secondary Research Analyst", initials: "MC", color: "#477B9D", portrait: "/agents/maya-chen.webp", expertise: "Markets, competitors & evidence", bio: "Builds a cited view of markets, customer behaviour, competitors and locations.", status: "Source review complete" },
  { slug: "aisha-rahman", name: "Aisha Rahman", role: "Research Methodologist", initials: "AR", color: "#C39B3B", portrait: "/agents/aisha-rahman.webp", expertise: "Study design & sampling", bio: "Designs shareable surveys and interview programmes that answer the decision—not just generate data.", status: "Survey ready to share" },
  { slug: "daniel-wong", name: "Daniel Wong", role: "Fieldwork Lead", initials: "DW", color: "#E9785D", portrait: "/agents/daniel-wong.webp", expertise: "Assisted voice interviewing", bio: "Joins client-led interviews, speaks approved questions and adapts within the guide after consent.", status: "Practice room ready" },
  { slug: "sofia-tan", name: "Sofia Tan", role: "Insights Analyst", initials: "ST", color: "#76658D", portrait: "/agents/sofia-tan.webp", expertise: "Quantitative & qualitative analysis", bio: "Finds patterns, contradictions and segment differences without overstating the evidence.", status: "Analysis in progress" },
  { slug: "marcus-lee", name: "Marcus Lee", role: "Strategy Consultant", initials: "ML", color: "#557A5D", portrait: "/agents/marcus-lee.webp", expertise: "Strategy & recommendations", bio: "Converts the evidence into a practical recommendation, risks and next decisions.", status: "Brief queued" },
];

export const sampleProject = {
  id: "northstar-cinemas", title: "Northstar Cinemas expansion", client: "Northstar Cinemas",
  question: "Should Northstar Cinemas open its next outlet in a heartland mall or a city-centre mall?",
  status: "Evidence review ready", phase: "Fieldwork setup", progress: 72, mode: "Primary + secondary research",
};

export const activities: Activity[] = [
  { agent: "sofia-tan", action: "Prepared an integrated view using retained sources and a labelled synthetic survey preview.", time: "Today, 10:42", status: "Complete", href: "/projects/northstar-cinemas/analysis" },
  { agent: "daniel-wong", action: "Opened a practice voice-interview room; practice content is excluded from evidence.", time: "Today, 09:18", status: "Complete", href: "/projects/northstar-cinemas/interviews" },
  { agent: "maya-chen", action: "Reviewed regional population, accessibility and cinema supply evidence.", time: "Yesterday, 16:05", status: "Complete", href: "/projects/northstar-cinemas/secondary-research" },
  { agent: "aisha-rahman", action: "Drafted and published a 12-question consumer survey after approval.", time: "12 Jul, 14:20", status: "Complete", href: "/projects/northstar-cinemas/survey" },
  { agent: "john-lim", action: "Submitted the research plan for client approval.", time: "10 Jul, 11:34", status: "Complete", href: "/projects/northstar-cinemas/plan" },
];

export const sources: Source[] = [
  { id: "S01", title: "Population in Brief 2024", publisher: "Singapore Government", date: "Sep 2024", claim: "Residential population is concentrated in large suburban planning areas.", note: "Primary government statistics; demo citation record." },
  { id: "S02", title: "Household Expenditure Survey 2023", publisher: "Singapore Department of Statistics", date: "Nov 2024", claim: "Recreation spend varies by household composition and income.", note: "Official dataset; category is broader than cinema spend." },
  { id: "S03", title: "Public Transport Ridership 2024", publisher: "Land Transport Authority", date: "Mar 2025", claim: "Regional centres benefit from high public-transport interchange volumes.", note: "Official aggregate data; not a direct mall footfall measure." },
  { id: "S04", title: "Cinema market desk scan", publisher: "Field & Signal demo dataset", date: "Jul 2026", claim: "Premium formats are more concentrated in central and destination locations.", note: "Seeded demo synthesis—not live research." },
  { id: "S05", title: "Retail catchment comparison", publisher: "Field & Signal demo dataset", date: "Jul 2026", claim: "Heartland sites show a larger family catchment within a 20-minute journey.", note: "Illustrative model using labelled demo inputs." },
  { id: "S06", title: "Competitor location inventory", publisher: "Field & Signal demo dataset", date: "Jul 2026", claim: "City-centre supply creates stronger head-to-head competition.", note: "Requires live validation before investment." },
];

export const surveyQuestions: SurveyQuestion[] = [
  { id: "q1", type: "single", question: "How often do you visit a cinema?", options: ["Weekly", "Monthly", "Every 2–3 months", "Less often"], required: true },
  { id: "q2", type: "multiple", question: "What most influences your choice of cinema?", options: ["Travel time", "Ticket price", "Food and retail nearby", "Premium screens", "Family convenience"], required: true },
  { id: "q3", type: "rating", question: "How appealing is a cinema in a regional heartland mall?", options: ["1", "2", "3", "4", "5"], required: true },
  { id: "q4", type: "text", question: "What would make you visit a new cinema more often?", required: false },
];

export const surveyResults = [
  { name: "Heartland mall", value: 63 }, { name: "City centre", value: 24 }, { name: "No preference", value: 13 },
];

export const findings = [
  { title: "Convenience is decision-relevant", type: "Published evidence", confidence: "Medium", text: "Retained sources consistently make access and trip convenience relevant to repeat visitation, without proving site-level revenue.", evidence: "Sources S01, S04, S06" },
  { title: "Primary preference remains unverified", type: "Evidence gap", confidence: "Directional", text: "The survey distribution is a synthetic interface preview. It is not customer evidence and will be replaced when a real response arrives.", evidence: "Synthetic survey preview · n=48" },
  { title: "Interview explanations are still missing", type: "Evidence gap", confidence: "Directional", text: "No synthetic interview transcripts are used. Daniel’s practice room demonstrates the experience but stays outside the analysis.", evidence: "No completed research interviews" },
];
