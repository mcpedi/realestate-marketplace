# Nyumba 360 Advanced Platform Roadmap

This roadmap extends the existing marketplace rather than replacing its authentication, property catalogue, premium subscriptions, seller workflow, leads, favourites, viewings, alerts, media storage, or administration.

| Release | Modules | Existing foundations reused | Primary roles |
|---|---|---|---|
| 1 — Planning Studio | Investment ROI, rental yield, construction cost, development planning | Properties, authenticated users, charts, dashboard patterns | Owner, agent, admin |
| 2 — Property Operations | Document vault, owner-side lease, inspection, maintenance, rent, and vacancy workflows | Properties, users, S3 storage, notifications | Owner, agent, admin |
| 3 — Agent Operations | CRM enrichment, activity timeline, performance summary, listing templates, transaction workspace | Inquiries/leads, property creation, approvals, analytics | Agent, admin |
| 4 — Engagement and Identity | Referrals, rewards, collections, property IDs, QR pages, social cards | Favourites, property detail pages, notifications, storage | Buyer, owner, agent, admin |
| 5 — Platform Foundations | PWA hardening, offline drafts and sync, English/Kiswahili architecture, module controls and audit views | Existing manifest, seller drafts, account notifications, admin dashboard | All users; configuration restricted to admin |

## Release 1 Design Boundaries

Planning Studio will store user-owned scenarios, never invent market assumptions, and display all calculations as estimates. ROI, rental yield, construction, and development calculations will use user-entered values and administrator-configurable assumptions. New procedures will enforce ownership server-side; each saved scenario is scoped to its creator and can optionally be linked to an existing property.

## Shared Architecture Rules

Every later release will use ownership-scoped database records, protected procedures, server-side validation, audit-oriented timestamps, and the existing responsive card/dashboard design language. Existing roles remain unchanged until dedicated tenant, landlord, and agent permission extensions are introduced with migrations and explicit administration controls.

## Delivered Release Boundaries

Release 2 is complete as an **owner-side Property Operations** module. It provides secure document storage and typed operations records; it deliberately does not expose a tenant workspace because a contact name or phone number is not a valid tenant identity or access grant. A future tenant release must first introduce an explicit lease-to-user relationship, permission lifecycle, and data migration.

Release 3 is complete as a private **Agent Operations** module. CRM contacts, their interaction timeline, reusable listing templates, and transaction workspaces are each owned by the signed-in agent. Existing marketplace inquiries and the payment ledger remain independent source systems; the agent workspace enriches working relationships rather than rewriting either source of truth.

## Release 4 — Engagement and Property Identity Scope

Release 4 will extend, not replace, the existing favourites and public property pages. The initial module order is deliberate so a user-controlled collection model exists before referral/reward flows, and a permanent property identifier exists before QR or social-card surfaces depend on it.

| Module | Initial release boundary | Security and integration rule |
|---|---|---|
| Wishlist collections | User-owned named collections that reference existing favourites | A collection never grants access to a private, removed, or unapproved property |
| Referrals | One private referral code per eligible user and an auditable referral status history | Never infer a referral from contact data; only explicit sign-up attribution may qualify |
| Rewards ledger | Configurable, append-only points entries and balance views | User-facing redemption is deferred until administrator-approved reward rules exist |
| Property identity | One permanent human-readable identifier per property | Identifiers are searchable but public resolution is restricted to approved public listings |
| QR and social surfaces | Regenerated views/assets derived from already-public property data | No private document, owner contact, or unpublished listing data may enter a public asset |

## Release 5 — Platform Foundations Scope

Release 5 will strengthen the existing PWA manifest and seller draft work rather than replacing either. Offline drafts require an explicit sync queue and conflict policy; scheduled work is not implied. English/Kiswahili support must migrate user-facing copy to translation keys before enabling a language selector. Module controls, configurable assumptions, and audit review remain server-side admin capabilities and are never rendered for ordinary users.
