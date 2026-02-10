import { sql } from "./neon";
import type { CreateUserPayload } from "./user-schemas";

let ensureTablePromise: Promise<void> | null = null;

async function ensureUserProfileTable(): Promise<void> {
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      await sql(`
        create table if not exists user_profile (
          phone text primary key,
          name text not null,
          email text,
          created_at timestamptz not null default now()
        );
      `);
    })();
  }

  await ensureTablePromise;
}

type ExistsRow = { exists: boolean };

export async function hasUserWithPhone(phone: string): Promise<boolean> {
  await ensureUserProfileTable();

  const rows = (await sql`
    select exists (
      select 1
      from user_profile
      where phone = ${phone}
    ) as exists
  `) as ExistsRow[];

  return Boolean(rows[0]?.exists);
}

type InsertRow = { phone: string };

export async function createUserRecord(payload: CreateUserPayload): Promise<boolean> {
  await ensureUserProfileTable();

  const rows = (await sql`
    insert into user_profile (phone, name, email)
    values (${payload.phone}, ${payload.name}, ${payload.email ?? null})
    on conflict (phone) do nothing
    returning phone
  `) as InsertRow[];

  return rows.length > 0;
}
