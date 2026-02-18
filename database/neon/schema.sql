create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  firebase_uid text not null unique,
  name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists user_locations (
  user_id uuid primary key references users(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy_m double precision,
  address text,
  updated_at timestamptz not null default now()
);

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  firebase_uid text not null unique,
  owner_name text,
  name text,
  fssai_number text,
  photo_url text,
  status text not null default 'draft',
  review_reason text,
  application_submitted_at timestamptz,
  application_reviewed_at timestamptz,
  lat double precision,
  lng double precision,
  address text,
  created_at timestamptz not null default now()
);

update restaurants
set status = 'draft'
where status is null or status not in ('draft', 'pending', 'approved', 'rejected');

do $$ begin
  alter table restaurants
    add constraint restaurants_status_check
    check (status in ('draft', 'pending', 'approved', 'rejected'));
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_restaurants_status on restaurants(status);
create index if not exists idx_restaurants_application_submitted_at on restaurants(application_submitted_at desc);
