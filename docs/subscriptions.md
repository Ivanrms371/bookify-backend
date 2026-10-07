# Subscriptions module

The product rules and implementation history live in the [billing plan](../../docs/billing-subscription-plan.md), especially Task 12. Earlier planning notes about unconfigured caps and pending plan changes predate that implementation. Current catalog caps are Free 1 professional/10 services, Pro 3/30, and Pro+ 8/60. Free selection and transitions now reuse the plan-change flow. Free caps are enforced for active Free and pending Free transitions; broader paid-plan operational restrictions remain separate work.

## Responsibilities

| File                                                    | Responsibility                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `subscriptions.controller.ts`                           | HTTP binding, permission metadata, webhook signature/body presence checks, and delegation         |
| `subscriptions.service.ts`                              | Trial creation, access and billing reads, initial paid checkout, and customer portal              |
| `plans.config.ts`, `plans.service.ts`                   | Catalog, trial plan, and provider variant resolution; catalog types live in `types/plan.types.ts` |
| `checkout-eligibility.ts`, `plan-change-eligibility.ts` | Pure eligibility rules, without persistence or provider calls                                     |
| `plan-change.service.ts`                                | Provider association checks, transaction-scoped reservation, change/undo/refresh workflows        |
| `plan-change.ts`                                        | Pending-change interpretation, payment confirmation, and provider/effective-plan projections      |
| `subscription-webhook.service.ts`                       | Signed webhook synchronization, provider versions, and atomic invoice/subscription coordination   |
| `subscriptions.repository.ts`                           | Tenant-scoped subscription persistence, resource usage, and due-change settlement                 |
| `plan-change.scheduler.ts`                              | Settle confirmed downgrades and cycle changes every minute                                        |
| `mappers/`                                              | Public billing/catalog DTOs and provider subscription projections                                 |

Subscriptions imports Payments, Lemon Squeezy, and Webhook modules. Payments owns invoice persistence and has no reverse dependency on Subscriptions. Notifications is registered by the application; subscriptions does not depend on its providers.

## Rules to preserve during maintenance

- Trial creation uses an empty-update upsert inside the caller's onboarding transaction. Retries never restart a trial.
- Financial reads and mutations retain owner-only controller permissions. Access reads expose member-safe state; public web does not consume the authenticated billing endpoints.
- An upgrade retains current benefits until a matching latest paid invoice confirms it. Provider PATCH success or a lifecycle event alone cannot grant the upgrade.
- A downgrade or cycle change retains the effective plan/cycle until the original paid-period end. Due settlement clears the three pending fields; it never grants an unpaid upgrade.
- Persist intent before provider mutation. Same-target retries do not send another charge; uncertain outcomes retain intent for refresh/webhooks.
- Provider HTTP calls stay outside transactions. Under the billing advisory lock, recheck the local version and, when changing plans, resource counts before reserving intent.
- Persistent provider version markers reject stale snapshots. Equal subscription versions may still confirm a later paid upgrade invoice.
- Invoice/subscription updates and provider markers commit together. Invoice tenant ownership comes from the local provider subscription mapping.
- DTO mapping omits provider IDs and serializes money/dates explicitly. Keep missing/deleted and unknown legacy-plan records readable.

## Refactor verification

The readability refactor extracts eligibility and billing DTO mapping, removes the unused start DTO and subscription creation/read methods, and removes the unrelated Notifications import. It avoids a duplicate settled subscription load, uses the persisted update result during confirmation, and skips transaction resource counts when the plan itself is unchanged. Transaction/version checks, API response shapes, provider charges, and downgrade deadlines remain unchanged.

Run the isolated billing checks from `backend/`:

```sh
pnpm test --runInBand src/modules/subscriptions src/modules/payments src/shared/integrations/lemon-squeezy src/common/webhooks
pnpm exec tsc -p tsconfig.build.json --noEmit --incremental false
```

The payment HTTP suite binds a local port with mocked services. These checks do not verify live provider flows or PostgreSQL concurrency. No database mutation or provider settings change is part of this refactor.

## Free transitions

The existing owner-only change-eligibility, plan-change, plan-change cancellation and refresh endpoints handle Free. Plan-change selections send `{ "planId": "free" }` without a cycle; paid changes still require one. Checkout retains its separate paid-plan contract. No new Free endpoints or provider variants are introduced, and public web has no consumer of these authenticated endpoints.

Free is available regardless of workspace type, with at most one non-deleted professional and ten non-deleted services. Inactive resources count. Trial/expired-trial selection activates immediately and preserves the original trial history; an active trial review warns that its remaining benefits end without granting another trial. Expired paid activation verifies that the provider has expired. Paused, past-due and suspended states require portal recovery first. Existing paid-plan changes must be resolved first.

Paid selection persists a Free intent, cancels renewal on the already linked Lemon subscription with DELETE, then schedules Free at the provider-confirmed ends_at. Already cancelled subscriptions can adopt their existing deadline. Paid features remain until that date, but Free resource caps apply as soon as the intent is reserved. The existing billing lock is shared with service/professional creation and service bulk creation so concurrent additions cannot exceed the cap. No published workspace-type mutation currently exists; onboarding edits reject completed tenants. No resources, appointments or payment history are deleted.

Scheduling is deduced from existing fields: pendingPlanId=free with a null planChangesAt awaits confirmation; a populated deadline is confirmed. The nullable planChangeUndoRequestedAt preserves an uncertain undo request. Only confirmed deadlines with no undo request settle automatically. Undo before expiry uses provider PATCH cancelled=false and clears intent only after confirmation. Explicit refresh reconciles provider state and may repeat the idempotent cancellation/resumption when a prior request timed out; frontend HTTP auth retries are disabled for these mutations. Definite provider rejection restores the previous intent. Portal resumption removes a confirmed Free schedule. Provider versions prevent stale snapshots from overriding newer states.

Active Free has ACTIVE status, zero amount, no billing cycle or expiry, and retains provider IDs for historical invoice association. Old paid lifecycle events cannot overwrite it; a newly confirmed paid checkout may attach a new provider subscription. An expired provider snapshot resolves an uncertain undo into Free. If undo remains uncertain, settlement waits for reconciliation rather than guessing.

Schema/client preparation requires the additive add_plan_change_undo_requested_at migration and regeneration before running the new code. Applying it requires the repository's explicit Prisma authorization. Mocked unit/API tests and server-rendered UI checks do not establish live provider or PostgreSQL concurrency behavior; verify cancellation, resumption and deadline settlement in provider test mode before release. Reminder/advanced-statistics enforcement and wider operational-access policies remain outside this slice.

Plan eligibility does not validate `workspaceType` or `compatibleWorkspaces` for checkout, paid plan/cycle changes or Free activation. Existing catalog compatibility metadata is informational only; resource caps, owner permissions and provider/subscription checks still apply. Dashboard and public-web consumers do not enforce workspace compatibility.
