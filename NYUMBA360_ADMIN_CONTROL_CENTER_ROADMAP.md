# Nyumba 360 Administrator Control Center Roadmap

**Status:** Active delivery program — foundation and initial control workspaces published  
**Purpose:** Translate the supplied administration brief into compatible Nyumba 360 releases without inventing records, weakening authorization, or interrupting the live marketplace.

> **Scope boundary.** Nyumba 360 already has an administrator workspace, protected procedures, marketplace moderation, premium management, property operations, tenant access, planning controls, referrals, QR sharing, and audit records. This program expands those capabilities through server-authorized, data-backed modules. A requested surface is not presented as live until its supporting data model, permissions, workflow, and review states exist.

## 1. Delivered foundation

The first control-center phase enhances `/admin` rather than replacing it. It preserves the existing moderation, user, premium, content, and module-control capabilities while adding safe operational improvements and initial role-safe workspaces.

| Capability | Delivered behavior | Data boundary |
|---|---|---|
| Date-aware overview | Supports **7, 30, 90, and 365-day** factual property and registration trends | Uses persisted `properties` and `users` timestamps only |
| Global admin discovery | Finds matching properties, user accounts, and recorded payments in grouped results | Runs only through an administrator procedure; search is capped and result sets are limited |
| Operations queue | Shows pending listing reviews, pending payment records, and future pending/confirmed viewings | Counts only existing marketplace records; no support-ticket or fraud count is fabricated |
| Operations hub | Summarises recorded payments, active viewings, document metadata, and module audit activity | Private document bytes and file keys remain unavailable |
| Moderation queue | Filters existing property records and records audit events for approve/reject actions | No automated fraud decision, account suspension, or unsupported verification claim is made |
| Agency verification | Filters existing agency profiles and audits changes to the existing verification flag | Verification is not presented as licensing, ownership, safety, or service-quality proof |
| System health | Performs an administrator-only database availability probe and labels control configuration | It is not an external uptime, security-certification, or provider-telemetry service |
| Responsive control surface | Keeps the desktop control console and delivers stacked cards plus a five-destination fixed mobile administrator strip | Existing public navigation, users, and marketplace routes remain unchanged |

## 2. Control-center releases

The requested control center is organized into compatible releases. Each release requires role-safe server procedures, auditable mutations, empty/error states, responsive review, and focused tests before publication.

| Release | Primary workspaces | Current foundation | Additional work required |
|---|---|---|---|
| **A — Admin command center** | KPI overview, global discovery, task queue, quick actions, status signals | Delivered | Custom date ranges and richer admin alerts can follow after their persistence policy is approved |
| **B — Moderation and verification** | Listing review, report intake, duplicate/suspicion flags, review history, document/ownership/location verification | **Partial delivery:** bounded listing review, auditable approve/reject history, and on-demand AI text-risk signals | Requires explicit report and verification-review entities; AI signals remain human-review prompts, never automatic fraud findings or enforcement |
| **C — People and agency operations** | Users, agents, agency verification, account state, role profiles, performance | **Partial delivery:** agency directory and audited existing verification flag | Requires a formal staff-role/permission model before delegated admin actions are enabled |
| **D — Finance and promotion operations** | Payments, subscriptions, featured placements, finance reporting, export controls | Payments, subscriptions, premium plans, and featured records exist | Live M-Pesa remains separately deferred; finance export requires an approved data-retention and access policy |
| **E — Marketplace operations** | Leads, viewings, rental operations, maintenance, tenant activity, documents | **Partial delivery:** recorded payments, active viewings, document metadata, and audit summaries | Admin list views must preserve property-level authorization and private-document protections |
| **F — Content and market configuration** | Blog, FAQs, announcements, locations, market intelligence, sharing configuration | Blog/categories, module settings, planning templates, location strings, and QR sharing exist | CMS scheduling, structured Kenyan locations, market datasets, and public-copy revisions need dedicated data models or approved source data |
| **G — Governance and reliability** | Roles, permissions, audit explorer, system health, notifications, security settings | **Partial delivery:** database probe, configuration posture, admin-only queries, bounded inputs, and audit events | Delegated roles, session controls, alert routing, and external health probes need explicit designs and review before activation |

