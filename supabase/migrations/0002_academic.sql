-- CampusFlow EPR schema part 2: academic tables + RLS + storage
create table if not exists exams (
  id uuid primary key default uuid_generate_v4(),
  name text not null, subject text, class_id uuid,
  date date, start_time text, end_time text,
  room text, max_marks int default 100, status text default 'Upcoming');
create table if not exists marks (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid, subject text, exam text,
  internal int default 0, external int default 0,
  total int default 0, grade text, status text);
create table if not exists attendance (
  id uuid primary key default uuid_generate_v4(),
  date date not null, class_id uuid, subject text,
  student_id uuid, status text default 'Present');
create table if not exists assignments (
  id uuid primary key default uuid_generate_v4(),
  title text not null, subject text, class_id uuid,
  description text, deadline date, max_marks int default 20,
  status text default 'Active', submissions int default 0);
create table if not exists study_materials (
  id uuid primary key default uuid_generate_v4(),
  title text not null, subject text, class_id uuid,
  file_url text, type text, size_kb int default 0,
  downloads int default 0);
create table if not exists notices (
  id uuid primary key default uuid_generate_v4(),
  title text not null, description text,
  audience text default 'Everyone', priority text default 'Medium',
  date date default current_date);
create table if not exists leave_requests (
  id uuid primary key default uuid_generate_v4(),
  applicant_name text, role text, from_date date,
  to_date date, reason text, status text default 'Pending');
create table if not exists fees (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid, tuition int default 0, exam_fee int default 0,
  library int default 0, transport int default 0,
  total int default 0, paid int default 0, due int default 0,
  status text default 'Partial', due_date date);
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  title text, message text, type text,
  read boolean default false);
alter table profiles enable row level security;
alter table students enable row level security;
alter table teachers enable row level security;
alter table marks enable row level security;
alter table attendance enable row level security;
alter table notices enable row level security;
alter table fees enable row level security;
