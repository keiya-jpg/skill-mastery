-- Adept: shared skill catalog + per-user library, practice log and spaced repetition.
--
-- Security model
--  * skills: the shared, global cache of AI-built modules. Anyone can read.
--    Only the server (secret key) writes, after validating the module, so a
--    user can't plant a fake module for everyone else.
--  * Everything else is per-user and protected by row-level security
--    (user_id = auth.uid()), whatever client is used.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- skills: one row per skill, built once and reused by every user
-- ---------------------------------------------------------------------------
create table public.skills (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name text not null check (char_length(name) <= 60),
  kind text not null check (kind in ('mental', 'physical', 'mixed')),
  emoji text not null default '✨',
  hook text not null default '',
  tags text[] not null default '{}',
  spec jsonb not null,
  -- Stage index -> time a server started building it (a short lock so two users don't pay for the same stage).
  building jsonb not null default '{}',
  aliases text[] not null default '{}',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index skills_name_trgm on public.skills using gin (name extensions.gin_trgm_ops);

alter table public.skills enable row level security;
create policy "skills: anyone can read" on public.skills for select to anon, authenticated using (true);
-- No insert/update/delete policies: only the server's secret key writes here.

-- Attach a built stage without overwriting stages other users built at the same time.
create or replace function public.set_skill_stage(p_slug text, p_index integer, p_stage jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.skills
     set spec = jsonb_set(spec, array['stages', p_index::text], p_stage),
         building = building - p_index::text,
         updated_at = now()
   where slug = p_slug;
$$;

-- Claim the right to build a stage. True if nobody else started it in the last 90 seconds.
create or replace function public.claim_skill_stage(p_slug text, p_index integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed boolean;
begin
  update public.skills
     set building = building || jsonb_build_object(p_index::text, extract(epoch from now()))
   where slug = p_slug
     and (not (building ? p_index::text) or (building ->> p_index::text)::double precision < extract(epoch from now()) - 90)
  returning true into claimed;
  return coalesce(claimed, false);
end;
$$;

revoke all on function public.set_skill_stage(text, integer, jsonb) from public, anon, authenticated;
revoke all on function public.claim_skill_stage(text, integer) from public, anon, authenticated;
grant execute on function public.set_skill_stage(text, integer, jsonb) to service_role;
grant execute on function public.claim_skill_stage(text, integer) to service_role;

-- Fuzzy search for the search box (works for anon too).
create or replace function public.search_skills(p_query text, p_limit integer default 8)
returns table (slug text, name text, kind text, emoji text, hook text, score real)
language sql
stable
set search_path = ''
as $$
  select s.slug, s.name, s.kind, s.emoji, s.hook,
         greatest(extensions.similarity(s.name, p_query), coalesce((select max(extensions.similarity(a, p_query)) from unnest(s.aliases) a), 0))::real as score
    from public.skills s
   where s.name operator(extensions.%) p_query
      or s.name ilike '%' || p_query || '%'
      or exists (select 1 from unnest(s.aliases) a where a operator(extensions.%) p_query)
   order by score desc
   limit least(greatest(p_limit, 1), 20);
$$;
grant execute on function public.search_skills(text, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Per-user data
-- ---------------------------------------------------------------------------

-- Preferences for discovery and settings.
create table public.user_prefs (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  prefs jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- The user's library of skills, with where they are.
create table public.library (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug text not null check (char_length(slug) <= 60),
  stage integer not null default 0 check (stage >= 0),
  sessions integer not null default 0,
  added_at timestamptz not null default now(),
  last_practiced_at timestamptz,
  archived boolean not null default false,
  primary key (user_id, slug)
);

-- Every completed activity: the raw material for adaptive difficulty and progress.
create table public.practice_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug text not null,
  stage_id text not null,
  activity_id text not null,
  kind text not null,
  attempts integer check (attempts >= 0),
  successes integer check (successes >= 0),
  score real,
  level integer not null default 0,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index practice_log_user_skill on public.practice_log (user_id, slug, created_at desc);

-- Spaced-repetition state per card (FSRS).
create table public.card_state (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug text not null,
  card_id text not null,
  due timestamptz not null,
  state jsonb not null,
  primary key (user_id, slug, card_id)
);
create index card_state_due on public.card_state (user_id, due);

-- Sessions: when, how long, did you hit the goal.
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug text not null,
  stage_id text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  goal_met boolean,
  note text check (char_length(note) <= 500)
);
create index sessions_user on public.sessions (user_id, started_at desc);

-- Discovery feedback ("not for me") so we stop suggesting it.
create table public.skill_feedback (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug text not null,
  verdict text not null check (verdict in ('skip', 'like')),
  created_at timestamptz not null default now(),
  primary key (user_id, slug)
);

-- AI requests per user per day (daily budget so one account can't drain the free quota).
-- "if not exists" and the guards below let this run in a Supabase project that already
-- has Retain's schema (same table; Retain's adds an audio_seconds column with a default).
create table if not exists public.ai_usage (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  provider text not null,
  requests integer not null default 0,
  primary key (user_id, day, provider)
);

do $$
declare t text;
begin
  foreach t in array array['user_prefs', 'library', 'practice_log', 'card_state', 'sessions', 'skill_feedback'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t, t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon;

do $do$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ai_usage' and policyname = 'ai_usage: read own') then
    create policy "ai_usage: read own" on public.ai_usage for select to authenticated using (user_id = (select auth.uid()));
  end if;

  -- Retain already defines record_ai_usage(text, integer, integer) with defaults, which accepts
  -- the same named arguments. Adding a second overload would make calls ambiguous, so only
  -- create ours when no record_ai_usage exists yet.
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'record_ai_usage') then
    execute $fn$
      create function public.record_ai_usage(p_provider text, p_requests integer default 1)
      returns void
      language plpgsql
      security definer
      set search_path = ''
      as $body$
      begin
        if auth.uid() is null then
          raise exception 'not authenticated';
        end if;
        insert into public.ai_usage (user_id, day, provider, requests)
        values (auth.uid(), (now() at time zone 'utc')::date, left(p_provider, 40), greatest(p_requests, 0))
        on conflict (user_id, day, provider) do update
          set requests = public.ai_usage.requests + excluded.requests;
      end;
      $body$
    $fn$;
    revoke all on function public.record_ai_usage(text, integer) from public, anon;
    grant execute on function public.record_ai_usage(text, integer) to authenticated;
  end if;
end $do$;

-- Tiny function for the keep-awake ping (free Supabase pauses after 7 idle days).
create or replace function public.ping() returns text language sql stable as $$ select 'pong'::text $$;
grant execute on function public.ping() to anon, authenticated;
