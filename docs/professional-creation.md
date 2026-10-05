# Professional creation, editing and invitations

The dashboard’s “Nuevo Profesional” modal creates professionals through authenticated `POST /api/team/professionals`. The route requires `TEAM_INVITE`, available to OWNER and ADMIN; STAFF cannot create through this flow. The selected tenant comes from the existing membership-checked tenant context.

## Request and response

The dashboard sends only `name`, `email`, `phoneCountryCode`, `phoneNumber`, optional `serviceIds`, `avatarUrl`, `avatarPublicId`, `colorTheme` and `giveAccess`. Name, email and phone are required even when access is disabled. Name is trimmed, email is trimmed/lowercased, country code loses a leading `+`, and phone loses spaces, parentheses and hyphens. Country codes contain 1–4 digits without a leading zero; phone numbers contain 4–15 digits. The dashboard defaults country code to `598` and `giveAccess` to `false`.

A supplied compatibility `role` is accepted only as STAFF, regardless of `giveAccess`; there is no role selector in the creation UI. Biography and specialty remain rejected by the global whitelist; professional photo and calendar color are supported. The existing professional record response is preserved.

`serviceIds` may be omitted or empty. Duplicate, malformed, inactive, deleted, nonexistent and other-tenant services return HTTP 400 with a `fields.serviceIds` error. Services must belong to the selected tenant. Contact validation returns the existing HTTP 400 field-error envelope. Existing member-email and outstanding-invitation conflicts retain HTTP 409.

## Persistence and notification

Professional creation, assignments and the optional invitation share a single Prisma transaction. Assignment replacement awaits deletion before insertion. A conflict or any transaction failure rolls back all creation writes and publishes no creation event.

Without access, this flow creates no user, membership or invitation. With access, it creates a pending STAFF invitation linked to the professional, with a seven-day expiry; the professional remains unlinked (`userId` is null) until acceptance. An existing user who is not a tenant member can receive an invitation without being linked immediately. New professionals retain the model’s active default and inherit business hours through the existing availability fallback; no schema or migration changes are needed.

For this creation flow, `invitation.created` is published after commit. Its recipient identifier is explicitly the invitation ID; queued invitation email delivery uses the server-generated `payload.email`, without requiring an existing user. Development continues to deliver to `RESEND_SANDBOX`. The existing notification processor retains three delivery retries. Post-commit notification-registration/delivery failures do not roll back professional creation or turn its response into a creation error. Registration failure is logged; this is not a transactional outbox or a guarantee of eventual mail delivery.

The dashboard reports “Profesional creado” or “Profesional creado e invitación registrada.” These messages do not claim email delivery. Automatic creation mutation and HTTP authentication retries are disabled for this request. The HTTP client verifies the originating tenant again before dispatch. Inputs and dismissal are blocked during submission; field/general errors preserve values. Service options load all active services in pages of 24 and offer loading, retry and empty states; creation without assignments remains possible if loading fails.

Professional lists, calendar options, details and service-professional assignments use tenant-scoped query keys. Successful creation invalidates the originating tenant’s professional, assignment and billing caches. Tenant/path changes dismiss the creation form, and paginated selectors reject results after a tenant change. The public web uses separate public professional endpoints and does not consume this creation contract.

## Shared editor and partial updates

Create and edit use the same modal and contact/service/access form. Editing first loads tenant-scoped details; loading and retry states never mount an empty editable form. The loaded details are retained as an immutable form snapshot, including access state. Contact fields in listing/details always come from the professional record. Linked account email is separate access metadata; changing the business email does not modify or relink the account.

`PUT /api/team/professionals/:id` requires `TEAM_UPDATE` and an active OWNER/ADMIN membership checked again inside the transaction. It accepts optional normalized `name`, `email`, `phoneNumber`, `phoneCountryCode`, `serviceIds`, `giveAccess` and `accessStatus`. Omitted fields remain unchanged. The shared DTO field validators reject null contact values and out-of-scope fields, including role changes. The response remains `{ success: true }`.

Access intent must include the loaded `accessStatus` (`NONE`, `PENDING`, `EXPIRED`, `ACTIVE`, `DISABLED`). A mismatch returns HTTP 409 and rolls back all writes. Changing a pending invitation's recipient also requires this snapshot, even when `giveAccess` is omitted. Detail metadata includes `accountEmail`, `role`, `invitationEmail`, `expiresAt`, and `canChange`; it never includes invitation tokens.

