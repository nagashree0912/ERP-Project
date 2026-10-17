create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select p.role
  from public.profiles p
  where p.id = (select auth.uid())
  limit 1
$$;

revoke all on function public.current_role() from public;
grant execute on function public.current_role() to authenticated;

drop policy if exists "profiles_owner_read" on public.profiles;
create policy "profiles_owner_read" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or public.current_role() = 'principal'
  );
