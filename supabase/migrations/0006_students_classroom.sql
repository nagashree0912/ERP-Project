alter table students
  add column if not exists class_id uuid references classes(id) on delete set null;
