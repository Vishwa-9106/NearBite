import { sql } from "../clients/neon";

type UserIdRow = {
  id: string;
};

export type UserRecord = {
  id: string;
  phone: string;
  firebase_uid: string;
  name: string | null;
  email: string | null;
  created_at: string;
};

export type UserLocationRecord = {
  user_id: string;
  lat: number;
  lng: number;
  accuracy_m: number | null;
  address: string | null;
  updated_at: string;
};

export async function ensureUserTables() {
  await sql`create extension if not exists "pgcrypto";`;
  await sql`
    create table if not exists users (
      id uuid primary key default gen_random_uuid(),
      phone text not null unique,
      firebase_uid text not null unique,
      name text,
      email text,
      created_at timestamptz not null default now()
    );
  `;
  await sql`
    create table if not exists user_locations (
      user_id uuid primary key references users(id) on delete cascade,
      lat double precision not null,
      lng double precision not null,
      accuracy_m double precision,
      address text,
      updated_at timestamptz not null default now()
    );
  `;
}

export async function upsertUserByPhone(params: {
  phone: string;
  firebaseUid: string;
}): Promise<string> {
  await ensureUserTables();

  const rows = (await sql`
    insert into users (phone, firebase_uid)
    values (${params.phone}, ${params.firebaseUid})
    on conflict (phone) do update
      set firebase_uid = excluded.firebase_uid
    returning id
  `) as UserIdRow[];

  return rows[0].id;
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  await ensureUserTables();
  const rows = (await sql`
    select id, phone, firebase_uid, name, email, created_at
    from users
    where id = ${userId}
    limit 1
  `) as UserRecord[];

  return rows[0] ?? null;
}

export async function getUserByPhone(phone: string): Promise<UserRecord | null> {
  await ensureUserTables();
  const rows = (await sql`
    select id, phone, firebase_uid, name, email, created_at
    from users
    where phone = ${phone}
    limit 1
  `) as UserRecord[];

  return rows[0] ?? null;
}

export async function updateUserProfile(params: {
  userId: string;
  name: string;
  email: string | null;
}): Promise<UserRecord | null> {
  await ensureUserTables();
  const rows = (await sql`
    update users
    set
      name = ${params.name},
      email = ${params.email}
    where id = ${params.userId}
    returning id, phone, firebase_uid, name, email, created_at
  `) as UserRecord[];

  return rows[0] ?? null;
}

export async function upsertUserLocation(params: {
  userId: string;
  lat: number;
  lng: number;
  accuracyM?: number;
  address?: string;
}): Promise<UserLocationRecord | null> {
  await ensureUserTables();
  const rows = (await sql`
    insert into user_locations (user_id, lat, lng, accuracy_m, address)
    values (
      ${params.userId},
      ${params.lat},
      ${params.lng},
      ${params.accuracyM ?? null},
      ${params.address ?? null}
    )
    on conflict (user_id) do update
      set
        lat = excluded.lat,
        lng = excluded.lng,
        accuracy_m = excluded.accuracy_m,
        address = excluded.address,
        updated_at = now()
    returning user_id, lat, lng, accuracy_m, address, updated_at
  `) as UserLocationRecord[];

  return rows[0] ?? null;
}

export async function getUserLocation(userId: string): Promise<UserLocationRecord | null> {
  await ensureUserTables();
  const rows = (await sql`
    select user_id, lat, lng, accuracy_m, address, updated_at
    from user_locations
    where user_id = ${userId}
    limit 1
  `) as UserLocationRecord[];

  return rows[0] ?? null;
}
