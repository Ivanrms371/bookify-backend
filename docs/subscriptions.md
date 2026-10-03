# Subscriptions module

The product rules and implementation history live in the [billing plan](../../docs/billing-subscription-plan.md), especially Task 12. Earlier planning notes about unconfigured caps and pending plan changes predate that implementation. Current catalog caps are Free 1 professional/10 services, Pro 3/30, and Pro+ 8/60. Resource-creation enforcement and Free transitions remain separate tasks.

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
