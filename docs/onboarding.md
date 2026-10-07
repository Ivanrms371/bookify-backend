# Business-first onboarding

Every owner follows the same seven steps: business, address, services, business hours, owner professional profile, optional customization, and confirmation. Workspace type no longer selects the onboarding flow. New tenants retain INDIVIDUAL internally for billing compatibility; existing workspace values and plan eligibility rules are unchanged. The existing subscription service determines the Pro+ trial and duration shown on confirmation.

## Studio location and contact

The dashboard collects location in a dedicated Dirección step between business and services. It shares `LocationFields` with General Settings and uses the same heading, spacing and navigation as the other onboarding screens, with fields directly on the page and no surrounding card. Dropdowns reuse the shared Radix UI selector with React Hook Form controllers. País occupies one full row, department/province and city share the next row, both address lines share a row, and optional studio phone is last, spanning two columns of a three-column row with the final column empty. On small mobile screens, fields stack at full width. Currency and timezone are derived automatically; the backend selects regional timezones where available, otherwise the country default. Chile defaults to Santiago, including Valparaíso; Aysén/Magallanes use their regional UTC-3 mapping. General Settings displays the backend values as read-only fields.

`PATCH /api/onboarding/business` saves only name/type and advances to `LOCATION`. `PATCH /api/onboarding/location` saves owner-scoped location and preferences atomically and advances `LOCATION` to `SERVICES`; revisiting a completed earlier step preserves later progress. Services cannot be saved before completing Dirección. Confirmation also requires a supported country and a complete valid address.

`GET /api/locations/options` supplies the shared authenticated catalog without requiring tenant membership. The compatible onboarding options endpoint returns the same data. Supported countries are **Uruguay, Argentina, Peru, Chile and Paraguay only**. Each has department/province/region selectors; city and street are entered manually without Google verification or geocoding. See [location catalog](../src/shared/location/README.md) for provenance and selection rules.

| Field | Validation / persistence |
| --- | --- |
| `country` | Required catalog country code, normalized to uppercase; saved in `Tenant.country`. |
| `province` | Required region, maximum 100 characters. Values are validated and canonicalized against the selected country’s catalog. |
| `city` | Required trimmed city/locality, maximum 100 characters. |
| `addressLine1` | Required trimmed main address, maximum 200 characters. |
| `addressLine2` | Optional trimmed complement, maximum 200 characters. |
| `phoneNumber` | Optional studio phone, separate from the professional phone; 7–15 digits, with a leading plus, spaces, parentheses or hyphens allowed; maximum 30 characters. |
| `currency` | Compatibility input only; ignored. The backend always derives the country currency. |
| `timeZone` | Compatibility input only; ignored. The backend derives the region timezone or country default. |

Country changes clear dependent region/city selections and preview the backend catalog’s currency/timezone in the UI. Region changes clear city and derive a timezone where curated data is available. Optional contact/address fields can be cleared with null or an empty string; omission preserves values. Unknown fields are rejected.

Location writes persist existing Tenant fields and upsert `TenantSettings.currency` and `TenantSettings.timeZone` in the same transaction, protected by the onboarding tenant lock. Confirmation writes the latest country/region-derived preferences, preserving other booking settings. Legacy missing-country drafts use Uruguay defaults. Location responses include address/contact fields plus currency/timezone in `savedData` and are scoped to the selected owned tenant. Completed onboarding cannot be edited through these endpoints.

General Settings uses the same catalog; currency/timezone are derived on the backend and read-only in the dashboard. Legacy client inputs for these fields are accepted but ignored. The backend validates and canonicalizes country/region selections and stores preferences in TenantSettings. A country change derives new defaults and clears omitted region/city values; partial updates derive from the saved country/region. The save response includes the resulting currency/timezone for the dashboard cache and session. Public web already consumes address and settings through the existing public tenant contract, so no public API consumer changes are needed. The new LOCATION status requires the migration described below and Prisma client generation before running the updated flow.

## Existing flow behavior

The services step accepts any positive whole-minute duration and optional images. The dashboard uploads selected files through the existing service media upload flow before saving image URLs and public IDs through the onboarding endpoint. Saved images are returned in onboarding status for revisiting the step; omitting image fields preserves existing images.

`PATCH /onboarding/professional` stores an explicit `attendsClients` choice. If true, it also stores display name, email, country code, phone number, optional profession and selected service IDs. The same step creates or updates the linked professional and its service assignments in the save transaction. It remains inactive until confirmation; the JSON field retains the attendance choice and saved summary for reloads. Choosing manager-only keeps the owner profile inactive without deleting it or changing membership. The status response includes `tenantId`, trial details and saved professional/branding data. All selected services must be active, non-deleted and belong to the owned tenant. Editing saved services retains their IDs; removing a selected service requires profile review before confirmation.

Confirmation serializes with onboarding edits using the tenant row lock. It atomically claims completion, activates the already-saved owner professional when requested, activates the tenant, ensures settings, creates statistics and starts the trial. Owner membership remains unchanged. A user already linked to another tenant's professional or a deleted professional cannot be automatically linked. The owner row lock serializes concurrent profile linking. No custom professional hours are created: the existing availability fallback uses business hours.

Customization uploads use the existing tenant-scoped media endpoint. URLs and public IDs are saved together. Omitting a field preserves its saved value; null removes the saved reference. Skipping sends an empty payload. Previous media assets are not deleted during onboarding replacement; asset cleanup is a separate lifecycle concern. Upload failure prevents advancement and retained successful upload results are reused during retries on that screen.

After initialization the dashboard refreshes the session before tenant-scoped writes. Completion always refreshes the session and checks completed status and slug before redirecting to the tenant dashboard; refresh failures have a retry action. Owners without an active professional in the business see a link to add one. The public tenant response adds optional `colorTheme`; business and booking layouts scope their accent palette to a validated saved hex color. Existing logo/cover fields are already displayed. Professional and availability contracts are unchanged.

## Migration and release

`20261007120000_add_location_onboarding_step` adds the LOCATION enum value. Unfinished, non-deleted tenants past the business step without complete address fields in a supported country return to BUSINESS_DETAILS to review the seven-step flow. All saved draft data is retained; completed tenants and complete supported-address drafts keep their status. Apply this migration and regenerate the client with explicit authorization, then deploy the coordinated frontend/backend changes. The migration is prepared in source; execution requires the local Prisma procedure.


`20261003220000_business_first_onboarding` adds the PROFESSIONAL_PROFILE enum value and nullable JSON draft field, changes the initial status default to BUSINESS_DETAILS, and resets non-deleted unfinished tenants to BUSINESS_DETAILS. Saved business details, services, hours, branding and workspace values are retained for review. Completed tenants are unchanged. Legacy enum values remain valid; dashboard welcome/team URLs redirect to the new flow. Apply the migration and regenerate Prisma with explicit authorization before running the changed backend, and deploy backend/frontend together. Existing completed owners are not automatically made professionals.
