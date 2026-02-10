# NearBite Monorepo (Option A)

Single frontend app + single backend API + one shared database.

## Tech Stack

- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript + Zod validation
- Data: Upstash Redis + Neon Postgres

## Structure

```txt
apps/
  web/          # Next.js app with role routes: /user, /restaurant, /admin
  api/          # Single backend API
packages/
  ui/           # Shared UI package
  auth/         # Shared auth and RBAC helpers
  api-client/   # Shared API client
  config/       # Shared config docs/placeholders
database/
  neon/         # Neon SQL schema and migrations
infra/
  docker-compose.yml  # local fallback postgres + redis
```

## Quick start

1. Copy `.env.example` to `.env` and fill Upstash + Neon credentials.
2. `npm install`
3. `npm run dev:web`
4. `npm run dev:api`
