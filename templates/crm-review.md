# CRM Codebase Review — SGB Energie CRM Portal Audit

**When to use:** When reviewing the CRM portal codebase — before a release, before merging a feature branch, during sprint review, or when you want confidence that Vertriebspartner data is safe, ticket workflows are sound, and egON/DWH integrations won't break. Also use when onboarding to spot structural issues early.

**Role:** You are a senior software engineer reviewing a living, organically grown CRM codebase — NestJS, Angular, TypeORM, PostgreSQL. You know that organic codebases accumulate debt, drift between DDL and entities, grow inconsistent guard coverage, and develop blind spots in tenant isolation. You review with the paranoia of someone who's been paged at 3am because a missing `tenant_id` filter exposed Vertriebspartner records across Mandanten. Find real issues — not style preferences. Prioritize what matters most: data safety, auth correctness, and integration reliability.

---

**Review scope:** $ARGUMENTS

Audit this CRM portal end-to-end. Every Vertriebspartner record is a business relationship. Every ticket bug is a lost customer. Every DSGVO gap is a legal liability. Treat this review like the data belongs to YOUR Geschaeftspartner.

## Don't

- Don't skip the data model — most bugs live in broken TypeORM relations, orphaned records, and missing FK constraints across the 75+ tables
- Don't assume Angular enforces rules — if it's not validated with class-validator in the NestJS DTO, it's not enforced
- Don't treat multi-tenancy as "probably fine" — verify EVERY TypeORM query path filters by `tenant_id`
- Don't ignore JSONB columns (`metadata`, `aiAnalysis`, `settings`, `customFields`) — unindexed JSONB queries kill PostgreSQL at scale
- Don't wave off "it works in dev" — CRM issues surface at scale (10k+ Vertriebspartner, 50k+ communications, concurrent bulk imports)
- Don't conflate the T9 role/skills system with tenant isolation — they're separate concerns
- Don't review egON API, Microsoft Graph, or n8n integrations in isolation — sync loops and race conditions live at the boundaries
- Don't forget cross-schema queries — `public.*` (DWH read-only) and `admin_panel.*` have different access rules than `crm.*`
- Don't skip the 15 guards — a missing guard on one endpoint is an auth bypass

## Step 1: Understand the Review Scope

Before touching code, orient yourself in the CRM portal structure:

**Backend** (`backend/crm-api/src/`):
- 50+ NestJS modules — core: auth, users, tenants, tickets, communications, roles
- CRM-specific: sondervereinbarungen, sales-stats, kanban, marketing, tarifverwaltung, controlling
- Infrastructure: audit, health, metrics, logger, api-keys, integrations, knowledge-base, ai-chat

**Frontend** (`frontend/crm-frontend/src/app/`):
- 40+ Angular 20 pages (standalone components, signals)
- Core services, guards, interceptors in `core/`

**Database** (`ddl/`):
- PostgreSQL 16 + TimescaleDB — `crm` schema (owned by `crm_app`)
- Cross-schema reads: `public.*` (DWH), `admin_panel.*` (Tarife)
- Manual DDL only — no TypeORM migrations (`synchronize: false`)

**Key integrations:** egON API, DWH/Lastgang API, Microsoft Graph (email), n8n webhooks (workflow.sgb-ssc.de), Getec SFTP, Import Service, Montel (Börsenpreise), Post-Direkt (Adressfactory), egon-sync (force-send + monitor)

Read `CLAUDE.md` and `ARCHITEKTUR.md` for full context. Identify which modules and entities are in the review scope.

## Step 2: Data Model & TypeORM Integrity

The data model spans 122 TypeORM entities across 75+ tables. If relationships are broken, everything built on them is broken.

### Entity Relationships
- [ ] Foreign keys between core entities (users → tenants, tickets → users, communications → tickets, user_roles → users/roles) have proper TypeORM `@ManyToOne`/`@OneToMany` decorators WITH database-level FK constraints in DDL
- [ ] Junction tables (`user_roles`, `user_facilities`, `user_skills`, `tenant_modules`) have composite indexes and proper cascade rules
- [ ] Kanban entity chain (boards → buckets → cards → notes/calls/followups/movements) maintains referential integrity — no orphaned cards when a bucket is deleted
- [ ] Sondervereinbarung entities (Buchung, Overhead, Tippgeber) properly reference their parent partner/contract
- [ ] Communications always reference a valid ticket — no orphaned communications
- [ ] Marketing entity chain (campaigns → distribution_lists, email_templates → tracking_events) has proper cascades

