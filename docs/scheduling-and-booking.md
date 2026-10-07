# Scheduling and booking

## Purpose and boundaries

Use this guide when changing scheduling configuration, availability answers or appointment creation/rescheduling/cancellation. The business behavior spans Tenant Settings, Professionals, Services/Assignments, Customers, Availability, Appointments and direct notification consumers.

This guide does not propose a Scheduling module, describe UI implementation or document notification/billing internals. Read [access control](access-control.md) for identity, membership and resource authorization, and [backend guidance](../AGENTS.md) for operations.

Documentation provides context; code and tests remain the evidence of actual behavior. Report inconsistencies, determine behavior from implementation/tests and update this guide when a task changes it. **Invariant** identifies an enforced constraint within a stated path; **Current behavior** does not imply approved permanent policy; **Uncertainty** marks intent or guarantees not established by the repository.

## Ownership and core relationships

| Concept | State owner / writer | Validation boundary today | Consumer and scope |
| --- | --- | --- | --- |
| Tenant recurring hours | Tenant Settings; onboarding also writes them | DTO/time conversion and transactional replacement; no located interval-order/overlap enforcement | Availability; tenant configuration |
| Professional recurring hours | Professionals; self/admin working-hours routes | Self resolves tenant/user professional; admin target lacks same-tenant validation; overlap validation is commented out | Availability; professional configuration |
| Timezone, buffer, booking policy | Tenant Settings; professional records also contain interval/advance values | Settings DTOs and persistence | Availability; tenant/professional configuration |
| Schedule exceptions | Tenant Settings exception service/repository | Date ordering and required intervals; supplied professional IDs lack located tenant validation | Availability; tenant-owned configuration with professional targeting |
| Exception blocks | Nested under schedule exceptions | Time conversion | Replacement local operating windows |
| Duration and service assignment | Services and professional assignment operations | Path-specific checks; Availability additionally checks active eligibility | Availability/Appointments; service configuration |
| Appointment intervals/status | Appointments | Mutation-specific availability and lifecycle checks | Availability; persisted booking state |
| Appointment blocks | Appointments, through nested mutation writes | Appointment mutation validation | Availability; appointment-owned UTC occupancy |
| Slots | No independent persisted owner | Calculated from current sources | Query output, not reservations |

Professional hours belong conceptually with Professionals; tenant hours with Tenant Settings. Consumption by Availability does not transfer ownership. Exceptions currently have tenant ownership even when targeting selected professionals. Appointment blocks belong to the booking lifecycle; they are not standalone professional time-off records.

Availability is a calculation/query domain and coordinating service. It reads state directly through Prisma-backed queries, but does not create/update the scheduling configuration. Shared scheduling utilities provide conversions; they do not own state either.

## Enforced invariants

- **Eligibility in active availability paths:** configuration loading requires tenant settings, an active/non-deleted service, and an active/non-deleted professional with an active assignment to that service in the requested tenant.
- **Scoped timeline:** Availability reads tenant/professional hours, applicable exceptions and appointments for the requested tenant/professional. Cancelled appointments are excluded.
- **Full closure:** an applicable closed exception rejects availability through the active calculation/validation paths.
- **Rescheduling exclusion:** authenticated rescheduling excludes the current appointment and its nested blocks from the scoped busy timeline, retaining other conflicts.
- **Appointment/block relationship:** creation writes a full-duration block; rescheduling replaces nested blocks along with appointment times.

These are path-specific constraints. They do not establish uniform listing/validation policy, correct isolation of every configuration write, or race-safe overlap prevention.

## Main flows and current behavior

### Configuration to derived availability

1. Load eligibility, service duration and scheduling settings.
2. Resolve professional interval/advance values over tenant settings. Professional fields currently have non-null defaults, so do not assume tenant settings govern every professional.
3. Read recurring hours, applicable exceptions and non-cancelled appointment intervals/blocks for the requested range.
4. Interpret dates in tenant timezone and select day-specific configuration.
5. Derive query output or validate a proposed mutation using the path's rules below.

**Current behavior:** any custom professional hours replace the entire tenant schedule. A missing day in a nonempty custom schedule means professional off; it does not fall back for that day. Without any custom hours, tenant hours apply. The active service does not intersect professional and tenant schedules despite generator comments suggesting intersection.

Applicable exceptions are tenant-wide when they have no professional links, or apply to linked professionals. Any full closure wins. For slot generation, non-closed exception blocks replace normal operating windows and multiple blocks are combined. The service first rejects days without base working hours, so exception intervals do not currently open an otherwise unscheduled day.

Hours/exception blocks are local minute ranges; appointments/appointment blocks are absolute instants. Availability uses the tenant timezone to combine them. Do not substitute server/browser timezone for tenant date semantics.

