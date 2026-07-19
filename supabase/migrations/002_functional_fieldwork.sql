-- Functional primary research, analysis provenance, and brief freshness.
alter table surveys add column if not exists estimated_minutes int not null default 4;
alter table surveys add column if not exists approved_at timestamptz;
alter table surveys add column if not exists updated_at timestamptz not null default now();

alter table survey_questions add column if not exists rationale text;

create table if not exists interview_guides (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references research_projects on delete cascade,
  title text not null,
  introduction text,
  objectives_json jsonb not null default '[]',
  questions_json jsonb not null default '[]',
  status text not null default 'draft',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id)
);

alter table interviews add column if not exists mode text not null default 'research' check(mode in ('practice','research'));
alter table interviews add column if not exists transcript_reviewed_at timestamptz;
alter table interviews add column if not exists recording_consent boolean not null default false;
alter table interviews add column if not exists retain_audio boolean not null default false;

alter table research_findings add column if not exists limitations_json jsonb not null default '[]';
alter table research_findings add column if not exists data_cutoff timestamptz;

alter table research_briefs add column if not exists data_cutoff timestamptz;
alter table research_briefs add column if not exists status text not null default 'current';

create index if not exists interview_guides_project_idx on interview_guides(project_id);
alter table interview_guides enable row level security;
drop policy if exists "owners manage interview guides" on interview_guides;
create policy "owners manage interview guides" on interview_guides for all using(owns_project(project_id)) with check(owns_project(project_id));

-- Public participation continues to go through token-validating service routes.
