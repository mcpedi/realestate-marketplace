# Nyumba 360 Advanced Platform Architecture

This specification defines the shared models and access boundaries for the advanced platform program. It preserves the existing `users`, `properties`, `inquiries`, `favorites`, `payments`, `viewingBookings`, alerts, subscriptions, and media records as the source of truth for current marketplace behaviour.

## Shared Identity and Ownership

| Entity | Owner / relationship | Required lifecycle fields | Integration boundary |
|---|---|---|---|
| `planningAnalyses` | Created by one user; optional link to one owned property | `kind`, `inputs`, `results`, `createdAt`, `updatedAt` | Release 1 only; no effect on pricing or public listings |
| `propertyDocuments` | Property owner uploads; authorized users receive explicit grants | `category`, `fileKey`, `accessLevel`, `uploadedAt`, `deletedAt` | Uses S3; never exposes a direct object key to an unauthorized viewer |
| `leases` | Landlord/agent manages; one tenant and one property or unit | `status`, `startDate`, `endDate`, `renewalStatus` | Feeds tenant, landlord, rent, and vacancy modules without replacing payments |
| `inspectionReports` | Assigned owner/agent creates against property or unit | `status`, `overallCondition`, `completedAt` | Individual items and photos remain child records; does not alter listing approval |
| `maintenanceRequests` | Reporter creates; manager assigns a technician | `status`, `priority`, `assignedTo`, `completedAt` | Linked to property/unit and may surface in tenant and landlord dashboards |
| `rentRecords` | Lease or unit linked; landlord-controlled reconciliation | `status`, `expectedAmount`, `paidAmount`, `dueDate`, `paidAt` | May reference existing payment records, never replaces the premium checkout ledger |
| `vacancies` | Landlord/manager creates for a property or unit | `vacancyDate`, `listingStatus`, `resolvedAt` | Can optionally link to a current marketplace property listing |
| `agentContacts` and `leadActivities` | Agent-owned contact/lead records | `status`, `source`, `nextFollowUpAt`, `createdAt` | Enriches existing inquiries and Leads Dashboard; no duplicate inquiry table |
| `listingTemplates` | Agent/manager-owned; admin may publish shared templates | `category`, `templateData`, `active` | Prefills, but never bypasses, existing seller listing validation and approval |
| `propertyTransactions` | Authorized parties tied to property and participants | `stage`, `status`, `startedAt`, `completedAt` | Workspace only; does not itself transfer ownership or funds |
| `referrals`, `rewardsLedger`, `wishlistCollections` | User-owned records | `status`, `points`, `createdAt` | Extends favourites and account notifications without duplicating saved properties |
| `propertyIdentifiers`, `propertyQrAssets`, `socialShareAssets` | One active identifier per property; generated assets inherit property access | `identifier`, `generatedAt`, `active` | Public QR resolves only to already-public property pages |
| `offlineDraftSync` | User-owned queued draft metadata | `status`, `clientUpdatedAt`, `syncedAt`, `failureReason` | Extends existing local seller drafts without overriding a newer server-side listing |

## Roles and Access Rules

The existing `user` and `admin` roles stay intact in early releases. Later role capabilities are implemented as explicit permissions and relationships rather than exposing broad new roles in the client.

| Capability | Default access rule | Administrative override |
|---|---|---|
| View, edit, or delete a planning scenario | Creator only | Admin may view aggregate usage, not private scenario inputs by default |
| Upload or download a property document | Owner, authorized agent, or explicitly granted tenant | Admin review only when a documented moderation or support purpose applies |
| Manage leases, rent, vacancy, inspections, and maintenance | Property owner or delegated manager | Admin can manage permission grants and module configuration |
| View tenant workspace | Tenant linked to active lease only | Landlord/manager sees their own properties; admin is audited |
| CRM and pipeline records | Assigned agent or team owner | Admin sees system-level metrics and resolves misuse |
| Module configuration, rewards rules, cost assumptions, import review | Admin only | Every change is audit logged |

## Audit Controls

Every advanced release adds a `moduleAuditLogs` record before introducing sensitive mutations. The record carries `actorUserId`, `action`, `resourceType`, `resourceId`, `propertyId` when applicable, JSON-safe change metadata, timestamp, and optional request context. Sensitive payloads such as document bytes, payment secrets, passwords, and unmasked financial credentials are never stored in the log.

| Sensitive action | Audit event | Admin review surface |
|---|---|---|
| Document upload, download grant, deletion, or permission change | Document actor, target, access change, timestamp | Document activity trail filtered by property or user |
| Lease/rent/maintenance status change | Actor, old/new status, linked property/unit | Property operations activity view |
| Bulk import approval or rejection | Import owner, row counts, error counts, confirmation | Import review history |
| Rewards rule or balance adjustment | Rule/ledger change, actor, reason | Rewards administration history |
| Template publish or shared-template edit | Actor, template version, affected category | Template management history |
| Offline sync conflict resolution | Actor, conflict outcome, server/client timestamps | Sync diagnostics page |

## Cross-Module Integration Boundaries

Financial tools use user-provided assumptions and are labelled as estimates; they must never publish a valuation, alter a listing price, or advise a user to transact. Document and property-management modules reuse the existing S3 integration and must enforce authorization server-side. Tenant, landlord, and agent dashboards query only records authorized through ownership, lease, assignment, or an explicit grant. Public QR codes, social cards, and property IDs may resolve only approved public listings.