### Cross-Schema Access
- [ ] `public.*` (DWH) tables are accessed READ-ONLY — no accidental writes to Geschaeftspartner, Vertrag, Lastgang
- [ ] `admin_panel.*` queries only write to `clearing_entries` — nothing else
- [ ] `egon_sync.sync_blacklist` CRUD operations don't leak into other egon_sync tables
- [ ] TypeORM entity `schema` annotations match the actual DDL schema

### JSONB Columns
- [ ] `metadata`, `aiAnalysis`, `settings`, `customFields`, `preferences` JSONB columns have GIN indexes where they're queried with `@>` or `->>` operators
- [ ] JSONB content is validated at the DTO level — not just stored blindly
- [ ] No unbounded JSONB growth (e.g., appending to arrays without limits)

### DDL vs TypeORM Sync
- [ ] Entity definitions in `*.entity.ts` match the DDL in `ddl/*.sql` — no drift between code and database
- [ ] New columns added via DDL have corresponding entity property updates
- [ ] Column types, defaults, and nullability match between TypeORM decorators and DDL

### Data Quality
- [ ] Duplicate Vertriebspartner detection exists (matching on email, company domain, or structure_id)
- [ ] Required fields are enforced with class-validator in DTOs — not only in Angular forms
- [ ] Email, phone, IBAN fields are validated at the NestJS controller boundary
- [ ] Soft deletes are used where business logic requires it (is_active flags, not hard DELETE)

## Step 3: DSGVO & Privacy Compliance

This is a German energy CRM — DSGVO (GDPR) compliance is non-negotiable.

### DSGVO
- [ ] Consent is tracked per Geschaeftspartner/Vertriebspartner with source, timestamp, and scope
- [ ] A working Right to Erasure flow exists — anonymizes ALL PII across: users, tickets, communications, audit_logs, kanban_cards, sondervereinbarungen, partner_kontaktdaten
- [ ] Data Subject Access Requests can export all data held about a person in machine-readable format
- [ ] Data retention policies are enforced — records past retention period are purged or anonymized automatically
- [ ] Marketing campaigns respect opt-out status and consent revocation

### PII Handling
- [ ] PII fields (email, phone, name, address, IBAN) are identified across all 75+ tables
- [ ] PII is encrypted at rest (PostgreSQL TDE or column-level) and in transit (TLS)
- [ ] Winston logger NEVER logs PII — verify structured log fields exclude email, phone, IBAN, passwords
- [ ] The global ExceptionFilter redacts sensitive data (passwords, tokens) — verify it also catches PII in error payloads
- [ ] Angular error handlers don't expose PII in client-side logs or Sentry-style reporting

### Audit Trail
- [ ] `audit_logs` table is append-only — `crm_app` role has only SELECT+INSERT (verify DDL grants)
- [ ] All record changes (create, update, delete) on sensitive entities are logged with who, when, what changed, old/new values
- [ ] Auth events are logged: login, logout, failed attempts, token refresh, SSO callbacks, account lockout
- [ ] Sensitive field changes (ticket assignment, role changes, Sondervereinbarung amounts) are specifically tracked
- [ ] Audit log retention meets DSGVO requirements

## Step 4: Multi-Tenancy & Access Control

One Mandant seeing another Mandant's data is a company-ending event. This system has 15 guards — every one matters.

### Tenant Isolation
- [ ] EVERY TypeORM `find`, `findOne`, `createQueryBuilder`, and raw SQL query filters by `tenant_id` — audit ALL repository methods in ALL 50+ modules
- [ ] Tenant filtering is enforced at the service/repository level consistently — not ad-hoc per endpoint
- [ ] `LicenseGuard` (APP_GUARD) correctly gates features per `tenant_modules` mapping
- [ ] Background jobs (if any scheduled tasks exist) carry tenant context
- [ ] Branding settings, widget configs, and workspace preferences are tenant-scoped
- [ ] File attachments and exports are tenant-isolated

### Auth Chain (15 Guards)
- [ ] `JwtAuthGuard` — JWT validation with 15-min expiry, httpOnly cookie extraction works correctly
- [ ] `LocalAuthGuard` — username/password authentication via Passport local strategy
- [ ] `CsrfGuard` — double-submit cookie with constant-time comparison, `@SkipCsrf()` is used sparingly and justified
- [ ] `SkillsGuard` — T9 role system evaluates `@Skills()` decorators, also handles API key scope validation
- [ ] `PasswordChangeGuard` — blocks ALL API access when `must_change_password=true` (except password change endpoint)
- [ ] `ResourceAccessGuard` (abstract base) — foundation for all resource-level access guards
- [ ] `FacilityAccessGuard`, `MaloAccessGuard` — resource-level guards in `auth/guards/`
- [ ] `ContractAccessGuard` — resource-level guard in `contracts/guards/`
- [ ] `InvoiceAccessGuard` — resource-level guard in `invoices/guards/`
- [ ] `ContractsListAccessGuard`, `SingleContractAccessGuard` — batch and single contract access in `common/guards/`
- [ ] `UserThrottlerGuard` — per-user rate limiting (extends ThrottlerGuard) in `common/guards/`
- [ ] `LicenseGuard` — feature module gating per tenant in `license/guards/`

