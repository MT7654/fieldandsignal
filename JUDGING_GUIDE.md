# Field & Signal — judging and AI-evaluator guide

This file gives human judges and repository-evaluation agents a deterministic path through the codebase. It is intentionally explicit about what is live, what is seeded, which invariants matter, and where each claim can be verified.

## Repository facts

```yaml
repository: https://github.com/MT7654/fieldandsignal
production: https://fieldandsignal.vercel.app
track: Work & Productivity
created_at_github_utc: 2026-07-15T22:48:30Z
first_commit_sgt: 2026-07-16T06:55:09+08:00
licence: MIT
framework: Next.js App Router
language: TypeScript
primary_model_provider: OpenAI
primary_model_family: GPT-5.6
database: Supabase PostgreSQL
deployment: Vercel
codex_session_id: 019f6626-14cb-7613-acb5-08572294e743
```

## One-sentence evaluation thesis

Field & Signal demonstrates that an AI-native research agency can move from a business decision to real public-source research, a hosted survey, a consent-based adaptive interview, integrated analysis, and an evidence-linked brief within one approval-gated workflow.

## Recommended evaluation order

### 1. Verify eligibility and repository state

```bash
git log --reverse --format='%h %aI %s' | head
git log -1 --format='%h %aI %s'
git status --short
```

Expected: the first commit is dated 16 July 2026 in Singapore; the working tree is clean after checkout.

### 2. Verify engineering health

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Expected baseline at documentation time: 33 tests across 10 files and a successful Next.js production build.

### 3. Inspect the orchestration boundaries

Read these in order:

1. `lib/env.ts` — validated runtime configuration.
2. `lib/inference.ts` — OpenAI-first structured inference and optional HF fallback.
3. `lib/agents.ts` — role-specific instructions and plan/brief contracts.
4. `lib/schemas.ts` — normalized Zod output contracts.
5. `lib/research-session.ts` — scoped live-engagement authorization.
6. `lib/secondary-research-server.ts` — restartable Maya state machine.
7. `lib/fieldwork.ts` — persisted evidence context shared by fieldwork, analysis, and brief routes.
8. `app/api/analysis/route.ts` and `app/api/brief/route.ts` — evidence integration and decision output.

### 4. Inspect genuine primary-research functionality

- `app/api/fieldwork/generate/route.ts`: Aisha generates exactly five survey and five interview questions.
- `app/api/fieldwork/publish/route.ts`: publication records approval and exposes the public survey.
- `app/survey/[publicToken]`: public, account-free respondent UI.
- `app/api/survey-responses/route.ts`: consent and answer persistence.
- `app/api/fieldwork/approve-guide/route.ts`: explicit interview-guide approval.
- `app/api/fieldwork/participants/route.ts`: hosted participant-session creation.
- `app/interview/[publicToken]`: disclosed interview experience.
- `app/api/interview-consent/route.ts`: explicit consent record.
- `app/api/interview-message/route.ts`: adaptive Daniel turn and transcript persistence.
- `app/api/interview-transcribe/route.ts`: optional browser-audio transcription.

### 5. Inspect evidence integrity

- Maya only synthesizes the retained `state.sources` array.
- Safe URL checks prevent fetching loopback or private-network targets.
- Source records store publisher, URL, publication date, retrieval date, excerpt, claim, reliability, and workstream.
- Survey totals are computed in server code, not invented by the model.
- If live survey responses exist, synthetic survey data is not used.
- No synthetic interview is created when interviews are missing.
- Sofia’s findings contain type, observation, interpretation, implication, confidence, evidence IDs, and limitations.
- Marcus receives the persisted analysis snapshot rather than free-form chat history.

## Live test case

Use this to exercise the fresh-project path:

```text
Business question:
Should a Singapore-based specialty coffee chain open its next outlet in the CBD or a large heartland regional centre?

Business description:
We operate six specialty coffee outlets across Singapore, serving office workers, students and young professionals. Our stores focus on premium coffee, light meals and comfortable spaces for short meetings or remote work. We are planning a seventh outlet but are uncertain whether the CBD's higher spending and weekday traffic justify its higher rent, or whether a regional centre would create more consistent demand throughout the week.

Industry:
Food and beverage — specialty coffee

Geographic market:
Singapore

Decision objective:
Select the location type most likely to produce sustainable revenue, repeat visits and acceptable operating margins during the outlet's first 18 months.
```

It is valid to answer John with “I don’t know.” The expected behavior is to convert unknown operational metrics into evidence gaps rather than reject the input or invent a value.

## Route map