### Different availability answers

| Path | Hours/exceptions | Busy time and buffers | Booking limits / result |
| --- | --- | --- | --- |
| Day slots / overview | Base schedule, closures, replacement exception intervals | Appointment intervals plus blocks; extends existing busy ends by buffer | Minimum/maximum advance applied; free slots only |
| Dashboard appointment availability | Same base/closure/replacement calculation | Same busy inputs; supports excluding a scoped appointment | No advance-limit filter; busy/past/available statuses |
| Mutation `isSlotAvailable` | Base hours and closures; does not apply replacement exception intervals | Raw busy intervals; candidate end includes service duration plus buffer | Minimum notice/past checks depend on caller; no maximum-advance or slot-grid check |

Listing is an offer, not a reservation or proof the mutation validator will accept the slot. The separate generator `validateSlot` method is not called by the active mutation path; its rules must not be used to describe booking enforcement.

**Current behavior:** dashboard `hasAvailability` counts any non-busy slot, including past slots. `FULLY_BOOKED` in other results can reflect filtering by advance limits rather than actual occupancy alone.

### Appointment mutations

| Operation | Authenticated | Public/token-based |
| --- | --- | --- |
| Create | Optional customer; CONFIRMED; ignores minimum notice and allows past booking | Validates slot before transactional customer write; CONFIRMED; normal minimum notice |
| Reschedule | Tenant-scoped lookup; PENDING/CONFIRMED only; changed start, including past times; own/others authorization; excludes original appointment | Token lookup; CONFIRMED only; at most one reschedule; normal minimum notice; excludes original appointment |
| Cancel | Rejects COMPLETED; already-cancelled returns existing response; removes blocks | CONFIRMED only; repeated cancellation returns existing record; removes blocks |
| Events | Create/reschedule/cancel emitted only when a customer is present | Create/reschedule/cancel emitted after commit |

Creation resolves the tenant professional/service relationship, validates eligibility/availability and writes appointment snapshots plus one full-duration block. Staff can create customerless appointments; these paths do not emit the notification events described below.

Rescheduling uses the service's current duration to calculate the new end, replaces blocks and increments the count. Both reschedule paths update stored durationMinutes and exclude their original occupancy during validation.

Both cancellation paths remove blocks and retain the cancelled appointment for history.

### Transactions and overlap limits

All active appointment mutations use a tenant-row lock and shared transaction for appointment/customer writes and statistics. Availability reads retain their existing client. Events are emitted after commit. See [appointment lifecycle and stats](appointment-lifecycle-and-stats.md) for metric definitions and limitations.

**Current limit:** appointment writers share a tenant-row lock; no database exclusion constraint was added. A transaction wrapper or repository comment about atomic verification does not establish race-safe collision prevention. Actual deployed database constraints were not inspected. Slots can change between query, validation and persistence.

## Authorization and tenant isolation

Authenticated appointment mutations use guard-derived tenant context and tenant-scoped target lookups. Rescheduling additionally checks the professional/user relationship unless the caller has reschedule-others permission. Read/create and status updates also enforce own/others appointment authority; see [access control](access-control.md).

Public booking accepts a tenant/resource combination and relies on service/Availability eligibility checks. Management operations derive tenant/professional/service from the token-resolved appointment. Management tokens are capabilities; do not treat them as harmless confirmation labels.

Availability's authenticated appointment-query route uses guard tenant context, while slots/overview/validate accept query tenant IDs separately. Configuration ownership and foreign keys do not themselves prove every write's related records belong to the same tenant.

## Dependencies and events / side effects

```mermaid
flowchart TD
  TS["Tenant Settings: hours, exceptions, policy, timezone"] --> V[Availability reads and calculation]
  P["Professionals: hours, scheduling values, eligibility"] --> V
  S["Services / Assignments: duration and eligibility"] --> V
  A["Appointments: status, intervals, nested blocks"] --> V
  V --> Q[Derived slot lists / dashboard statuses]
  V --> CHECK[Mutation slot validation]
  CHECK --> M[Authenticated / public appointment services]
  C[Customers] --> M
  P --> M
  S --> M
  M --> A
  M --> E[Conditional appointment events]
  E --> N[Notification listeners and reminder maintenance]
  N --> D[Delivery processing / scheduler / gateways]
```

This is a conceptual feedback loop through persisted appointment state, not a Nest import cycle: Availability does not import AppointmentsModule. Its direct reads couple calculation to other owners' persistence shape.

| Event consumer | Direct consequence |
| --- | --- |
| Created listener | Public-created appointment can notify the linked professional user; staff-created appointment can notify the customer. Schedules customer reminders 24h/2h before the appointment when those times remain future |
| Rescheduled listener | Cancels pending reminder deliveries, creates customer reschedule notification and schedules replacement reminders |
| Cancelled listener | Cancels pending reminders and notifies the opposite recipient according to who cancelled |

