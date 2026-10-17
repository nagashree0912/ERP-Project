create table if not exists public.attendance_sessions (
  class_id uuid not null,
  date date not null,
  created_at timestamptz not null default now(),
  primary key (class_id, date)
);

alter table public.attendance_sessions enable row level security;

insert into public.attendance_sessions (class_id, date)
select distinct class_id, date
from public.attendance
where class_id is not null
on conflict (class_id, date) do nothing;

create or replace function public.save_teacher_class_attendance(
  p_class_id uuid,
  p_date date,
  p_records jsonb,
  p_update boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_teacher_id uuid;
  v_exists boolean;
  v_roster_count bigint;
  v_record_count bigint;
  v_distinct_record_count bigint;
  v_record record;
  v_updated_count bigint;
begin
  if v_user_id is null or public.current_role() is distinct from 'teacher' then
    raise exception 'Only authenticated teachers can take attendance' using errcode = '42501';
  end if;

  select id into v_teacher_id
  from public.teachers
  where lower(email) = lower((select email from auth.users where id = v_user_id))
  limit 1;

  if v_teacher_id is null or not exists (
    select 1 from public.classes
    where id = p_class_id and class_teacher_id = v_teacher_id
  ) then
    raise exception 'You are not assigned to this classroom' using errcode = '42501';
  end if;

  if p_date is null or jsonb_typeof(p_records) is distinct from 'array' then
    raise exception 'A valid date and attendance list are required' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_class_id::text || ':' || p_date::text, 0));

  select count(*) into v_roster_count
  from public.students
  where class_id = p_class_id;

  select count(*), count(distinct r.student_id)
  into v_record_count, v_distinct_record_count
  from jsonb_to_recordset(p_records) as r(student_id uuid, status text);

  if v_roster_count = 0
    or v_record_count <> v_roster_count
    or v_distinct_record_count <> v_roster_count
    or exists (
      select 1
      from jsonb_to_recordset(p_records) as r(student_id uuid, status text)
      left join public.students s on s.id = r.student_id and s.class_id = p_class_id
      where s.id is null or r.status is null or r.status not in ('Present', 'Absent')
    )
    or exists (
      select 1 from public.students s
      where s.class_id = p_class_id
        and not exists (
          select 1
          from jsonb_to_recordset(p_records) as r(student_id uuid, status text)
          where r.student_id = s.id
        )
    ) then
    raise exception 'Attendance must contain one Present or Absent status for every student in this classroom' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.attendance_sessions
    where class_id = p_class_id and date = p_date
  ) or exists (
    select 1 from public.attendance
    where class_id = p_class_id and date = p_date
  ) into v_exists;

  if not p_update and v_exists then
    raise exception 'Attendance has already been taken for this classroom on this date' using errcode = '23505';
  end if;

  if p_update and not exists (
    select 1 from public.attendance
    where class_id = p_class_id and date = p_date
  ) then
    raise exception 'No saved attendance exists to update' using errcode = '22023';
  end if;

  insert into public.attendance_sessions (class_id, date)
  values (p_class_id, p_date)
  on conflict (class_id, date) do nothing;

  for v_record in
    select student_id, status
    from jsonb_to_recordset(p_records) as r(student_id uuid, status text)
  loop
    if p_update then
      update public.attendance
      set status = v_record.status
      where class_id = p_class_id
        and date = p_date
        and student_id = v_record.student_id;
      get diagnostics v_updated_count = row_count;

      if v_updated_count = 0 then
        insert into public.attendance (class_id, date, student_id, status)
        values (p_class_id, p_date, v_record.student_id, v_record.status);
      end if;
    else
      insert into public.attendance (class_id, date, student_id, status)
      values (p_class_id, p_date, v_record.student_id, v_record.status);
    end if;
  end loop;

  return case when p_update then 'updated' else 'created' end;
end;
$$;

revoke all on function public.save_teacher_class_attendance(uuid, date, jsonb, boolean) from public;
grant execute on function public.save_teacher_class_attendance(uuid, date, jsonb, boolean) to authenticated;

drop policy if exists "attendance_teacher_assigned_read" on public.attendance;
create policy "attendance_teacher_assigned_read" on public.attendance for select to authenticated
  using (
    public.current_role() = 'teacher'
    and exists (
      select 1
      from public.classes c
      join public.teachers t on t.id = c.class_teacher_id
      where c.id = attendance.class_id
        and lower(t.email) = lower((select email from auth.users where id = auth.uid()))
    )
  );

drop policy if exists "attendance_principal_write" on public.attendance;
drop policy if exists "attendance_teacher_write" on public.attendance;

drop policy if exists "notices_principal_manage" on public.notices;
create policy "notices_principal_manage" on public.notices for all to authenticated
  using (public.current_role() = 'principal')
  with check (public.current_role() = 'principal');

drop policy if exists "notices_teacher_read" on public.notices;
create policy "notices_teacher_read" on public.notices for select to authenticated
  using (public.current_role() = 'teacher');