## 3. Data and safety rules

The following rules apply across every release.

| Rule | Implementation standard |
|---|---|
| Authorization | Every sensitive read or mutation is protected on the server. Client-side visibility never authorizes an action. |
| Privacy | Search results use purpose-limited fields. Public routes continue to use approved-listing projections only. Private document keys remain unavailable through public storage delivery. |
| Moderation | Suspicion, duplicate, price, account, and AI text-risk flags are review signals. AI analysis is initiated by an administrator, reviews bounded listing text only, stores a minimal structured outcome, and does not establish fraud or automatically penalize a person or listing. |
| Payments | The live M-Pesa gateway remains disabled until a provider, merchant account, callbacks, and credentials are supplied securely. The current mock M-Pesa sandbox never sends an STK prompt or moves money. |
| Reviews | No customer, agent, or property review/score will be fabricated, seeded, or hardcoded. Moderation tools will operate only on genuine submitted records. |
| Data scale | New administrative list endpoints must paginate and bound search/filter inputs. Charts must use stored aggregates or clearly labelled user-entered assumptions. |
| Auditability | Approvals, rejections, role changes, financial controls, document grants, and configuration updates require searchable actor/action/resource records. |

## 4. Requested modules and implementation readiness

The supplied brief contains modules with different readiness levels. The table distinguishes what can build directly from existing records from what requires a data model or product decision.

| Requested area | Readiness | Notes |
|---|---|---|
| Dashboard, properties, pending listings, users, premium, featured placement | **Available now** | Existing server procedures and rows can be refined into a unified control surface. |
| Leads, viewing appointments, property operations, tenant assignments, document vault, referrals, QR sharing | **Available now with scoped admin views** | Existing modules can receive admin summaries while preserving ownership and document-access restrictions. |
| Agent verification, property/ownership/location verification, reported listings, duplicate detection | **Needs workflow records** | Add explicit submission, reviewer, decision, reason, and audit history; a flag must remain a human-review task. |
| Transactions, refunds, sales/rental closure, support tickets, maintenance technicians, CMS scheduling | **Needs approved schemas and workflows** | The current platform has no safe basis to invent these records or statuses. |
| Granular staff roles, custom permissions, two-factor administration, session controls | **Needs security design** | Must be implemented as server-enforced capabilities, not page-level hiding. |
| Market intelligence and county hierarchy | **Needs authoritative data and source policy** | Use verified sources or administrator-entered assumptions labelled as such; do not synthesize market prices or demand indicators. |

## 5. Navigation strategy

The desktop console retains a persistent operational header with global discovery, alerts, profile context, and contextual tabs. The mobile administrator experience now provides a dedicated fixed five-destination navigation:

| Mobile destination | First-release responsibility |
|---|---|
| Dashboard | Overview metrics, task queue, quick actions, and factual trend snapshot |
| Review | Bounded property moderation queue and existing approve/reject controls |
| Agencies | Existing agency directory and verification-flag control |
| Operations | Recorded payments, active viewings, document metadata, and audit activity |
| Health | Database availability probe and configuration posture |

## 6. Verification and release gate

Each control-center release is accepted only when server authorization, constrained input validation, empty/error/loading states, desktop and 390px views, and focused regression tests pass. A release checkpoint is saved only after these checks. The live domain is then verified without exposing protected records to unauthenticated visitors.

## 7. Deferred decisions

The following require explicit user-approved operating rules before implementation: live M-Pesa processing, financial exports and retention, refunds, delegated staff roles, account suspension/deletion policy, support attachments, automated fraud signals, real review moderation, scheduled notifications, market-data sources, location hierarchy ownership, and system-health integration credentials.

These decisions are intentionally tracked as product work rather than implied by an interface. This keeps the administrator console useful, accurate, and safe as Nyumba 360 expands.
