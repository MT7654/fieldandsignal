# Field & Signal

**Market research that goes out and asks the market.**

Meet the autonomous research team that investigates your business question, conducts fieldwork and delivers a decision-ready brief.

Field & Signal is a production-minded OpenAI Build Week MVP. It makes an AI research engagement visible through six role-specific specialists, explicit approval gates, consent-first primary research, and claim-level evidence links. The app is fully navigable in labelled demo mode without credentials and includes live server-side Hugging Face inference plus Supabase persistence seams.

## Product flow

1. Frame a business decision through intake and John Lim’s clarifying consultation.
2. Generate, revise and approve a structured research plan.
3. Review secondary evidence with claims and reliability notes.
4. Design, approve and publish a public survey.
5. Run consent-based browser interviews one question at a time.
6. Combine sources, survey results and transcript excerpts.
7. Produce a recommendation with risks, limitations and evidence links.

The seeded Northstar Cinemas engagement demonstrates the whole journey. All synthetic records are labelled **Demo data** and must not be treated as real respondents, completed actions or investment evidence.

## Architecture

- **Next.js App Router + strict TypeScript** for pages, public participant routes and server endpoints.
- **Hugging Face Inference Providers** through its OpenAI-compatible router, pinned to `Qwen/Qwen3.6-35B-A3B:featherless-ai`. Calls remain server-side and structured outputs are validated with Zod.
- **Supabase** for PostgreSQL persistence and realtime-ready activity. The migration applies owner-based RLS and exposes no participant data through anonymous table policies.
- **Local demo adapter** in `lib/demo-data.ts` keeps the hackathon path reliable without credentials.
- **Role-specific orchestration** in `lib/agents.ts` gives every specialist bounded instructions and handoffs. A reliable sequential workflow is intentional for this MVP.

### Agent responsibilities

| Agent | Responsibility | Handoff |
|---|---|---|
| John Lim | Decision framing, clarifying questions, plan | Maya / Aisha after approval |
| Maya Chen | Cited secondary evidence and gaps | Aisha / Sofia |
| Aisha Rahman | Methodology, survey, sampling | Daniel after approval |
| Daniel Wong | Consent-based survey and interviews | Sofia |
| Sofia Tan | Integrated analysis without invented evidence | Marcus |
| Marcus Lee | Evidence-linked recommendation and next actions | Client brief |

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. With no credentials, the app automatically uses clearly labelled demo mode.

### Environment variables

- `OPENAI_API_KEY`: server-only OpenAI key.
- `OPENAI_MODEL`: defaults to `gpt-5.6`.
- `HF_TOKEN`: server-only Hugging Face token with Inference Providers access.
- `HF_MODEL`: defaults to `Qwen/Qwen3.6-35B-A3B:featherless-ai`.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SECRET_KEY`: modern server-only key used by validated public-token endpoints; bypasses RLS and must never reach the browser.
- `NEXT_PUBLIC_APP_URL`: deployed origin.

Environment values are validated in `lib/env.ts`. Never expose the Hugging Face token, OpenAI key, or Supabase service-role key to the browser.

## Supabase

1. Create a Supabase project.
2. On free-plan or IPv4-only development machines, open the Supabase SQL Editor and run `supabase/migrations/001_initial_schema.sql`.
3. Then run `supabase/seed.sql` in the SQL Editor to create the six agents and the functional Northstar public survey/interview records.
4. Run `npx tsx scripts/seed-demo.ts <owner-uuid>` only if you want an additional owner-linked Northstar seed record.

For the hackathon demonstration, engagement access uses a scoped research-session cookie rather than a client sign-in flow. The server-only Supabase client uses the modern `sb_secret_...` key for validated survey, interview and research-workspace operations.

The direct database hostname on many free Supabase projects is IPv6-only. If your development environment has no IPv6 route, the client libraries and Data API still work normally; only CLI migration deployment is affected. Use the Dashboard SQL Editor for the one-time schema setup.

Public survey and interview pages reveal only study copy needed for a matching token. Writes pass through validated server routes; participant identities, answers and transcripts have no anonymous read policy.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

## Demo mode

The seeded Northstar story remains available whenever Supabase is absent. If `HF_TOKEN` is configured, fresh consultations, plans, and adaptive interviews are live even while project persistence remains in labelled local/demo mode. Public survey and interview persistence becomes durable when Supabase credentials are added. See `DEMO_SCRIPT.md` for the judge walkthrough.

## How Qwen 3.6 is used

Qwen 3.6 is called through Hugging Face’s OpenAI-compatible router for clarifying questions, research planning, adaptive interviews, and synthesis. The pinned Featherless route runs in the model’s official non-thinking mode using `chat_template_kwargs.enable_thinking=false`, reducing latency and unnecessary reasoning tokens for application tasks. Outputs use Zod schemas with one guarded retry. Prompts remain role-specific: the analyst cannot invent evidence, the interviewer stays within the approved guide, and the strategy consultant receives bounded evidence rather than unrestricted context. The original GPT-5.6 integration remains an optional server-side fallback when `OPENAI_API_KEY` is configured.

## Where Codex accelerated development

Codex translated a long-form product brief into a coherent information architecture, design system, domain model, approval/consent guardrails, complete route set, structured-output schemas, RLS migration, test suite and demo narrative. Human review remains essential for live research methods, recruitment, source validity, privacy impact and any commercial recommendation.

## Deployment

1. Push the repository to GitHub and import it into Vercel.
2. Add the environment variables in Vercel; keep all secrets server-only.
3. Apply Supabase migrations before enabling real project creation.
4. Set the Supabase Auth site URL and allowed redirect origins to the Vercel domain.
5. Run `npm run build` locally before promotion.

## Safeguards

- Plan, survey, interview-guide, outreach and spending approval gates.
- AI identity disclosure for every agent and interview.
- Explicit participant consent with skip/stop controls.
- Minimal participant data and secure random public tokens.
- Owner-only RLS for private projects.
- Demo/synthetic data is never presented as live research.
- Major findings distinguish observation, respondent statement, interpretation and inference.
- Brief includes methodological limitations and change conditions.

## Current limitations

- Demo persistence is browser-session only; configured Supabase paths are the production seam.
- The public survey UI shows four representative question types rather than the full seeded 12.
- Browser interview is text-first; voice is deliberately deferred until reliable transcription and consent controls are available.
- Live web research, URL validation, respondent recruitment, email delivery, quotas and licensed data are not simulated.
- PDF export uses the browser’s print-to-PDF path.

## Future integrations

Add telephony only through an approved provider with recorded consent provenance, jurisdiction-aware policies, opt-out handling and no unsolicited mass calling. Respondent-panel integrations should use provider-side consent, screened recruitment, quota controls, incentive approval and auditable participant deletion.
