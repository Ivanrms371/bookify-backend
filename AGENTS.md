# AGENTS.md

This file provides guidance to Codex and other coding agents when working in the backend app.

NestJS 11 API for **Turnify**. Uses Prisma 7 on Postgres, Socket.IO, React Email + Resend, Cloudinary, LemonSqueezy, and `pnpm`.

## Commands

- `pnpm start:dev` — Nest watch mode.
- `pnpm start:prod` — run built `dist/main`.
- `pnpm build` — `nest build`.
- `pnpm lint` / `pnpm format` — ESLint autofix / Prettier.
- `pnpm test` — Jest unit tests (`*.spec.ts` under `src/`).
- `pnpm test -- path/to/file.spec.ts` — run one test file.
- `pnpm test -- -t "name"` — filter by test name.
- `pnpm test:e2e` — Jest with `test/jest-e2e.json`.
- `pnpm test:cov` — coverage.
- `pnpm email:dev` — React Email preview server for `src/modules/notifications/application/templates`.
- Prisma: `pnpm prisma migrate dev`, `pnpm prisma generate`, `pnpm prisma db seed`. The seed script is `prisma/seed.ts`. Prisma Client is generated to `src/generated/prisma`; always import from there, not `@prisma/client`.
- Local DB: `docker compose up -d db` starts Postgres 18 on `localhost:5433` (`turnify_db`, user/pass `postgres`).

Main bootstrap (`src/main.ts`): global `/api` prefix, cookie-parser, global `ValidationPipe`, CORS restricted to `APP_URL`, and `PORT` defaulting to `4000`.

## Architecture

- Domain modules live under `src/modules/<feature>/` and usually include `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, plus `dto/`, `domain/`, `mappers/`, and sometimes nested `features/`.
- Current modules include `appointments`, `availability`, `customers`, `dashboard`, `invitations`, `memberships`, `notifications`, `payments`, `portal`, `professionals`, `public`, `services`, `subscriptions`, `team`, `tenants`, `users`, and `verifications`.
- `modules/public/` is the unauthenticated booking-portal API.
- `src/shared/` holds infrastructure adapters: `prisma/`, `cookies/`, `media/`, `schedule/`, `integrations/{cloudinary,lemon-squeezy}`, and `infrastructure/`.
- `src/common/` holds app-layer concerns: `security/`, `database/`, `webhooks/`, `stats/`, plus reusable decorators, DTOs, helpers, pipes, utils, types, and features.
- Global guards in `app.module.ts` run in order: `JwtAuthGuard` → `TenantGuard` → `PermissionsGuard`. Tenant scoping is the default; opt out explicitly only for public routes.
- Prisma schema uses UUIDv7 via `dbgenerated("uuidv7()")` and outputs the client to `src/generated/prisma`.

The frontend (`../frontend`) consumes `/api/*`. When changing a DTO or response contract, update matching frontend API calls and Zod schemas.
