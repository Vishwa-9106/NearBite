import { sql } from "./neon";
import type { CreateRestaurantPayload } from "./restaurant-schemas";

let ensureTablePromise: Promise<void> | null = null;

async function ensureRestaurantProfileTable(): Promise<void> {
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      await sql(`
        create table if not exists restaurant_profile (
          phone text primary key,
          restaurant_name text not null,
          owner_name text not null,
          fssai_license_url text not null,
          google_maps_location_link text not null,
          verification_status text not null default 'pending' check (verification_status in ('pending', 'verified')),
          created_at timestamptz not null default now()
        );
      `);
    })();
  }

  await ensureTablePromise;
}

type ExistsRow = { exists: boolean };

export async function hasRestaurantWithPhone(phone: string): Promise<boolean> {
  await ensureRestaurantProfileTable();

  const rows = (await sql`
    select exists (
      select 1
      from restaurant_profile
      where phone = ${phone}
    ) as exists
  `) as ExistsRow[];

  return Boolean(rows[0]?.exists);
}

type InsertRow = { phone: string };

export async function createRestaurantRecord(payload: CreateRestaurantPayload): Promise<boolean> {
  await ensureRestaurantProfileTable();

  const rows = (await sql`
    insert into restaurant_profile (
      phone,
      restaurant_name,
      owner_name,
      fssai_license_url,
      google_maps_location_link,
      verification_status
    )
    values (
      ${payload.phone},
      ${payload.restaurantName},
      ${payload.ownerName},
      ${payload.fssaiLicenseUrl},
      ${payload.googleMapsLink},
      ${payload.verificationStatus}
    )
    on conflict (phone) do nothing
    returning phone
  `) as InsertRow[];

  return rows.length > 0;
}