Listeners are asynchronous and persistence uses `emit`, not an awaited atomic notification transaction. Notifications create persisted deliveries; immediate processing events and the scheduler continue into configured gateways. Event emission is not proof of successful delivery or exactly-once behavior. Public reschedule/cancel now emit the matching events after commit; completion/no-show also cancels pending reminders.

## Edge cases, inconsistencies and uncertainties

| Finding | Current behavior / uncertainty |
| --- | --- |
| Exception listing versus validation | Generation replaces operating windows; mutation checks base hours. A displayed slot can be rejected, or an unlisted base-hours time accepted |
| Buffer placement differs | Generation extends existing busy ends; mutation extends candidate end, including its closing-hours check |
| Maximum advance / slot grid | Generated free slots apply advance limits and an interval grid; mutation validation does not enforce maximum advance or grid alignment |
| Tenant defaults versus professional values | Non-null professional defaults override tenant policy values; intended inheritance is unclear |
| Configuration validation | Interval ordering/overlap enforcement is absent in inspected hours paths; administrative professional replacement does not start its own transaction; same-tenant related-ID checks are incomplete |
| Global exception representation | Query supports exceptions with no professional links, but create/update DTOs require a nonempty list |
| Persisted settings versus booking enforcement | Cancellation window, pending-booking cap, confirmation requirement, holiday auto-apply and passive-time setting are not enforced by the inspected appointment mutations |
| Customer eligibility | Booking paths do not check customer blocking; public lookup by phone can update existing customer data after slot validation, within the booking transaction |
| Occupancy meaning | All non-cancelled appointment statuses contribute busy time. Full appointment intervals plus full-duration blocks are redundant today; passive-time intent is unestablished |
| Snapshot duration | Rescheduling uses current service duration and updates stored appointment duration |
| Time boundaries | Overnight intervals, DST transitions and exception date-boundary intent are not covered by located tests; mutation's local-minute containment must not be presented as proven cross-midnight correctness |
| Legacy availability path | Shared `AvailabilityQuery` is registered/exported but no consumer was located; it differs from active repository/service behavior |
| Incomplete integration | Public-web booking mutations remain placeholders; emitted management URLs have no established matching web pages in the earlier cross-app investigation |

Do not resolve these discrepancies in prose or make a new business-policy decision. Recheck relevant paths when changing behavior and report which inconsistency remains.

There is an implicit scheduling vocabulary and policy, but current evidence does not require a new state-owning Scheduling module. Extracting shared policy might eventually reduce duplicated calculations; moving configuration/blocks would also add dependencies for professional identity, onboarding and appointment transactions. Document ownership before considering structural work.

## Implementation entry points and test coverage

| Question | Verify |
| --- | --- |
| Authored ownership and relationships | [Schema](../prisma/schema.prisma), [migrations](../prisma/migrations) |
| Tenant configuration and exceptions | [Tenant Settings](../src/modules/tenants/features/settings), [onboarding schedule writes](../src/modules/tenants/features/onboarding/onboarding.service.ts) |
| Professional configuration | [Working hours](../src/modules/professionals/features/working-hours), [professional repository](../src/modules/professionals/professionals.repository.ts) |
| Service/customer relationships | [Services](../src/modules/services), [Customers](../src/modules/customers) |
| Active calculation and routes | [Availability service](../src/modules/availability/availability.service.ts), [repository](../src/modules/availability/availability.repository.ts), [generator](../src/modules/availability/slots-generator.ts), [controller](../src/modules/availability/availability.controller.ts) |
| Mutation and token flows | [Authenticated service](../src/modules/appointments/appointments.service.ts), [public service](../src/modules/appointments/appointments-public.service.ts), [repositories/events/mapper](../src/modules/appointments), [Public facade](../src/modules/public) |
| Direct effects | [Appointment listeners](../src/modules/notifications/listeners/appointments), [notification service](../src/modules/notifications/application/services/notifications.service.ts), [delivery repository](../src/modules/notifications/infraestructure/repositories/notification-delivery.repository.ts), [scheduler](../src/modules/notifications/schedulers/notification-scheduler.service.ts) |
| Alternative/shared calculations | [Shared scheduling utilities](../src/shared/schedule), [shared availability query](../src/shared/infrastructure/queries/availability.query.ts) |

[Availability tests](../src/modules/availability/availability.service.spec.ts) cover excluding the original appointment/blocks, retaining other conflicts, unchanged creation availability and an unrelated excluded ID. [Schedule utility tests](../src/shared/schedule/schedule.utils.spec.ts) cover format conversions. They do not establish mutation concurrency, guard security, exception/buffer parity, public lifecycle/event correctness or DST handling.

