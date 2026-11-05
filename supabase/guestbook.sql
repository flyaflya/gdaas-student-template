-- The guestbook table. You run this ONCE in Station 1.3 (Chapter 3, Step 5):
-- SQL Editor -> New query -> paste -> Run. It creates the table your
-- guestbook (and /api/health's signature count) reads. Chapter 4 walks
-- through what every line means.

create table public.guestbook (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Row-level security: who may do what. A public guestbook lets anyone read
-- and sign; your later tables will be far stingier.
alter table public.guestbook enable row level security;

create policy "anyone can read" on public.guestbook
  for select using (true);
create policy "anyone can sign" on public.guestbook
  for insert with check (true);

-- The grant. A policy says which rows a role may read or write; a grant
-- says whether the role may use the table at all. Both are required.
-- "anon" is the role Supabase uses for requests made with the publishable
-- key and no signed-in user, which is how your site connects. (Signed-in
-- users get the "authenticated" role; your site has none.) Until 2026
-- Supabase added this grant to every new table automatically; now you
-- write it yourself. Without it, every request fails with
-- "permission denied for table guestbook".
grant select, insert on public.guestbook to anon;
