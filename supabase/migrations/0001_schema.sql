-- CampusFlow EPR schema part 1
create extension if not exists "uuid-ossp";
create table if not exists profiles (
  id uuid primary key, email text unique not null,
  full_name text not null, role text not null,
  phone text, avatar_url text, department text,
  created_at timestamptz default now());
create table if not exists classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null, department text, year text,
  section text, room text, class_teacher text, strength int default 0);
create table if not exists subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null, code text unique, department text,
  credits int default 0, teacher text);
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  student_code text unique, full_name text not null,
  email text, phone text, gender text, dob date,
  department text, course text, year text, section text,
  roll_number text unique, address text, status text default 'Active');
create table if not exists teachers (
  id uuid primary key default uuid_generate_v4(),
  teacher_code text unique, full_name text not null,
  email text, phone text, department text, subject text,
  qualification text, status text default 'Active');
create table if not exists parents (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null, email text, phone text,
  occupation text, status text default 'Active');
