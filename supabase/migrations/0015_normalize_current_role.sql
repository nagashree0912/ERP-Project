create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  select lower(p.role::text)
  from public.profiles p
  where p.id = (select auth.uid())
  limit 1
$$;

revoke all on function public.current_role() from public;
grant execute on function public.current_role() to authenticated;
