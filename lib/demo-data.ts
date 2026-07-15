import type { Activity, Agent, Source, SurveyQuestion } from "./types";

export const agents: Agent[] = [
  { slug: "john-lim", name: "John Lim", role: "Research Director", initials: "JL", color: "#0E766E", expertise: "Decision framing & orchestration", bio: "Turns an ambiguous business question into a rigorous, approval-ready research programme.", status: "Coordinating synthesis" },
  { slug: "maya-chen", name: "Maya Chen", role: "Secondary Research Analyst", initials: "MC", color: "#477B9D", expertise: "Markets, competitors & evidence", bio: "Builds a cited view of markets, customer behaviour, competitors and locations.", status: "Source review complete" },
  { slug: "aisha-rahman", name: "Aisha Rahman", role: "Research Methodologist", initials: "AR", color: "#C39B3B", expertise: "Study design & sampling", bio: "Designs surveys and interview programmes that answer the decision—not just generate data.", status: "Survey live" },
  { slug: "daniel-wong", name: "Daniel Wong", role: "Fieldwork Lead", initials: "DW", color: "#E9785D", expertise: "Recruitment & interviewing", bio: "Runs consent-based fieldwork and adapts interviews within the approved guide.", status: "5 of 7 interviews" },
  { slug: "sofia-tan", name: "Sofia Tan", role: "Insights Analyst", initials: "ST", color: "#76658D", expertise: "Quantitative & qualitative analysis", bio: "Finds patterns, contradictions and segment differences without overstating the evidence.", status: "Analysis in progress" },
  { slug: "marcus-lee", name: "Marcus Lee", role: "Strategy Consultant", initials: "ML", color: "#557A5D", expertise: "Strategy & recommendations", bio: "Converts the evidence into a practical recommendation, risks and next decisions.", status: "Brief queued" },
];

export const sampleProject = {
  id: "northstar-cinemas", title: "Northstar Cinemas expansion", client: "Northstar Cinemas",
  question: "Should Northstar Cinemas open its next outlet in a heartland mall or a city-centre mall?",
  status: "Analysis in progress", phase: "Integrated analysis", progress: 78, mode: "Primary + secondary research",
};

export const activities: Activity[] = [
  { agent: "sofia-tan", action: "Identified a meaningful difference between family and young-adult respondents.", time: "Today, 10:42", status: "In progress", href: "/projects/northstar-cinemas/analysis" },
  { agent: "daniel-wong", action: "Completed interview 5 of 7 and stored the consented transcript.", time: "Today, 09:18", status: "Complete", href: "/projects/northstar-cinemas/interviews" },
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
  { title: "Convenience drives repeat visits", type: "Observed evidence", confidence: "High", text: "29 of 38 demo respondents ranked travel time among their top two cinema-choice factors.", evidence: "Survey Q2 · n=38" },
  { title: "Families lean heartland", type: "Strategic inference", confidence: "Medium", text: "Parents in the demo sample preferred regional malls for bundled dining, errands and shorter journeys.", evidence: "Survey segment FAM · Interviews I02, I04" },
  { title: "Central sites signal premium", type: "Respondent statement", confidence: "Medium", text: "Younger respondents associated city-centre cinemas with dates, events and premium formats.", evidence: "Interviews I01, I05 · Survey Q4" },
];
