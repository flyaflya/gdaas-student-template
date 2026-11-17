-- The capstone's memory (Challenge 5). You run this ONCE, right before you
-- build the service: Supabase dashboard -> SQL Editor -> New query -> paste
-- this whole file -> Run. Expect "Success. No rows returned."
-- The build guide (course book, end of Lane 5) explains every line.

-- One row, always named "latest". Each time your /api/capstone/decide
-- answers your own problem, it overwrites this row with the whole problem
-- (story, history, options, limit, and recipe) and your answer. Test
-- problems are answered but not saved. Your /capstone report reads this
-- row, so it always shows your own problem.

create table public.capstone_latest (
  key text primary key,
  probe jsonb not null,
  answer jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row-level security, same idea as the other four tables: anyone may read
-- (your /capstone page is public), and anyone may write (your API route
-- saves each answer as it happens).
alter table public.capstone_latest enable row level security;

create policy "anyone can read" on public.capstone_latest
  for select using (true);
create policy "anyone can insert" on public.capstone_latest
  for insert with check (true);
create policy "anyone can update" on public.capstone_latest
  for update using (true);

-- The grant: the policies say which rows, the grant lets the "anon" role
-- (the publishable key, no sign-in) use the table at all. Both are
-- required. Without it, every request fails with "permission denied for
-- table capstone_latest".
grant select, insert, update on public.capstone_latest to anon;
