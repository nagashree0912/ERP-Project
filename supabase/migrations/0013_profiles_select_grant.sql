alter table public.profiles enable row level security;

grant usage on schema public to authenticated;
grant select (id, role) on table public.profiles to authenticated;