| Current status | Enabled | Disabled |
| --- | --- | --- |
| NONE | Create a pending STAFF invitation | Keep access absent |
| PENDING | Keep invitation; replace it if business email changed | Revoke invitation |
| EXPIRED | Create a fresh STAFF invitation | Keep access absent |
| ACTIVE | Keep membership and role | Deactivate tenant membership |
| DISABLED | Reactivate linked membership with existing role | Keep membership disabled |

Removing access retains `userId`, bookable professional status, appointments and assignments. Restoration uses the linked account, regardless of its email. OWNER access is protected; only OWNER may change ADMIN access; OWNER/ADMIN may change STAFF access. Nobody may revoke their own access. Protected professionals' contact/services remain editable. The editor has no role selector or resend button.

Pending recipient replacement revokes the old invitation and creates a fresh token for the new email. Name/phone saves do not resend. Invitation conflicts roll back profile, service and access writes. Publication occurs after commit, with existing sandbox routing and delivery retries. Outcome messages describe registration, cancellation, deactivation or restoration and do not claim email delivery.

Active services load in batches of 24. Existing inactive services/assignments are explicit and may be retained or removed. Changed assignments reject duplicates, missing/deleted services, cross-tenant IDs and newly added inactive services. Existing assignment activity flags are retained. Unchanged assignment lists are omitted by the editor; ordinary contact/access saves never silently replace assignments. The lower-level professional update endpoint no longer manages account links or access.

Both create/edit disable mutation and authentication retries, protect keyboard/double submissions, retain values on errors, validate originating tenant before dispatch and dismiss on tenant/path changes. Success refreshes tenant-scoped professional lists/details, calendar choices, service assignments and billing usage.

## Invitation journey

New mail links use `/auth/invitations?token=…`; legacy `/auth/signup?token=…` redirects there. The invitation screen is outside auth/onboarding/tenant route guards. `GET /api/invitations/validate/:token` is public and token-scoped; it returns recipient/business/professional context plus VALID, EXPIRED, REVOKED or ACCEPTED state, without exposing the stored token. Wrong-account feedback compares the active account with the recipient.

Logged-out recipients can sign in, register or use Google. Matching logged-in recipients explicitly submit authenticated `POST /api/invitations/accept/:token`, decorated `SkipTenant` so authentication works before membership exists. Acceptance returns `{ success: true, tenantId, tenantSlug }`; the client refreshes `/auth/me` with that tenant ID before navigation. `/auth/me` now passes the selected tenant ID to the context mapper.

Invitation signup sends the token, consumes it in the account transaction, establishes session cookies and selects the invited tenant. Ordinary signup still requires email verification. Password login authenticates independently of invitations. The frontend preserves the invitation token in its return URL and verification resend requests; acceptance validates it separately. An initial verification email triggered by ordinary login does not include invitation context. Signup handles the `requiresEmailVerification` response instead of always navigating to verification.

Consumption re-reads and conditionally updates the invitation inside the transaction. Recipient email must match the stored account; conflicting memberships (including inactive ones), a linked target professional, or a user already linked to another professional are rejected. Membership, consumption and professional linking commit atomically. Repeat acceptance succeeds only while the matching membership and accepted professional linkage remain valid; an accepted token cannot restore removed access.

Access writes/acceptance use shared PostgreSQL row-lock order: tenant, professional when present, user, invitation. The tenant row also serializes recipient conflicts. User locking coordinates the global unique professional link across tenants. Account/signup/Google writes propagate the transaction client; account conflicts and linking failures roll back consumption. Generic invitation cancellation, role changes and legacy resend also serialize with acceptance. These transactions may contend within a tenant; no database migration is required.

Google initiation fetches the existing `{ url }` JSON before navigation. Invitation/device context is signed with the existing access-token secret under the distinct `bookify:google-oauth-context` audience in a ten-minute HttpOnly cookie (Secure in production, SameSite=Lax, scoped to `/api/auth/google`). OAuth state is a random nonce, verified against the cookie; the callback clears context and ignores unsigned invitation/device overrides. Verified Google email must match before account creation/linking. Invitations consume in the account transaction and session cookies are set only after success. Failures return to the invitation screen; normal Google follows ordinary tenant/onboarding navigation.

## Verification and remaining limitations

Creation regressions, update normalization/omission, all ten access-control combinations, role/self restrictions, inactive assignment retention/removal, replacement/rollback, stale-state rejection, token states, duplicate consumption, recipient/membership/link conflicts, concurrent winner orderings and tenant denial after deactivation have unit coverage. Auth tests mock provider/mail calls and cover invited/ordinary signup/login/Google, verification-token propagation, OAuth tampering/expiry/purpose/nonce, cookie clearing and target navigation.

