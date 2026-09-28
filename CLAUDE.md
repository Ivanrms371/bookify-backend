# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

NestJS 11 API (product name: **Turnify**), Prisma 7 on Postgres, Socket.IO, React Email + Resend, Cloudinary, LemonSqueezy. Uses `pnpm`.

## Commands

- `pnpm start:dev` — Nest watch mode.
- `pnpm start:prod` — run built `dist/main`.
- `pnpm build` — `nest build`.
- `pnpm lint` / `pnpm format` — ESLint (autofix) / Prettier.
- `pnpm test` — Jest unit tests (matches `*.spec.ts` under `src/`).
- `pnpm test -- path/to/file.spec.ts` — run a single test file.
- `pnpm test -- -t "name"` — filter by test name.
- `pnpm test:e2e` — Jest with `test/jest-e2e.json`.
- `pnpm test:cov` — coverage.
- `pnpm email:dev` — React Email preview server for `src/modules/notifications/application/templates`.
- Prisma: `pnpm prisma migrate dev`, `pnpm prisma generate`, `pnpm prisma db seed` (seed script is `prisma/seed.ts`, wired via the `prisma.seed` field in `package.json`). Prisma Client is generated to `src/generated/prisma` — always import from there, not `@prisma/client`.
- Local DB: `docker compose up -d db` → Postgres 18 on `localhost:5433` (db `turnify_db`, user/pass `postgres`).

Main bootstrap (`src/main.ts`): global `/api` prefix, cookie-parser, global `ValidationPipe` (see `src/config/`), CORS restricted to `APP_URL`. Server listens on `PORT` (default `4000`).

## Architecture

- Domain-modularized Nest app. Each feature under `src/modules/<feature>/` typically ships `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, plus `dto/`, `domain/`, `mappers/`, and sometimes `features/` for sub-features (see `modules/tenants/features/{usage,settings,onboarding}` — these are registered as separate modules in `app.module.ts`).
- Feature modules: `appointments`, `availability`, `customers`, `dashboard`, `invitations`, `memberships`, `notifications`, `payments`, `portal`, `professionals`, `public`, `services`, `subscriptions`, `team`, `tenants`, `users`, `verifications`. `modules/public/` is the unauthenticated booking-portal API.
- Cross-cutting code lives in two places (both are meaningful — pick correctly):
  - `src/shared/` — infrastructure adapters: `prisma/`, `cookies/`, `media/`, `schedule/`, `integrations/{cloudinary,lemon-squeezy}`, `infrastructure/`.
  - `src/common/` — app-layer concerns: `security/` (auth guards, permissions), `database/`, `webhooks/`, `stats/`, plus reusable `decorators/`, `dto/`, `helpers/`, `pipes/`, `utils/`, `types/`, `features/`.
- Global guards applied via `APP_GUARD` in `app.module.ts` (order matters): `JwtAuthGuard` → `TenantGuard` → `PermissionsGuard`. Multi-tenant model: `User` ↔ `Membership` ↔ `Tenant` with `MembershipRole`; the tenant guard resolves the active tenant from request context, so new controllers get tenant scoping by default — opt out explicitly for public routes.
- Auth: `src/auth/` holds the login/signup/OAuth flows; JWT infra is in `src/auth/infrastructure/jwt/`, session persistence in `src/auth/sessions/`. Tokens have a `tokenVersion` on `User` for global revocation.
- Prisma schema in `prisma/schema.prisma` uses `dbgenerated("uuidv7()")` for IDs and `provider = "prisma-client"` with output to `src/generated/prisma`. Seeds live in `prisma/seeds/` orchestrated by `prisma/seed.ts`.
- Emails: React Email templates under `src/modules/notifications/application/templates`, rendered with `@react-email/render`, sent via Resend.
- Realtime: Socket.IO gateway (`@nestjs/platform-socket.io`, `@nestjs/websockets`).
- Scheduling: `@nestjs/schedule` registered globally; cron/interval jobs live inside their owning module.

The frontend (`../frontend`) consumes this API under `/api/*`; when changing a DTO, update the matching `frontend/app/features/<domain>/api` + Zod schemas.
