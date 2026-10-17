alter table public.profiles enable row level security;

grant usage on schema public to authenticated;
grant select (id, role) on table public.profiles to authenticated;

drop policy if exists "profiles_owner_read" on public.profiles;
create policy "profiles_owner_read" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "profiles_authenticated_owner_only" on public.profiles;
create policy "profiles_authenticated_owner_only" on public.profiles
  as restrictive
  for select to authenticated
  using (id = (select auth.uid()));