Persistence/race tests use transaction-client mocks with serialized in-memory transactions and rollback snapshots. They assert SQL lock order but do not prove behavior against a running PostgreSQL server. No database mutation or real email/Google call was performed. Browser inventory was empty, so desktop/mobile layout, focus, keyboard, live tenant switching and real recipient journeys remain unverified at runtime. Verification: `pnpm test --runInBand` passed 35 suites / 458 tests (91 new tests across update, details, acceptance and auth suites); the full suite required approval for mocked HTTP listeners outside the sandbox. `pnpm exec tsc -p tsconfig.build.json --noEmit --incremental false` passed. The test-inclusive backend check retains only two existing subscription-test diagnostics. The frontend non-emitting check adds no application diagnostics; excluding legacy copied generated route types removes an existing generated conflict while preserving the copies. Existing unrelated frontend diagnostics remain.

Specialty, advanced settings, subscription caps and the wider Team page remain outside this task. Professional photos and calendar color are now supported by the shared modal. Wider Team member role/deletion protections and direct service-assignment endpoints are not expanded here. No account deletion or global session revocation is performed: removed membership denies the selected tenant's HTTP requests, while other tenant memberships remain usable. Notification WebSocket authorization remains a separate existing limitation. Notification registration is post-commit without a transactional outbox; eventual email delivery is not guaranteed. Public-web endpoints and consumers are unchanged.

## Readability and transaction boundaries

Professional updates choose a named access action before applying it: keep, invite, cancel invitation, disable membership or restore membership. Contact normalization trims business fields and lowercases business email; it never changes the linked account. Invitation creation inside a caller-owned transaction uses `createPendingInvitation`; `queueInvitationNotification` runs after commit. Ordinary Team invitations use `create`, which owns both steps. Invitation-specific email routing belongs to the notification dispatcher; the email gateway only resolves ordinary recipients or delivers directly to an email address with the existing sandbox routing.

Acceptance separates locking, recipient validation, conflict checks, conditional token consumption and membership/link writes. PostgreSQL row locks remain in the shared database helper because Prisma does not expose `FOR UPDATE`. Locking a tenant row serializes access mutations in that tenant until commit, preventing acceptance and cancellation from acting on the same stale state; it does not revoke sessions or affect other tenants. The existing Team invitation role-edit endpoint still uses `updateRole`; professional editing does not expose role changes.

## Professional photo and calendar color

The shared creation/editing modal supports a professional-owned photo and calendar color beside the contact fields. `avatarUrl`, `avatarPublicId`, and `colorTheme` are optional fields on Team create/update requests and are returned by professional details. Omitted fields are retained; sending null for both avatar fields removes the photo without changing the linked user's account.

The dashboard previews a local file and uploads it through `useMediaUpload` with type `avatar` only on Save (supported images up to 2 MB). Save remains disabled throughout upload and persistence. Failed saves retain the form and attempt cleanup of the newly uploaded media; successful replacement/removal attempts cleanup of the previous media after persistence. Cleanup failures do not reverse the saved professional. Cancelling before Save performs no upload. No database migration is required. Public booking consumers already read `avatarUrl`; their contract and endpoints are unchanged.

## Professional deletion

The dashboard confirmation now calls `DELETE /api/team/professionals/:id`. The existing `DELETE /api/professionals/:id` route delegates to the same Team transaction through a compatibility controller; the routes retain their respective TEAM_DELETE and PROFESSIONAL_DELETE permissions. Both require an active OWNER/ADMIN actor and recheck tenant-scoped access protections. Nobody may delete their own linked professional or an OWNER-linked professional; only OWNER may delete an ADMIN-linked professional. Pending invitation roles have the same protections.

Deletion sets `Professional.deletedAt`, revokes outstanding invitations, and deletes the linked user's membership row for the selected tenant if one exists. It retains the professional record, user link, photo, service assignments, working hours, and all existing appointments, including upcoming appointments. The user account and other tenant memberships remain intact. No media deletion or appointment cancellation occurs. Membership removal and soft deletion roll back together on failure and use the same row-lock ordering as invitation acceptance. Old accepted invitation tokens cannot restore the removed access.

Existing professional listings, booking selectors, and new appointment lookups already exclude deleted professionals. The public web needs no contract change. The dashboard refreshes professional/calendar choices, service assignments, invitations, and billing usage after success. It blocks duplicate submissions, prevents closing while pending, displays errors for retry, and dismisses the dialog when tenant or route changes.
