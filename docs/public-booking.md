# Public booking identity and verification

Customer identity is created or reused before verification. Normalized phone digits identify a customer within a business. Existing names, notes and contacts remain unchanged by public requests. A different proposed email returns 409 without disclosing the stored email. For an existing customer without email, the proposed address is bound to the OTP and saved only on successful confirmation, provided the email is still absent. Blocked/deleted customers cannot request, confirm or book.

## Public API

Routes below are under `/api/public`.

- `POST /customer-verification`: accepts `tenantId`, `name`, `phoneCountryCode`, `phoneNumber`, `email`, optional `notes`. Returns `customerId`, `verificationRequired`, and `verificationId` if required. The backend selects `CUSTOMER_VERIFICATION_EMAIL`, sent exclusively by email. Free/trial or an already verified email skip OTP. Resends create independent challenges.
- `POST /customer-verification/verify`: accepts `verificationId`, six-digit `code`; resolves purpose from persistence and returns `{ success: true }`. Both purposes expire in ten minutes and lock after three wrong attempts. Completion is single use.
- `POST /appointment`: accepts `customerId`, `tenantId`, `serviceId`, `professionalId`, `startsAt`, optional appointment `notes`. Requires a verified stored email only with current effective paid Pro/Pro+ access. Free/trial skip verification. Phone verification alone never permits paid booking. Rechecks plan, customer/contact and availability; an occupied slot does not consume verified contact state. Returns `id`, `status`, `startsAt`, `endsAt`, `durationMinutes`, `price`, `manageToken`, and `whatsapp: { activated, available }`.
- `POST /appointment/:token/whatsapp-verification`: uses the existing appointment management token to resolve its tenant, customer and exact current phone. The backend selects `CUSTOMER_VERIFICATION_PHONE`, exclusively WhatsApp. Existing verified phone plus opt-in skips OTP. Unavailable gateway rejects activation; no appointment state changes occur.
- `GET /appointment/:token`: includes `whatsapp: { activated, available }` alongside existing public appointment data. PUT/DELETE management contracts remain unchanged.

Effective paid access includes cancelled plans until their paid period ends. Customer/verification IDs do not grant appointment-token access. Customer notes are not copied into appointment notes. User account verification/password reset remain separate.

## Persistence and notifications

Verification binds tenant, customer, purpose, channel and exact destination. `contactWasMissing` records email-absence at request time to prevent a concurrent email write from satisfying an older challenge. Email OTP completion updates email verification only; phone completion updates `phoneVerifiedAt` and nullable `whatsappOptInAt`. Customer then verification row locks serialize completion, wrong attempts, dispatch and administrative edits. Contact edits expire pending challenges; phone changes also clear WhatsApp consent. Historical phone verification never implies consent.

Awaited verification events persist notification occurrences and initial deliveries inside the verification transaction. The existing worker dispatches after commit. OTP deliveries remain non-billable and never switch channels or fall back from phone to email.

Customer appointment notices prefer WhatsApp only with a verified phone and explicit consent. Without consent, usable gateway or quota, the worker falls back to stored email using existing billable quotas. Email reminders may use an unverified stored email, including Free/trial customers. Consent is retained after quota failures; subsequent occurrences try WhatsApp again. Ambiguous provider acceptance retains the claim/reservation for existing reconciliation and never triggers a duplicate fallback.

The current WhatsApp gateway is simulated and non-operational: real activation is unavailable and appointment notices use email. No provider connection is added.

## Rollout and validation

`20261012120000_split_customer_verification_purposes` follows the existing prerequisite migrations, including `20261011120000_customer_verification`. It splits legacy `CUSTOMER_VERIFICATION` by saved channel, expires unknown/missing destinations, adds email-absence binding and nullable consent, and preserves existing verified contact timestamps without backfilling consent. Migration execution and Prisma client generation require explicit authorization; authored SQL alone does not deploy these changes.

Prisma client generation was explicitly authorized and completed; the migration was not executed. Non-emitting build TypeScript passes. The focused verification/public/customer/appointment/notification run passes 29 suites and 327 tests. Unit tests use mocked persistence and authored enum fixtures. They do not establish PostgreSQL concurrency or real provider delivery. No new public rate limiter is introduced; user resend limits remain unchanged.

The dashboard uses authenticated appointment routes and is unaffected. Public web's `createBooking` remains a placeholder; integrating this API and optional activation UI is separate work. No frontend/web changes are included.

Verification persistence now lives directly in `VerificationsService`; the separate `VerificationsRepository` was removed. Customer-before-verification lock order, attempt commits and transactional notification events remain unchanged.

Public `verifyCustomerCode` delegates to `verifyCode`. User and customer OTPs share validation, attempt accounting and consumption; recipient completion runs in the same transaction. Customer tenant/contact checks run before consuming the challenge. The public confirmation response remains `{ success: true }`.

The verification listener intentionally does not set EventEmitter2 `async: true`: Nest wraps the handler in a normal function, so deferred scheduling can detach its promise from `emitAsync` and commit before outbox writes. A test registers the real Nest event listener and holds notification persistence pending to verify that emission waits.
