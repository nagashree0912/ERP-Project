-- CampusFlow EPR part 4: RLS policies — core tables.
-- Principal: full access. Teacher: read academic scope + own profile.
-- Student/Parent: read own records only. Writes restricted to staff.

-- ---------- profiles ----------
drop policy if exists "profiles_owner_read" on profiles;
create policy "profiles_owner_read" on profiles for select to authenticated
  using (id = auth.uid() or public.current_role() in ('principal','teacher'));
drop policy if exists "profiles_owner_update" on profiles;
create policy "profiles_owner_update" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles_staff_insert" on profiles;
create policy "profiles_staff_insert" on profiles for insert to authenticated
  with check (public.current_role() = 'principal');

-- ---------- students ----------
drop policy if exists "students_staff_all" on students;
create policy "students_staff_all" on students for all to authenticated
  using (public.current_role() in ('principal','teacher'))
  with check (public.current_role() in ('principal','teacher'));
drop policy if exists "students_self_read" on students;
create policy "students_self_read" on students for select to authenticated
  using (email = (select email from auth.users where id = auth.uid()));

-- ---------- teachers ----------
drop policy if exists "teachers_read_all" on teachers;
create policy "teachers_read_all" on teachers for select to authenticated using (true);
drop policy if exists "teachers_staff_write" on teachers;
create policy "teachers_staff_write" on teachers for insert to authenticated
  with check (public.current_role() = 'principal');
drop policy if exists "teachers_staff_update" on teachers;
create policy "teachers_staff_update" on teachers for update to authenticated
  using (public.current_role() = 'principal');
drop policy if exists "teachers_staff_delete" on teachers;
create policy "teachers_staff_delete" on teachers for delete to authenticated
  using (public.current_role() = 'principal');

-- ---------- parents / classes / subjects (read all, staff write) ----------
drop policy if exists "parents_read_all" on parents;
create policy "parents_read_all" on parents for select to authenticated using (true);
drop policy if exists "parents_staff_write" on parents;
create policy "parents_staff_write" on parents for all to authenticated
  using (public.current_role() in ('principal','teacher'))
  with check (public.current_role() in ('principal','teacher'));

drop policy if exists "classes_read_all" on classes;
create policy "classes_read_all" on classes for select to authenticated using (true);
drop policy if exists "classes_staff_write" on classes;
create policy "classes_staff_write" on classes for all to authenticated
  using (public.current_role() in ('principal','teacher'))
  with check (public.current_role() in ('principal','teacher'));

drop policy if exists "subjects_read_all" on subjects;
create policy "subjects_read_all" on subjects for select to authenticated using (true);
drop policy if exists "subjects_staff_write" on subjects;
create policy "subjects_staff_write" on subjects for all to authenticated
  using (public.current_role() in ('principal','teacher'))
  with check (public.current_role() in ('principal','teacher'));
