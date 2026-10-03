# Payment history API

Implemented backend contract for billing task 9. Both routes use the normal authentication/tenant guards and BILLING_READ, currently granted only to OWNER. Tenant IDs come from the resolved tenant context, never request body/query ownership claims. Successful responses use Cache-Control: private, no-store.

## History

`GET /api/payments?page=1&pageSize=10`

Defaults are page=1 and pageSize=10; pageSize must be 1–100. Invalid, repeated, unsupported or unsafe pagination values return 400. Response:

```json
{
  "items": [{
    "id": "0199abcd-1234-7123-8123-123456789012",
    "referenceCode": "PAY-2026-0051",
    "date": "2026-10-01T10:00:00.000Z",
    "amount": "18.99",
    "currency": "EUR",
    "status": "COMPLETED",
    "invoiceAvailable": true
  }],
  "meta": {"page": 1, "pageSize": 10, "total": 1}
}
```

All non-deleted tenant payments are included, newest invoice issue date first with ID as tie-breaker. Row/count reads use one repeatable-read transaction. Empty/out-of-range pages return an empty items array and the actual total. Date means invoice issue time, not successful charge time. Amount is a decimal string; currency belongs to that payment. Current subscription plan/cycle is not a historical payment label. History makes no provider HTTP requests. Raw provider IDs/URLs and merchant net proceeds are omitted.

## Invoice

`GET /api/payments/:paymentId/invoice` returns `{"url":"https://app.lemonsqueezy.com/..."}` after checking local payment ID, tenant ownership and soft deletion. UUID v7 is accepted. Signed links are never logged or returned in the history response.

Validated stored links are returned without a provider request. For legacy null links, a read-only on-demand lookup requires a verified local Lemon Squeezy subscription/customer association, then matching provider invoice ownership, store and mode. It has a 10-second timeout. An older replaced provider subscription without a cached URL cannot be recovered through the current mapping. No automatic backfill occurs.

| Status | Code / behavior |
| --- | --- |
| 400 | Invalid pagination or payment UUID |
| 403 | Missing BILLING_READ permission |
| 404 | PAYMENT_NOT_FOUND for missing/deleted/foreign-tenant payment |
| 404 | INVOICE_UNAVAILABLE for pending/missing invoice or unverifiable association |
| 502 | INVOICE_PROVIDER_INVALID for invalid provider response |
| 503 | INVOICE_PROVIDER_UNAVAILABLE for temporary provider failure; retry |

Invoice availability in history means a validated stored link exists, not that a legacy fallback is guaranteed. The frontend should show unavailable for false. Only HTTPS URLs on app.lemonsqueezy.com without embedded credentials or alternate ports are accepted.

## Persistence and verification

Migration 20261003124555_add_payment_invoice_url_and_history_index adds nullable payments.invoice_url and the tenant/issuedAt/id index. Invoice webhooks update the URL within the existing subscription/payment/version transaction; omission preserves it, explicit null clears it. Existing rows retain null until future applicable synchronization. No public payment write endpoint exists.

All 254 backend tests across 27 suites and the backend non-emitting type check passed after this implementation. Isolated HTTP checks mock repositories/providers and auth/tenant context while using the real permission guard. Live provider and database concurrency checks remain release work. Dashboard sample-history replacement is task 10; public web has no payment-history consumer.
