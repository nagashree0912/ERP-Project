-- CampusFlow ERP: Marks Modification Requests table + RLS
create table if not exists marks_modification_requests (
  id uuid primary key default uuid_generate_v4(),
  student_id text not null,
  student_name text not null,
  student_code text,
  subject text not null,
  exam text not null,
  class_id text,
  current_internal int default 0,
  current_external int default 0,
  current_marks int default 0,
  requested_internal int default 0,
  requested_external int default 0,
  requested_marks int default 0,
  teacher_name text not null,
  teacher_email text,
  reason text not null,
  submission_date date default current_date,
  status text default 'Pending',
  principal_remarks text,
  decided_at timestamptz,
  decided_by text,
  created_at timestamptz default now()
);

alter table marks_modification_requests enable row level security;
