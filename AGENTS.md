# Backend agent guidance

This independent Git repository is the NestJS 11 API using Prisma 7 and PostgreSQL. Run pnpm commands here. When available, [parent guidance](../AGENTS.md), [architecture](../docs/architecture.md), and [cross-app workflow](../docs/cross-app-changes.md) explain the larger project; the local instructions below also apply when this app is opened alone.

## Commands and side effects

| Command                                                             | Behavior                                                                                                       |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `pnpm start:dev`                                                    | Starts Nest watch mode; connects to configured infrastructure and can activate scheduled jobs/listeners.       |
| `pnpm start:prod`                                                   | Runs `node dist/main`; requires a build.                                                                       |
| `pnpm build`                                                        | Runs `nest build`; writes build artifacts.                                                                     |
| `pnpm exec tsc -p tsconfig.build.json --noEmit --incremental false` | Checks build-config types without emitting files.                                                              |
| `pnpm test --runInBand`                                             | Runs Jest unit tests under `src`, matching `*.spec.ts`.                                                        |
| `pnpm test --runInBand path/to/file.spec.ts`                        | Selects a unit test file.                                                                                      |
| `pnpm test:e2e`                                                     | Runs Jest with `test/jest-e2e.json`; may initialize the full app/infrastructure.                               |
| `pnpm test:cov`                                                     | Runs unit tests and writes coverage.                                                                           |
| `pnpm lint` / `pnpm format`                                         | ESLint `--fix` / Prettier `--write`: both rewrite files.                                                       |
| `pnpm email:dev`                                                    | Starts React Email preview for notification templates.                                                         |
| `pnpm exec prisma generate`                                         | Rewrites generated client files under `src/generated/prisma` and configured generator outputs.                 |
| `pnpm exec prisma migrate dev` / `pnpm exec prisma db seed`         | Mutates the database; migration can also write migrations/generate artifacts. Confirm before database changes. |
| `docker compose up -d db`                                           | Starts persistent Postgres 18 via `docker-compose.yml`, mapped to localhost port 5433.                         |

`prisma.config.ts` configures `tsx prisma/seed.ts`; the older nested package script uses ts-node and is not the current Prisma seed configuration. Import application Prisma client/types/enums from `src/generated/prisma` (for example `client` and `enums`), following nearby code, rather than substituting `@prisma/client`. Do not hand-edit generated files.

## Runtime, security and persistence

`src/main.ts` sets `/api`, cookies, raw-body support, global validation and port `BACKEND_PORT` or 4000. `src/config/cors.config.ts` allows all origins in development, requests without an Origin, and `APP_URL` otherwise, with credentials. Do not describe CORS as always restricted to `APP_URL`; no health controller was found at `/api/health`.

Global guards in `src/app.module.ts` run `JwtAuthGuard` → `TenantGuard` → `PermissionsGuard`. Tenant resolution reads `x-tenant-id` and `x-tenant-slug`, with ID precedence, and verifies active membership. Inspect optional/skip-tenant decorators before changing exceptions. Role permissions for OWNER/ADMIN/STAFF live in `src/common/security/constants/role-permissions.constants.ts`; controller permission metadata and service ownership checks both matter. A route passing a guard does not prove resource ownership.

`@Public()` bypasses auth and tenant guards. PermissionsGuard independently enforces declared permissions; public routes must still scope resources and validate tenant/professional/service relationships or management tokens in services. Never rely on a client-provided ID alone as authorization.

Domain modules under `src/modules` commonly use modules, controllers, services, repositories, DTOs and mappers, but their layouts vary. `src/shared` contains infrastructure adapters; `src/common` contains security and other cross-cutting application concerns. Use actual module imports/exports as the dependency map. Repositories exist, but services also use Prisma directly for queries/transactions (for example `appointments-public.service.ts`). Preserve transaction client propagation and inspect which calls actually share the transaction; repository-only access is not an existing invariant.

Appointments depend on availability, customers, professionals, services and tenant settings. Creation/rescheduling/cancellation paths can emit notification-related events; compare authenticated and public paths rather than assuming equal event behavior. Availability combines timezone conversion, business/professional working hours, exceptions, appointment blocks, buffers and booking limits. Changes require tracing these rules together. `src/modules/portal/portal.module.ts` is commented out and is not registered as an active module.

## Dependencies, checks and coordination

Postgres, environment configuration, cookie/JWT auth, Socket.IO, event listeners, scheduling, Cloudinary, React Email/Resend and LemonSqueezy are meaningful runtime dependencies. Avoid real mail, payments, media uploads or scheduled side effects during checks unless authorized. Environment templates are not a verified complete setup guide.

Use targeted unit checks and non-emitting TypeScript checks appropriate to a change. The supplied earlier baseline was 2 suites/8 tests passing and a passing build-config type check; report current results separately. The e2e file still expects starter `Hello World!` at `/` and was not established as a valid API baseline. No repository CI workflows were found. Do not run autofix merely to validate documentation.

For contract changes inspect both `../frontend` dashboard and `../web` public consumers, when present; update affected calls/types/schemas and document an unaffected consumer. If working from this repository alone, report coordination needed in sibling repositories. Preserve dirty files and Git structure. Use local [run-backend](.agents/skills/run-backend/SKILL.md) for server lifecycle and [new-nest-module](.agents/skills/new-nest-module/SKILL.md) for feature additions. No migration skill is present; confirmation is still required for DB changes. Deleted historical dependency rules are pending reconciliation; current session restrictions govern operations.

## Documentation and evidence

For changes to identity, tenant isolation or resource ownership, read [access control](docs/access-control.md). For scheduling configuration, availability or appointment lifecycle changes, read [scheduling and booking](docs/scheduling-and-booking.md). These local guides explain cross-module relationships and known uncertainties; verify the relevant implementation and tests before acting.

Documentation provides architectural/domain context, but relevant code and tests remain the evidence of actual behavior. When documentation conflicts with implementation:

- Do not silently choose one.
- Report the inconsistency.
- Determine actual behavior from relevant implementation/tests.
- Update documentation when the current task changes documented behavior.
