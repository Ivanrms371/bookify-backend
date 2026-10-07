# Development seed

The seed creates a fictional Montevideo hair salon, **Brisa Estudio — Demo** (`brisa-estudio-demo`), with three professionals, six services, 60 customers, working hours, settings, a Pro+ trial, monthly usage, customer metrics, and tenant/professional statistics.

Run from `backend/`, against an already migrated development database:

```sh
NODE_ENV=development pnpm exec prisma db seed
```

`DATABASE_URL` comes from the configured environment. Prisma runs `tsx prisma/seed.ts`; the older nested package seed entry is not the active configuration. PostgreSQL must support the existing schema's `uuidv7()` default. This workflow does not create a database, migrate it, generate Prisma files, or contact payment providers. Database mutations require confirmation under the project's agent guidance. Keep the development API idle during refresh.

## Access and fixtures

| Account | Role |
| --- | --- |
| mateo.brisa@example.com | OWNER |
| santiago.brisa@example.com | STAFF |
| lucia.brisa@example.com | STAFF |

The initial development-only password is `BrisaDemo!2026`; demo accounts are recreated on every run. Accounts are already email-verified to avoid verification delivery during login. Emails use the reserved `example.com` domain. Phone numbers and the address are fictional and must never be used for real delivery.

Appointments cover the two full previous calendar months (August and September when run in October), the current month through its last day, and at least the next seven days in the tenant timezone. Past days vary between 35–67% target occupancy; today uses remaining bookable times. Tomorrow targets 85–90% occupied working minutes; the following days target 45%, 70%, 35%, 60%, 50%, and 75%, repeating those six quieter targets through month end. Historical records include completed, cancelled, and no-show examples. Future records are confirmed customer bookings or pending staff bookings. A professional has a full-day training closure on day four.

Tenant, service, user and professional creation dates start at the beginning of the earliest seeded month. Customer creation dates are spread from that date through today. Tenant/professional daily and lifetime statistics, customer metrics and monthly usage are rebuilt from the full appointment history; upcoming bookings contribute counts but no completed revenue.

Professional schedules stay inside tenant hours. Fifteen-minute slot intervals accommodate 45-minute services. Other booking settings use schema defaults, including zero buffer, 30-minute notice, and a 30-day horizon. At least one short-service gap remains per working professional tomorrow; quieter days reserve gaps for their longest assigned service. The output reports daily counts, occupancy, and remaining short-service slots; slot counts are alternative start times, not independent appointment capacity.

## Refresh and safety

The entry point requires `NODE_ENV=development` and `DATABASE_URL` before database access. Stable fixture UUIDs and natural unique keys distinguish demo data from unrelated records; identity collisions cause rollback rather than adopting existing data.

Fixture IDs use UUID v7 with a fixed timestamp (2026-10-01 UTC) and key-derived SHA-256 entropy, so repeat runs preserve identities and pass the application's v7 validation. These IDs do not encode actual record creation times.

Every run first removes the recognized demo tenant (including the legacy UUID v5 tenant), its appointments, blocks and tenant-owned data, then removes the recognized demo accounts and recreates the dataset. Manual data inside that demo tenant is also removed. Other tenants and unrelated accounts are preserved. Cleanup refuses an unexpected tenant identity or a demo account shared with another tenant. Cleanup and recreation share one transaction, so a failed seed restores the previous dataset. Demo passwords reset to the documented development password; sign in again after reseeding.

The seed writes directly with Prisma and creates no notification deliveries, reminders, sessions, invitations, payments, or external billing IDs. It does not bootstrap Nest or emit appointment events. Appointment management tokens remain random capabilities and are not logged. IDs, tokens, and execution-relative dates are deliberately outside the deterministic appointment-planning guarantee.

Helpers live under `prisma/development/`; the existing local ignore rule excludes `prisma/seeds/`.

## Validation and limitations

The seed validates persisted snapshots, relationships, service durations, blocks, schedules, and non-overlap before committing. Unit tests cover all execution weekdays, month/year/leap-day boundaries, late-night execution, repeat planning, manual conflicts, long-service availability, buffers, and environment guards.

```sh
pnpm test --runInBand
pnpm exec tsc -p tsconfig.build.json --noEmit --incremental false
pnpm exec prisma validate
# Read-only checks through the actual availability repository/services:
NODE_ENV=development pnpm exec tsx prisma/development/verify.ts
```

Usage month numbering is consistently 1–12 in usage creation, reads, increments, and common appointment statistics. Existing mixed-format usage rows are not automatically migrated; audit them separately because their intended periods are ambiguous. Unlimited/zero quota percentage handling remains an application limitation.

The dashboard's upcoming list reads today, and charts read historical dates. Near closing time, today's list can be empty even though tomorrow is busy. Appointment generation uses explicit tenant-local dates; some dashboard/statistics readers still use process-local date boundaries and may show differences around midnight or with a server timezone unlike the tenant timezone.

Public business, service/professional discovery, availability, and slot validation can use these fixtures at `/b/brisa-estudio-demo`. The public-web create/cancel/reschedule mutations remain placeholders. Verify booking submission through the backend API in an isolated test with external notification delivery disabled; seeded data does not implement those web mutations.