### Guard Coverage
- [ ] EVERY controller endpoint has appropriate guards — scan for unguarded endpoints (missing `@UseGuards()` or missing from APP_GUARD chain)
- [ ] New endpoints added in the review scope have guards applied
- [ ] Admin-only endpoints (`/api/users`, `/api/roles`, `/api/tenants`) require admin role
- [ ] Public endpoints (health, metrics) are intentionally unguarded and don't leak data

### Azure AD SSO
- [ ] SSO callback validates the `state` parameter (CSRF protection)
- [ ] New SSO users are created as inactive — require admin activation
- [ ] SSO token validation checks audience, issuer, and expiry
- [ ] SSO users cannot bypass the T9 role system

### Session Security
- [ ] Refresh tokens are one-time use with token family tracking — reuse detection invalidates the family
- [ ] Account lockout after 5 failed attempts triggers 15-min lockout
- [ ] Password policy enforces zxcvbn strength check
- [ ] Cookie settings: httpOnly, secure, sameSite appropriate for the deployment

## Step 5: Business Logic — Tickets, Kanban, Sondervereinbarungen

CRM business logic is where subtle bugs cause revenue and customer impact.

### Ticket Workflow
- [ ] Ticket status transitions are validated at the service layer — not just UI dropdowns
- [ ] Ticket assignment (`assignedTo`, `assignedRole`) respects active users and valid roles
- [ ] SLA deadline calculation and enforcement works correctly
- [ ] Ticket category and priority changes are logged
- [ ] Resolved tickets enforce post-resolution restrictions where appropriate

### Communications
- [ ] Communications always link to a valid ticket via `ticketId`
- [ ] Email communications via Microsoft Graph handle: send failures, bounce handling, threading
- [ ] `aiAnalysis` JSONB content is validated — malformed AI responses don't corrupt the record
- [ ] Communication direction (inbound/outbound) and channel (email/call/chat) are correctly set
- [ ] `externalId` uniqueness prevents duplicate email imports

### Kanban Pipeline
- [ ] Kanban card movements between buckets are tracked in `kanban_card_movements` with timestamps
- [ ] Deleting a board cascades correctly through buckets → cards → notes/calls/followups/movements
- [ ] Card metadata (JSONB) validates against expected `CardMetadata` structure
- [ ] Kanban supports multiple board types (partner-recruiting, IT change requests) without cross-contamination

### Sondervereinbarungen
- [ ] Buchung, Overhead, and Tippgeber entities validate amounts and date ranges
- [ ] Sondervereinbarungen reference valid partners — no orphaned agreements
- [ ] Financial calculations (provision, overhead percentages) are tested for precision (no floating-point errors)

### egON Partner Management
- [ ] Partner creation via egON API validates all required fields before sending
- [ ] egON API failures are handled gracefully — no partial creates or corrupted local state
- [ ] Partner sync (structure_id, karrierestufe) handles conflicts between local and egON data
- [ ] Partner clearing (T2 20-min DWH check) correctly identifies discrepancies

## Step 6: Performance at CRM Scale

PostgreSQL connection pool: min 5, max 20. TimescaleDB for measurements. Performance must be tested at realistic scale.

### TypeORM Queries
- [ ] List views (Vertriebspartner, tickets, communications) use indexed columns for WHERE/ORDER BY
- [ ] Composite indexes exist for common filter combinations (e.g., `tenant_id + status`, `tenant_id + assignedTo`)
- [ ] No `LIKE '%term%'` for search — use PostgreSQL FTS or trigram indexes
- [ ] Communication timelines use cursor-based pagination, not OFFSET on large result sets
- [ ] N+1 patterns eliminated — verify `relations` or `leftJoinAndSelect` is used in list endpoints, not lazy loading

### TimescaleDB Measurements
- [ ] `measurements`, `measurements_hourly`, `measurements_daily` queries use time-range filters that hit TimescaleDB chunks efficiently
- [ ] Continuous aggregates are used for hourly/daily rollups — not computed on-the-fly
- [ ] Measurement queries don't scan the entire hypertable

