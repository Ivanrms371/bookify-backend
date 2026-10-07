# Appointment lifecycle and statistics

Appointments owns its write projections under `src/modules/appointments/stats`. The former unused `common/stats` write module and its imports are removed. Legacy tenant/professional read services remain separate; Reports owns dashboard/report composition.

## Lifecycle

New dashboard and public bookings are CONFIRMED automatically. Existing PENDING records are preserved and can be confirmed through `PATCH /appointments/:id/status` with `{ status: "CONFIRMED" }`. The endpoint also accepts COMPLETED and NO_SHOW. Existing appointment-update permissions apply: OWNER/ADMIN can update other professionals, STAFF only appointments whose professional is linked to their account. The service enforces this independently of controller metadata.

PENDING/CONFIRMED can become COMPLETED or NO_SHOW once the appointment has started. COMPLETED and NO_SHOW can be corrected to each other; CANCELLED cannot be restored through this endpoint. Same-state requests return the existing record without rewriting the appointment or emitting another event. Rescheduling accepts only PENDING/CONFIRMED. Authenticated cancellation still accepts NO_SHOW as before; COMPLETED cannot be cancelled. Public cancellation accepts CONFIRMED and is now repeat-safe. The former no-op DELETE endpoint is removed; cancellation retains history.

Manual approval mode/expiry is not implemented: the existing `requireConfirmation` setting remains unenforced. Creation always confirms. Pending bookings continue to occupy time. No bulk conversion of historical PENDING records occurs.

## Atomic updates

Both authenticated and public create/reschedule/cancel/status paths call `AppointmentStatsService.mutate`. It starts an interactive transaction and locks the tenant row before re-reading and validating the appointment. Appointment and customer writes, occupancy changes and projection replacement share the transaction client. The tenant lock serializes these appointment writers, including availability-check/write pairs. Availability/configuration reads still use their existing client; external writers or simultaneous schedule/configuration edits are not covered by this lock protocol. No database exclusion constraint was added or live concurrency test performed.

After the mutation, `AppointmentStatsRepository.rebuild` derives the tenant's summaries from persisted appointments. This repairs previously unwired/stale counters rather than decrementing an unreliable baseline. Grouping is done in memory once; unchanged projected values are compared and skipped to avoid unnecessary writes. Historical empty daily buckets are reset to zero after rescheduling/timezone changes. Rebuild runs only when an appointment mutation is requested; no startup job, cron, database mutation or backfill was executed in this change.

The approach reads a tenant's appointment history on each mutation. It prioritizes correctness for independent/small businesses. Large histories should eventually use affected-bucket SQL aggregates or incremental projections with an explicit reconciliation/version mechanism. The transaction timeout is 15 seconds; real performance and lock behavior remain to be measured against PostgreSQL.

## Metric meanings

| Metric | Rule |
| --- | --- |
| appointments / totalAppointments | All appointment records, including pending, cancelled and no-show |
| confirmed | Records currently CONFIRMED; completing/cancelling removes them from this count |
| completed / cancelled / noShow | Records currently in that state |
| revenue / totalRevenue / customer totalSpent | Sum persisted price minus discountAmount for COMPLETED appointments; Decimal arithmetic; not money collected |
| tenant daily newCustomers | Each customer's earliest COMPLETED appointment in this tenant; appointment time then ID breaks ties |
| professional newCustomers / totalNewCustomers | Each customer's earliest COMPLETED visit with that professional |
| customer firstAppointmentAt / lastAppointmentAt | Earliest/latest scheduled start across all their appointment records |

Customerless appointments count toward appointment and revenue metrics but not first visits. Tenant lifetime `totalCustomers` is not written by appointment projections; customer-record counts belong to Customers. Dashboard totalCustomers now counts current non-deleted tenant customers directly. Billing usage/subscription counters are untouched.

Daily grouping uses the appointment start's calendar day in TenantSettings.timeZone, falling back to America/Montevideo. Date-only keys are stored as UTC-midnight Dates, independently of the server timezone. Completing an earlier appointment updates its scheduled day, not today's bucket. Rescheduling/professional reassignment and corrections are reflected by re-derivation. Dashboard daily/monthly ranges and today's appointment query use the same business calendar semantics.

## Events and consumers

Events are queued during the transaction and emitted only after successful commit. Public cancellation removes blocks and emits `appointment.cancelled`; public rescheduling excludes its own occupancy, updates durationMinutes and emits `appointment.rescheduled`. Completion/no-show emits `appointment.finished`, whose notification listener cancels pending reminders. A public cancellation for a professional without an account still cancels reminders but does not try to notify a nonexistent user.

Post-commit events are asynchronous and do not guarantee durable/exactly-once delivery. Existing management URL conventions and public web mutation placeholders are unchanged. Web has no status-update controls and needs no change for the authenticated endpoint; public creation's CONFIRMED response is unchanged.

Dashboard Agenda menus offer Ver cita first for readable appointments, including cancelled records, plus permission-scoped Reagendar, Cancelar and Crear otra. Confirm is intentionally absent from the UI; the endpoint retains legacy confirmation support. Ver cita opens a read-only detail drawer using shared dashboard components, desktop max-w-3xl and full mobile width. Fresh tenant/authorization-scoped data supplies the business-timezone schedule, side-by-side customer/professional contacts with formatted phone numbers, professional bio when available, saved price/discount total and separate public/internal notes. A service summary reads the current catalog image and brief description through the existing service ID endpoint when service-read permission is present; its displayed price and total remain the appointment snapshots, independently of current catalog prices. Outcome buttons sit together in the fixed footer; the body scrolls independently. The management token is never displayed. No vino and Completar live only in the drawer: both disable before start, completed records allow No vino correction, no-show records allow Completar correction, and cancelled/read-only records have no outcome footer. Saving blocks duplicate submissions and dismissal; success keeps the drawer open with updated status and feedback. Tenant/account changes or lost read access close it. Create/reschedule/cancel/status invalidate appointment, availability, dashboard, report and customer caches.

## Verification limits

Unit tests cover status transitions, own/others permissions, repeated requests, cancelled/future restrictions, Decimal revenue, first visits, timezone day keys, stale/empty bucket replacement, transaction ordering and event suppression on failure. Public-path tests cover transaction client propagation and mutation events. These use mocked infrastructure; no production data, provider services, migrations or real mail were invoked.

Validation on 2026-10-07: focused backend checks passed (17 suites, 178 tests); dashboard appointment/permissions/report checks passed (27 tests); backend build-config and dashboard non-emitting TypeScript checks passed. A full backend run outside the sandbox passed 60 suites/788 tests and failed 12 tests in two unchanged invitation/team suites; the invitation fixture lacks UsersService.findById. That full run preceded the final additional status/timezone assertions. The initial sandboxed full run also failed mocked HTTP tests because local port binding was blocked; those HTTP tests passed on the approved outside-sandbox rerun.
