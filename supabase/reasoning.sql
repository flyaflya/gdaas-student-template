-- The reasoning service's memory (Challenge 2). You run this ONCE, right
-- before you build the service: Supabase dashboard -> SQL Editor -> New
-- query -> paste this whole file -> Run. Expect "Success. No rows returned."
-- The build guide (course book, end of Lane 2) explains every line.

-- One row per problem type ("syllogism", "plausibility", "bernoulli").
-- Each time your /api/reasoning/decide answers a problem, it overwrites the
-- row for that type with the newest problem and your newest answer. Your
-- /reasoning page reads these three rows back. jsonb means "a JSON object,
-- stored so the database can read inside it": the whole problem and the
-- whole answer fit in one column each, no matter their shape.

create table public.reasoning_latest (
  type text primary key,
  problem jsonb not null,
  answer jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row-level security, same idea as the guestbook: with it on and no
-- policies, nobody can touch the table. Your site connects with the
-- publishable key (the visitor badge), so the policies below grant exactly
-- what the service needs: anyone may read (your /reasoning page is public),
-- and anyone may write (your API route saves each answer as it happens).
alter table public.reasoning_latest enable row level security;

create policy "anyone can read" on public.reasoning_latest
  for select using (true);
create policy "anyone can insert" on public.reasoning_latest
  for insert with check (true);
create policy "anyone can update" on public.reasoning_latest
  for update using (true);