### Bulk Operations
- [ ] Price imports (RLM/SLP/Sonderkunden via Import Service) use batch processing
- [ ] Auftraege export handles large result sets without memory exhaustion
- [ ] Excel/PDF generation (XLSX, pdf-lib) streams or chunks for large datasets
- [ ] Bulk operations respect the connection pool limit (max 20) — no pool starvation

### Rate Limiting & Caching
- [ ] Throttler configuration (300/min global, 10/min login, 5/min refresh) is appropriate for the use case
- [ ] Rarely-changing data (roles, skill_categories, pipeline definitions, tenant settings, tarif_schwellwerte) is cached
- [ ] Cache invalidation fires when configuration changes
- [ ] egON API calls respect external rate limits — no hammering the gateway

## Step 7: Integrations & External Services

Eight external services, three internal APIs, one SFTP connection. Every integration is a data corruption vector.

### egON API (gateway.eg-on.com)
- [ ] Bearer token + reseller-id header are correctly set on every request
- [ ] Token refresh/expiry is handled — no silent auth failures
- [ ] API errors (4xx, 5xx, timeout) are caught, logged, and surfaced to the user
- [ ] Vertriebspartner data sync handles field mapping discrepancies between egON and local schema
- [ ] Concurrent egON calls don't cause race conditions on partner data

### Microsoft Graph (Email)
- [ ] OAuth2 app auth token refresh works reliably
- [ ] Email polling handles: empty inbox, rate limits, pagination of large mailboxes
- [ ] Outbound email failures are retried with backoff — not silently lost
- [ ] Email deduplication via `externalId` prevents re-importing the same message
- [ ] Webhook parsing for real-time notifications validates the source

### n8n Webhooks (workflow.sgb-ssc.de)
- [ ] Outgoing webhook calls to n8n (contracts, invoices, meter readings, documents) handle timeouts and failures gracefully
- [ ] `BaseWebhookService` is used consistently — no direct HTTP calls bypassing the base service
- [ ] Webhook URLs in environment variables (`WEBHOOK_VERTRAEGE_URL`, `WEBHOOK_RECHNUNGEN_URL`, `WEBHOOK_ZAEHLERSTAND_URL`, etc.) are correct per environment
- [ ] Webhook responses are validated before processing — malformed n8n responses don't corrupt local data

### DWH / Lastgang / Import Service (Internal APIs)
- [ ] Internal API calls (10.15.20.7:3000, 10.15.20.7:3001) handle network failures on the internal network
- [ ] Lastgang measurement data import validates data integrity before persisting to TimescaleDB
- [ ] Price import service (RLM/SLP/Sonderkunden) handles partial failures in batch imports
- [ ] DWH proxy endpoints don't expose internal network topology in error messages

### Getec SFTP (sftp.getec-dam.de)
- [ ] SFTP credentials (SSH key + password) are loaded from env/`getec_settings` table — never hardcoded
- [ ] `ssh2-sftp-client` connections are properly closed after transfer (no leaked connections)
- [ ] File transfer handles: connection timeout, partial uploads, duplicate files
- [ ] ETL processing validates Preisuebersicht and Abrechnungsbericht file formats before ingestion
- [ ] Both SFTP services (`getec-sftp.service.ts`, `abrechnungsbericht-sftp.service.ts`) follow consistent error handling

### egon-sync (10.15.20.14)
- [ ] Force-send operations (port 3003, `/api/manual-send`) validate contract data before triggering
- [ ] Force-send API key (`EGON_SYNC_INTERNAL_API_KEY`) is loaded from env — never hardcoded
- [ ] Monitor proxy (port 3001) doesn't expose internal system metrics to unauthorized users
- [ ] Blacklist CRUD operations sync correctly with `egon_sync.sync_blacklist`

### Montel (api.montelnews.com)
- [ ] OAuth token refresh (`montel-auth.service.ts`) handles expiry and stores tokens in `api_tokens` table
- [ ] Scheduled price fetching (`montel.scheduler.ts`) handles API failures without crashing the scheduler
- [ ] EPEX Spot and THE Gas Day-Ahead prices are stored correctly in `spot_prices` table
- [ ] API operation logs are written to `montel_api_logs`

### Post-Direkt (Adressfactory)
- [ ] ZIP import and Excel parsing (`datafactory-import.service.ts`, `datafactory-file-parser.service.ts`) validate file format
- [ ] Address lookup service handles missing or ambiguous results gracefully
- [ ] `/api/datafactory` endpoints have appropriate guards applied

## Step 8: Anti-Pattern Scan

Look specifically for these anti-patterns in the CRM portal:

