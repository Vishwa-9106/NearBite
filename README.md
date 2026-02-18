# NearBite Monorepo

Three frontends (user, restaurant, admin) + single backend API + shared Postgres/Redis.

## Tech Stack

- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript + Zod validation
- Realtime: Socket.IO (next module)
- Data: Upstash Redis + Neon Postgres

## Structure

```txt
apps/
  user/         # User-facing Next.js app (customer)
  restaurant/   # Restaurant dashboard app
  admin/        # Admin review app
  api/          # Single backend API
database/
  neon/         # Neon SQL schema and migrations
infra/
  docker-compose.yml  # local fallback postgres + redis
```

## Quick start

1. Copy `.env.example` to `.env` and fill all required values.
2. Add a valid Firebase service account JSON in `FIREBASE_SERVICE_ACCOUNT_JSON`.
3. `npm install`
4. `npm run dev:user`
5. `npm run dev:restaurant`
6. `npm run dev:admin`
7. `npm run dev:api`

## Auth implementation

- User/Restaurant login: Firebase Phone OTP in frontend, Firebase ID token verification in backend.
- Backend session: Redis-backed role-specific HttpOnly cookies (`nearbite_user_session`, `nearbite_restaurant_session`, `nearbite_admin_session`).
- Role-based auth: `user`, `restaurant`, `admin`.
- Admin login: credential-based via `/auth/admin/login`.

## API modules available now

- `POST /auth/session`
- `POST /auth/otp/start`
- `POST /auth/admin/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /users/me`
- `PATCH /users/me/profile`
- `PUT /users/me/location`
- `GET /restaurants/me`
- `POST /restaurants/me/document`
- `PATCH /restaurants/me/profile`
- `PUT /restaurants/me/location`
- `POST /restaurants/me/application/submit`
- `GET /restaurants/me/application`
- `GET /admin/applications?status=pending|approved|rejected`
- `POST /admin/applications/:restaurantId/approve`
- `POST /admin/applications/:restaurantId/reject`
- `GET /maps/reverse-geocode?lat={lat}&lng={lng}`

## Implemented auth + onboarding flow

- User app:
  - Phone OTP (Firebase) -> backend session (`role=user`).
  - New user goes to `/onboarding` (name + optional email + map picker).
  - Existing user goes to `/dashboard` (auto-redirects to onboarding if incomplete).
- Restaurant app:
  - Phone OTP (Firebase) -> backend session (`role=restaurant`).
  - New/draft/rejected goes to `/onboarding`.
  - Pending goes to `/application/status` (review in progress message).
  - Approved goes to `/dashboard`.
  - Onboarding requires owner name, hotel name, location, and either FSSAI or document URL/upload.
- Admin app:
  - Hardcoded credential login from env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
  - Review queue with approve/reject actions and optional reject reason.

## Deployment (Recommended)

Frontends (Vercel or similar):
- Deploy `apps/user`, `apps/restaurant`, `apps/admin` as separate projects.
- Set `NEXT_PUBLIC_API_BASE_URL` to `/api`.
- Set `API_PROXY_TARGET` to your backend URL.
- Set Firebase public keys in each frontend environment.

Local dev URLs:
- User: `http://127.0.0.1:3000`
- Restaurant: `http://127.0.0.1:3001`
- Admin: `http://127.0.0.1:3002`

Backend (Railway / Render / Fly.io / EC2):
- Deploy `apps/api`.
- Set env vars: `PORT`, `FRONTEND_ORIGINS`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`,
  `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_COOKIE_NAME`, `SESSION_COOKIE_DOMAIN`,
  `SESSION_COOKIE_SAME_SITE`, `SESSION_COOKIE_SECURE`, `AUTH_RATE_LIMIT_WINDOW_SECONDS`,
  `AUTH_RATE_LIMIT_MAX_ATTEMPTS`, `GOOGLE_MAPS_API_KEY`, `UPSTASH_REDIS_REST_URL`,
  `UPSTASH_REDIS_REST_TOKEN`, `NEON_DATABASE_URL`.
- Ensure `FRONTEND_ORIGINS` contains the deployed frontend URLs.
- For cross-site frontend/backend domains:
  - Set `SESSION_COOKIE_SAME_SITE=none`
  - Set `SESSION_COOKIE_SECURE=true`
  - Set `SESSION_COOKIE_DOMAIN` to your cookie domain if needed.

Database + Cache:
- Neon Postgres (serverless).
- Upstash Redis (serverless).