Generated Prisma files with suffixes such as ` 2.ts` are not independent evidence of domain models. Use the authored schema, migration history and actual code/tests; normal application imports use unsuffixed generated paths. Cleanup/regeneration is separate work, and the duplicate files' tooling impact is not settled by this guide.

## When to update this document

Update when changing hours ownership/fallback, exception precedence/targeting, eligibility, timezone/date semantics, buffers/limits, occupancy representation, appointment statuses/snapshots, mutation authorization, transaction guarantees or event emission. Reverify query and mutation paths together, including customerless and public behavior. Keep implementation catalogs in code, operations in AGENTS.md/skills and integration coordination in the parent cross-app workflow when available.

## Dashboard cancellation

The dashboard confirms cancellation in a modal and accepts an optional reason. The reason is trimmed, saved on the appointment, and included in the customer notification; the modal makes this sharing explicit. An authenticated cancellation preserves the appointment record, sets `CANCELLED` and `cancelledAt`, and removes its blocks in the same nested update. Cancelled appointments no longer occupy availability and are excluded from the dashboard overview’s upcoming list, but remain in the appointment list. Appointment responses include the tenant settings timezone (`America/Montevideo` when settings are absent) for confirmation date/time formatting, including for staff who cannot read settings.

Completed appointments cannot be cancelled. Repeating cancellation returns the existing record without another write/event after checking permission and ownership. OWNER/ADMIN can cancel any tenant appointment; STAFF can cancel only a professional appointment linked to their user, using dedicated cancellation permissions. No restore operation is offered.

For a linked customer, the existing asynchronous listener cancels pending reminder deliveries and queues a customer cancellation notification with the optional reason. Successful cancellation does not guarantee notification delivery, retract reminders already sent, or update stored statistics. Customerless appointments emit no customer event; the modal omits the notification promise. Public token cancellation and cancellation-window rules are unchanged.

### Dashboard past-time bookings

Authenticated dashboard creation and rescheduling allow past start times via the existing availability validator’s `allowPast` option. The dashboard shows all generated operating-hour slots, including past and busy slots. Only busy slots are disabled; the rescheduling availability query excludes the original appointment and its blocks while retaining other conflicts. A shared warning Callout appears only after selecting a past time; it does not block submission. Rescheduling to the appointment’s unchanged start time remains rejected. Public customer creation/rescheduling does not enable `allowPast`, so its advance-time restrictions remain in place. Working-hours, service/professional eligibility, conflicts and buffers continue to be validated.

### Dashboard calendar filters

Authenticated `GET /api/appointments` accepts `date`, `state` (an AppointmentStatus), and `professionalId`. Omit `state` or `professionalId` to include all values; the string `all` is not an API value. Both results and the total count use these tenant-scoped filters. `orderBy` accepts `startsAt` (appointment hour) or `createdAt` (newest creation), with `order=asc|desc`; omitted sorting remains `startsAt asc`. An ID tie-breaker stabilizes pagination through `skip` and `take` (default 10). The dashboard uses `createdAt desc` for “Más recientes”. Public booking and management endpoints are separate and unchanged.

Dashboard appointment responses include `formattedStartsAt: { date, time }`, formatted in Spanish with date-fns/date-fns-tz using `tenant.settings.timeZone`. Original `startsAt`/`endsAt` instants remain available for scheduling. When tenant settings are missing, `timeZone` and `formattedStartsAt` are null; the mapper does not substitute a timezone. The cancellation modal displays these server-formatted labels.

## Agenda day filtering

The authenticated appointment list accepts `date` as a validated `YYYY-MM-DD` business date. The repository uses the tenant settings timezone (default `America/Montevideo`) to select appointments from inclusive local midnight to exclusive next-day midnight. This handles daylight-saving days without assuming 24 hours. Legacy timestamp values for `date` remains compatible with its existing server-local filtering behavior. Public booking and availability endpoints are unchanged.

Agenda uses the business timezone for today and displayed appointment times, with stable calendar dates in query keys. Changing date or filters resets pagination; pagination alone may retain previous results during loading. Placeholder results cannot carry across tenants or different filter criteria.

## Appointment outcomes and projections

New bookings are automatically CONFIRMED; existing PENDING bookings have a Confirm action. `PATCH /appointments/:id/status` supports confirmation, completion and no-show with own/others permissions, start-time checks and repeat-safe requests. Stats write ownership is `appointments/stats`, not `common/stats`; tenant/professional/customer appointment summaries are replaced atomically from source records. See [appointment lifecycle and stats](appointment-lifecycle-and-stats.md) for correction rules, scheduled-day timezone grouping, first completed visits, revenue and performance limits.
