import { sql } from "../clients/neon";

type RestaurantIdRow = {
  id: string;
};

export type RestaurantStatus = "draft" | "pending" | "approved" | "rejected";

export type RestaurantRecord = {
  id: string;
  phone: string;
  firebase_uid: string;
  owner_name: string | null;
  name: string | null;
  fssai_number: string | null;
  photo_url: string | null;
  status: RestaurantStatus;
  review_reason: string | null;
  application_submitted_at: string | null;
  application_reviewed_at: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  created_at: string;
};

export async function ensureRestaurantTable() {
  await sql`create extension if not exists "pgcrypto";`;
  await sql`
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
  `;

  await sql`alter table restaurants add column if not exists owner_name text;`;
  await sql`alter table restaurants add column if not exists photo_url text;`;
  await sql`alter table restaurants add column if not exists review_reason text;`;
  await sql`alter table restaurants add column if not exists application_submitted_at timestamptz;`;
  await sql`alter table restaurants add column if not exists application_reviewed_at timestamptz;`;
  await sql`alter table restaurants add column if not exists lat double precision;`;
  await sql`alter table restaurants add column if not exists lng double precision;`;
  await sql`alter table restaurants add column if not exists address text;`;
  await sql`
    update restaurants
    set status = 'draft'
    where status is null or status not in ('draft', 'pending', 'approved', 'rejected');
  `;
  await sql`alter table restaurants alter column status set default 'draft';`;
  await sql`
    do $$ begin
      alter table restaurants
        add constraint restaurants_status_check
        check (status in ('draft', 'pending', 'approved', 'rejected'));
    exception
      when duplicate_object then null;
    end $$;
  `;
  await sql`create index if not exists idx_restaurants_status on restaurants(status);`;
  await sql`
    create index if not exists idx_restaurants_application_submitted_at
    on restaurants(application_submitted_at desc);
  `;
}

export function hasRestaurantProfile(record: RestaurantRecord): boolean {
  return Boolean(record.owner_name && record.name && (record.fssai_number || record.photo_url));
}

export function hasRestaurantLocation(record: RestaurantRecord): boolean {
  return typeof record.lat === "number" && typeof record.lng === "number";
}

export async function upsertRestaurantByPhone(params: {
  phone: string;
  firebaseUid: string;
}): Promise<string> {
  await ensureRestaurantTable();

  const rows = (await sql`
    insert into restaurants (phone, firebase_uid, status)
    values (${params.phone}, ${params.firebaseUid}, 'draft')
    on conflict (phone) do update
      set firebase_uid = excluded.firebase_uid
    returning id
  `) as RestaurantIdRow[];

  return rows[0].id;
}

export async function getRestaurantById(restaurantId: string): Promise<RestaurantRecord | null> {
  await ensureRestaurantTable();
  const rows = (await sql`
    select
      id,
      phone,
      firebase_uid,
      owner_name,
      name,
      fssai_number,
      photo_url,
      status,
      review_reason,
      application_submitted_at,
      application_reviewed_at,
      lat,
      lng,
      address,
      created_at
    from restaurants
    where id = ${restaurantId}
    limit 1
  `) as RestaurantRecord[];

  return rows[0] ?? null;
}

export async function getRestaurantByPhone(phone: string): Promise<RestaurantRecord | null> {
  await ensureRestaurantTable();
  const rows = (await sql`
    select
      id,
      phone,
      firebase_uid,
      owner_name,
      name,
      fssai_number,
      photo_url,
      status,
      review_reason,
      application_submitted_at,
      application_reviewed_at,
      lat,
      lng,
      address,
      created_at
    from restaurants
    where phone = ${phone}
    limit 1
  `) as RestaurantRecord[];

  return rows[0] ?? null;
}