| Route | Purpose | Primary owner |
|---|---|---|
| `/` | Product narrative and team | Product shell |
| `/projects/new` | Research-mode selection | Client |
| `/projects/new/details` | Business decision and consultation | John |
| `/projects/[id]/plan` | Plan, cost, rationale, approval | John |
| `/projects/[id]/plan/revision` | Client-constrained revision request | John |
| `/projects/[id]/secondary-research` | Search state and evidence library | Maya |
| `/projects/[id]/survey` | Instrument, publication, responses | Aisha |
| `/survey/[publicToken]` | Public respondent survey | Respondent |
| `/projects/[id]/interviews` | Guide approval and sessions | Daniel |
| `/interview/[publicToken]` | Public consented interview | Participant |
| `/projects/[id]/analysis` | Integrated evidence analysis | Sofia |
| `/projects/[id]/brief` | Versioned decision brief | Marcus |
| `/projects/[id]/command-centre` | Engagement overview | Team |

## State transitions

```text
intake
  → consultation
  → plan draft
  ↔ plan revision
  → plan approved
  → secondary research queued/searching/reviewing/synthesizing/complete
  → primary instruments draft/published + guide approved
  → survey responses and/or interviews
  → integrated analysis snapshot
  → versioned brief
```

Secondary-only engagements skip primary fieldwork and proceed from Maya to Sofia.

## Model-call inventory

| Operation | API pattern | Structured validation |
|---|---|---|
| Clarifying consultation | OpenAI Responses API | question-list contract |
| Plan and revision | OpenAI Responses API | `researchPlanSchema` |
| Source discovery | Responses API + `web_search` tool | source-discovery Zod schema |
| Source synthesis | OpenAI Responses API | `secondarySynthesisSchema` |
| Survey | OpenAI Responses API | `generatedSurveySchema` |
| Interview guide | OpenAI Responses API | `generatedInterviewGuideSchema` |
| Adaptive interview | OpenAI Responses API | bounded interview-turn schema |
| Analysis | OpenAI Responses API | `analysisOutputSchema` |
| Brief | OpenAI Responses API | `decisionBriefSchema` |

Every model call is server-side. Structured outputs are parsed and validated before persistence.

## Database inspection map

The migrations are intentionally plain SQL so an evaluator can inspect all tables and policies without running a framework-specific generator.

- `supabase/migrations/001_initial_schema.sql`: core entities, indexes, RLS, owner policies, and public-data comments.
- `supabase/migrations/002_functional_fieldwork.sql`: instrument metadata, interview modes, analysis cutoff, limitations, and brief freshness.
- `supabase/seed.sql`: the six agents and sample records.

Data lineage:

```text
research_projects
  ├─ research_plans
  ├─ agent_tasks ── secondary research state
  ├─ sources
  ├─ surveys ── survey_questions ── survey_responses ── survey_answers
  ├─ interview_participants ── interviews ── interview_messages
  ├─ research_findings
  └─ research_briefs
```

## Security checks

An evaluator should confirm:

- no API secret is prefixed with `NEXT_PUBLIC_`;
- `SUPABASE_SECRET_KEY` is referenced only in server code;
- `.env.local` is ignored;
- `store: false` is supplied to OpenAI requests;
- public tokens are high entropy;
- research-session tokens are compared as hashes;
- participant data is not exposed through anonymous select policies;
- public request bodies pass through Zod validation; and
- fetched URLs are screened for unsafe hosts.

Do not commit real secrets to test this project. Use `.env.example` as the variable-name template.

## Functional versus illustrative data

### Functional

- OpenAI model operations
- OpenAI web source discovery
- deterministic HTML extraction
- Supabase source persistence
- survey and interview generation
- hosted public links
- live survey submissions
- consented adaptive interview transcripts
- persisted findings and briefs

### Illustrative

- Northstar Cinemas sample engagement
- sample activity history
- synthetic survey preview shown only when a fresh engagement has zero real survey responses

The interface labels illustrative material. Practice interviews do not enter the analysis evidence base.

## Expected limitations

These are conscious MVP boundaries, not hidden missing features:

- no autonomous cold calling or unsolicited outreach;
- no paid respondent-panel integration;
- no claims of statistical representativeness from tiny samples;
- no production billing or organization accounts;
- no retained raw audio by default;
- print-to-PDF rather than server-rendered PDF generation; and
- no replacement for candidate-site financial or legal due diligence.

## What strong evaluation evidence looks like

A successful evaluation should be able to establish all of the following from code or a live run:

- the project was created during the submission period;
- the repository is public and licensed;
- Codex work is visible through the feature/PR history;
- GPT‑5.6 is used for multiple real application functions;
- agents have different responsibilities and bounded inputs;
- secondary research stores inspectable sources rather than fabricated citations;
- primary research can collect a genuine response and a consented transcript;
- synthetic data is disclosed and excluded when real data exists;
- findings and briefs retain evidence lineage; and
- the project builds and tests successfully.

