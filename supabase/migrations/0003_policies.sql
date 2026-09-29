-- CampusFlow EPR part 3: RLS hardening + Storage buckets
-- Run AFTER 0001_schema.sql and 0002_academic.sql in Supabase SQL editor.
-- Role model: profiles.id = auth.users.id, profiles.role in
-- ('principal','teacher','student','parent').

-- 1) Link profiles to auth.users (safe if already linked)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_id_fkey') then
    alter table profiles add constraint profiles_id_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- 2) Helper: current user's role (bypasses RLS via owner rights)
create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() limit 1 $$;

-- 3) Enable RLS on tables missed in 0002
alter table parents enable row level security;
alter table classes enable row level security;
alter table subjects enable row level security;
alter table exams enable row level security;
alter table assignments enable row level security;
alter table study_materials enable row level security;
alter table leave_requests enable row level security;
alter table notifications enable row level security;

-- 4) Storage buckets (public read for avatars/materials, private documents)
insert into storage.buckets (id, name, public) values
  ('avatars','avatars', true),
  ('materials','materials', true),
  ('documents','documents', false)
on conflict (id) do nothing;