export async function updateRestaurantProfile(params: {
  restaurantId: string;
  ownerName: string;
  hotelName: string;
  fssaiNumber?: string;
  photoUrl?: string;
}): Promise<RestaurantRecord | null> {
  await ensureRestaurantTable();
  const rows = (await sql`
    update restaurants
    set
      owner_name = ${params.ownerName},
      name = ${params.hotelName},
      fssai_number = ${params.fssaiNumber ?? null},
      photo_url = ${params.photoUrl ?? null}
    where id = ${params.restaurantId}
    returning
      id,
      phone,
      firebase_uid,
      owner_name,
      name,
      fssai_number,
      photo_url,
      status,
      review_reason,
      application_submitted_at,
      application_reviewed_at,
      lat,
      lng,
      address,
      created_at
  `) as RestaurantRecord[];

  return rows[0] ?? null;
}

export async function updateRestaurantLocation(params: {
  restaurantId: string;
  lat: number;
  lng: number;
  address?: string;
}): Promise<RestaurantRecord | null> {
  await ensureRestaurantTable();
  const rows = (await sql`
    update restaurants
    set
      lat = ${params.lat},
      lng = ${params.lng},
      address = ${params.address ?? null}
    where id = ${params.restaurantId}
    returning
      id,
      phone,
      firebase_uid,
      owner_name,
      name,
      fssai_number,
      photo_url,
      status,
      review_reason,
      application_submitted_at,
      application_reviewed_at,
      lat,
      lng,
      address,
      created_at
  `) as RestaurantRecord[];

  return rows[0] ?? null;
}

export async function submitRestaurantApplication(restaurantId: string): Promise<RestaurantRecord | null> {
  await ensureRestaurantTable();
  const rows = (await sql`
    update restaurants
    set
      status = 'pending',
      review_reason = null,
      application_submitted_at = now(),
      application_reviewed_at = null
    where id = ${restaurantId}
      and status in ('draft', 'rejected')
    returning
      id,
      phone,
      firebase_uid,
      owner_name,
      name,
      fssai_number,
      photo_url,
      status,
      review_reason,
      application_submitted_at,
      application_reviewed_at,
      lat,
      lng,
      address,
      created_at
  `) as RestaurantRecord[];

  return rows[0] ?? null;
}

export async function reviewRestaurantApplication(params: {
  restaurantId: string;
  status: "approved" | "rejected";
  reason?: string;
}): Promise<RestaurantRecord | null> {
  await ensureRestaurantTable();
  const rows = (await sql`
    update restaurants
    set
      status = ${params.status},
      review_reason = ${params.reason ?? null},
      application_reviewed_at = now()
    where id = ${params.restaurantId}
      and status = 'pending'
    returning
      id,
      phone,
      firebase_uid,
      owner_name,
      name,
      fssai_number,
      photo_url,
      status,
      review_reason,
      application_submitted_at,
      application_reviewed_at,
      lat,
      lng,
      address,
      created_at
  `) as RestaurantRecord[];

  return rows[0] ?? null;
}

export async function listRestaurantApplications(status?: "pending" | "approved" | "rejected") {
  await ensureRestaurantTable();

  if (status) {
    return (await sql`
      select
        id,
        phone,
        firebase_uid,
        owner_name,
        name,
        fssai_number,
        photo_url,
        status,
        review_reason,
        application_submitted_at,
        application_reviewed_at,
        lat,
        lng,
        address,
        created_at
      from restaurants
      where status = ${status}
      order by application_submitted_at desc nulls last, created_at desc
    `) as RestaurantRecord[];
  }

  return (await sql`
    select
      id,
      phone,
      firebase_uid,
      owner_name,
      name,
      fssai_number,
      photo_url,
      status,
      review_reason,
      application_submitted_at,
      application_reviewed_at,
      lat,
      lng,
      address,
      created_at
    from restaurants
    where status in ('pending', 'approved', 'rejected')
    order by application_submitted_at desc nulls last, created_at desc
  `) as RestaurantRecord[];
}
