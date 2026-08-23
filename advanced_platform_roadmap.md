# Nyumba 360 Advanced Platform Roadmap

This roadmap extends the existing marketplace rather than replacing its authentication, property catalogue, premium subscriptions, seller workflow, leads, favourites, viewings, alerts, media storage, or administration.

| Release | Modules | Existing foundations reused | Primary roles |
|---|---|---|---|
| 1 — Planning Studio | Investment ROI, rental yield, construction cost, development planning | Properties, authenticated users, charts, dashboard patterns | Owner, agent, admin |
| 2 — Property Operations | Document vault, leases, inspections, tenant/landlord workspace, maintenance, rent, vacancies | Properties, users, S3 storage, notifications | Owner, tenant, agent, admin |
| 3 — Agent Operations | CRM enrichment, lead pipeline, performance, bulk import, listing templates, transaction timeline | Inquiries/leads, property creation, approvals, analytics | Agent, admin |
| 4 — Engagement and Identity | Referrals, rewards, collections, property IDs, QR pages, social cards | Favourites, property detail pages, notifications, storage | Buyer, owner, agent, admin |
| 5 — Platform Foundations | PWA hardening, offline drafts and sync, English/Kiswahili architecture, module controls and audit views | Existing manifest, seller drafts, account notifications, admin dashboard | All users; configuration restricted to admin |

## Release 1 Design Boundaries

Planning Studio will store user-owned scenarios, never invent market assumptions, and display all calculations as estimates. ROI, rental yield, construction, and development calculations will use user-entered values and administrator-configurable assumptions. New procedures will enforce ownership server-side; each saved scenario is scoped to its creator and can optionally be linked to an existing property.

## Shared Architecture Rules

Every later release will use ownership-scoped database records, protected procedures, server-side validation, audit-oriented timestamps, and the existing responsive card/dashboard design language. Existing roles remain unchanged until dedicated tenant, landlord, and agent permission extensions are introduced with migrations and explicit administration controls.
