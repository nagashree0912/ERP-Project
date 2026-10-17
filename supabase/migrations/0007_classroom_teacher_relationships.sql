alter table classes
  add column if not exists class_teacher_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'classes_class_teacher_id_fkey'
      and conrelid = 'public.classes'::regclass
  ) then
    alter table classes
      add constraint classes_class_teacher_id_fkey
      foreign key (class_teacher_id) references teachers(id) on delete restrict;
  end if;
end $$;

update classes c
set class_teacher_id = t.id
from teachers t
where c.class_teacher_id is null
  and nullif(btrim(c.class_teacher), '') is not null
  and lower(btrim(c.class_teacher)) = lower(btrim(t.full_name));

alter table students
  drop constraint if exists students_class_id_fkey;
alter table students
  add constraint students_class_id_fkey
  foreign key (class_id) references classes(id) on delete restrict;

create or replace function public.validate_classroom_name()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if nullif(btrim(new.name), '') is null then
    raise exception 'Class name is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(lower(btrim(new.name)), 0));

  if exists (
    select 1 from classes c
    where c.id <> new.id
      and lower(btrim(c.name)) = lower(btrim(new.name))
  ) then
    raise exception 'A classroom with this class name already exists';
  end if;

  return new;
end;
$$;

drop trigger if exists classes_validate_name on classes;
create trigger classes_validate_name
before insert or update of name on classes
for each row execute function public.validate_classroom_name();

create or replace function public.validate_classroom_teacher()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and new.class_teacher_id is null then
    raise exception 'A registered class teacher is required';
  end if;

  if new.class_teacher_id is not null then
    perform pg_advisory_xact_lock(hashtextextended(new.class_teacher_id::text, 1));

    if exists (
      select 1 from classes c
      where c.id <> new.id
        and c.class_teacher_id = new.class_teacher_id
    ) then
      raise exception 'A teacher can be assigned to only one classroom';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists classes_validate_teacher on classes;
create trigger classes_validate_teacher
before insert or update of class_teacher_id on classes
for each row execute function public.validate_classroom_teacher();

create or replace function public.require_student_classroom()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.class_id is null then
    raise exception 'A classroom is required for each new student';
  end if;
  return new;
end;
$$;

drop trigger if exists students_require_classroom on students;
create trigger students_require_classroom
before insert or update of class_id on students
for each row execute function public.require_student_classroom();

drop policy if exists "classes_read_all" on classes;
drop policy if exists "classes_staff_write" on classes;
drop policy if exists "classes_principal_read" on classes;
create policy "classes_principal_read" on classes for select to authenticated
  using (public.current_role() = 'principal');
drop policy if exists "classes_teacher_assigned_read" on classes;
create policy "classes_teacher_assigned_read" on classes for select to authenticated
  using (
    public.current_role() = 'teacher'
    and exists (
      select 1
      from teachers t
      where t.id = classes.class_teacher_id
        and lower(t.email) = lower((select email from auth.users where id = auth.uid()))
    )
  );
create policy "classes_staff_write" on classes for all to authenticated
  using (public.current_role() = 'principal')
  with check (public.current_role() = 'principal');

drop policy if exists "students_staff_all" on students;
drop policy if exists "students_principal_all" on students;
create policy "students_principal_all" on students for all to authenticated
  using (public.current_role() = 'principal')
  with check (public.current_role() = 'principal');
drop policy if exists "students_teacher_classroom_all" on students;
create policy "students_teacher_classroom_all" on students for all to authenticated
  using (
    public.current_role() = 'teacher'
    and exists (
      select 1
      from classes c
      join teachers t on t.id = c.class_teacher_id
      where c.id = students.class_id
        and lower(t.email) = lower((select email from auth.users where id = auth.uid()))
    )
  )
  with check (
    public.current_role() = 'teacher'
    and exists (
      select 1
      from classes c
      join teachers t on t.id = c.class_teacher_id
      where c.id = students.class_id
        and lower(t.email) = lower((select email from auth.users where id = auth.uid()))
    )
  );