- [ ] **UI-Only Validation** — Angular form validators without matching class-validator decorators in NestJS DTOs
- [ ] **Tenant ID by Convention** — service methods that manually add `WHERE tenant_id = ?` instead of enforcing it at the repository/interceptor level
- [ ] **Unguarded Endpoint** — controller methods missing from the guard chain (no `@UseGuards()`, not covered by APP_GUARD)
- [ ] **N+1 TypeORM** — `find()` calls without `relations` followed by lazy-loaded property access in a loop
- [ ] **Cross-Schema Write** — accidental write queries to `public.*` (DWH) or unauthorized `admin_panel.*` tables
- [ ] **JSONB Bloat** — JSONB columns (`metadata`, `aiAnalysis`, `settings`) growing without bounds or validation
- [ ] **Sync Loop** — egON API or Microsoft Graph bidirectional sync without change-origin tracking
- [ ] **Dead Entity Properties** — TypeORM entity columns that exist in code but not in DDL (or vice versa)
- [ ] **Monolithic Service** — service files with 500+ lines handling multiple unrelated concerns
- [ ] **Leaked PII** — Winston logger calls that include email, phone, IBAN, or partner names in log output
- [ ] **Pool Starvation** — long-running queries or transactions that hold connections from the pool (max 20) without releasing
- [ ] **Missing DDL** — new entities or columns added in TypeORM but missing corresponding DDL scripts in `ddl/`

## Step 9: Run & Verify

Actually run it:

### Backend (`backend/crm-api/`)
- [ ] `npm run lint` — ESLint passes clean (Husky pre-commit should catch this)
- [ ] `npm test` — all ~3,086 Jest tests pass, especially tenant isolation and guard tests
- [ ] `npm run test:e2e` — e2e tests pass
- [ ] `npm run build` — NestJS builds without errors (`nest build → dist/src/main.js`)
- [ ] `curl http://localhost:5002/health` — health check returns OK (note: `/health` is excluded from `/api` prefix)

### Frontend (`frontend/crm-frontend/`)
- [ ] `npx ng test --watch=false --browsers=ChromeHeadless` — all ~1,390 Jasmine tests pass
- [ ] `ng build` — Angular builds without errors
- [ ] No TypeScript strict-mode violations

### Manual Smoke Tests
- [ ] Create a ticket, add a communication, verify audit log entry
- [ ] Move a kanban card between buckets, verify movement is tracked
- [ ] Log in as a non-admin user, verify T9 role restrictions apply
- [ ] Query Vertriebspartner as two different tenants, verify isolation
- [ ] Trigger an egON API call, verify error handling on failure

## Output Format

```
## CRM Portal Review Summary
- **Scope:** [Modules, entities, integrations reviewed]
- **Verdict:** [APPROVE / REQUEST CHANGES / NEEDS DISCUSSION]

## Data Model & TypeORM
- [Entity relationship findings, DDL drift, JSONB issues]

## DSGVO & Privacy
- [PII exposure, audit trail gaps, consent tracking]
- **Risk Level:** [Critical / High / Medium / Low]

## Multi-Tenancy & Guards
- [Tenant isolation gaps, unguarded endpoints, T9 role issues]
- **Risk Level:** [Critical / High / Medium / Low]

## Business Logic
- [Ticket workflow, kanban, Sondervereinbarung, egON partner issues]

## Performance
- [TypeORM N+1, missing indexes, TimescaleDB query issues, pool concerns]

## Integrations
- [egON API, Microsoft Graph, n8n, DWH, Getec SFTP issues]

## Anti-Patterns Found
- [Which anti-patterns detected and where (file:line)]

## Critical Issues (Must Fix)
- [Issue with file:line location and suggested fix]

## Important Issues (Should Fix)
- [Issue with reasoning]

## Minor Issues (Nice to Fix)
- [Suggestion]

## What's Good
- [Positive observations — what's done well]
```

## Success Criteria

- Every TypeORM entity relationship has been verified against DDL for referential integrity
- Tenant isolation has been verified at the query level across all modules — no cross-tenant data leaks
- All 15 guards have been audited — no unguarded endpoints in the review scope
- PII handling has been audited — Winston logs, error responses, and Angular error handlers don't leak sensitive data
- DSGVO audit trail is append-only and covers all sensitive operations
- Ticket and kanban workflows have been reviewed for correctness and side-effect safety
- egON API, Microsoft Graph, and n8n integration error handling has been verified
- TypeORM queries have been checked for N+1 patterns and missing indexes
- Cross-schema access (public.*, admin_panel.*, egon_sync.*) respects read/write boundaries
- All 4,462+ tests pass (3,086 Jest + 1,390 Jasmine)
