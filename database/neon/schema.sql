create table if not exists app_user (
  id text primary key,
  role text not null check (role in ('user', 'restaurant', 'admin')),
  email text unique not null,
  created_at timestamptz not null default now()
);
