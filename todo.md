# Pedi wa Real Estate - Project TODO

## Completed (prior checkpoints)
- [x] Database schema: properties, inquiries, favorites, testimonials, blog posts, categories
- [x] Backend procedures: property CRUD, inquiries, favorites, admin moderation
- [x] S3 file storage integration for property photo uploads
- [x] Global layout: navbar, footer with branding "Pedi wa Real Estate"
- [x] Home page: hero section, search bar, featured listings, CTAs
- [x] Browse/Search properties page with filters
- [x] Property detail page: image gallery, description, amenities, map, seller info
- [x] User authentication (Manus OAuth)
- [x] Seller Dashboard: add/edit/delete listings, upload photos
- [x] Admin Dashboard: approve/reject listings, manage users, content moderation
- [x] Buyer features: favorites, inquiry form, WhatsApp/call buttons
- [x] About, Contact, FAQ, Testimonials, Blog pages
- [x] Email notifications for inquiries and listing approvals
- [x] Google Maps integration on property detail pages
- [x] SEO optimization: meta tags, structured data, responsive design
- [x] Mobile-first responsive design
- [x] Vitest unit tests (25 passing)
- [x] Fix admin deleteProperty mutation bug
- [x] Fix admin rejectProperty to call db.rejectProperty
- [x] Hero background cityscape image
- [x] Contact email pediwarealestate@gmail.com and phone 0716339552
- [x] Fix deployment build error (canonical href="/")
- [x] Fix property image previews on home page
- [x] User profile feature (name, email, phone, location, bio, profile picture)
- [x] Restore missing client/index.html

## Premium Features MVP (rebuilding after sandbox reset)
- [x] Add premium database schema (subscriptionPlans, subscriptions, payments, featuredListings, propertyVideos, agencyProfiles, favoritesCount)
- [x] Apply migrations to database (tables already existed from prior session)
- [x] Seed default subscription plans (Basic KES 500, Premium KES 1,500, Agency KES 3,000)
- [x] Add premium backend procedures: plans, subscribe, cancel, payment history, featured listings
- [x] Add listing analytics procedures (views, saves, inquiries)
- [x] Add AI tools procedures (generate description, price recommendation)
- [x] Add property video upload backend
- [x] Add admin premium controls (manage plans, verify users, revenue, featured listings)
- [x] Build Premium subscription page with plan selection, my subscription, payment history, featured listings tabs
- [x] Add Featured property listings at top of search/homepage results
- [x] Add Premium/Verified badges on profiles and property cards
- [x] Premium-aware image upload limits in Seller Dashboard (N/max counter)
- [x] Listing analytics UI in Seller Dashboard (premium users)
- [x] AI tools UI in Seller Dashboard (premium users)
- [x] Video upload UI in Seller Dashboard (premium users)
- [x] Admin dashboard premium plan management (Premium tab + Edit Plan dialog + user verify button)
- [x] Wire Premium route and nav links
- [x] Tests for premium procedures (35 tests passing incl. premium.test.ts)
- [x] Checkpoint and deliver

## Production build fix (index.html resolution)
- [x] Diagnose production build failure: Vite cannot resolve entry module index.html in Docker build
- [x] Fix vite config: added build.rollupOptions.input pointing to client/index.html (root is project root)
- [x] Fix serveStatic in server/_core/vite.ts to serve dist/public/client (where SPA build lands) with dist fallback
- [x] Verify pnpm build locally succeeds, tests pass (40), dev server serves site correctly, checkpoint and confirm deployment

## Modern & Cool Features MVP
- [x] Dark/light mode toggle with theme persistence and modern UI (glassmorphism cards, animations)
- [x] Property match percentage engine (0-100) based on saved preferences + activity
- [x] User preferences table (budget, location, property type, bedrooms)
- [x] AI Property Assistant: conversational AI chat that parses queries and returns matching listings
- [x] Smart property recommendations: Picked for You section based on searches/saved listings/preferences
- [x] Interactive property map page with markers and area-based search
- [x] Swipe property discovery (right=save, left=skip, open details)
- [x] Property comparison tool (side-by-side: price, location, size, beds, amenities, score)
- [x] Pedi Wa Property Score (0-100 auto-generated: value, location, amenities, accessibility; auto-computed on admin approval)
- [x] 360 virtual tour viewer for listings with 360 images (is360 photo flag in db + drag-to-pan PanoramaViewer on property detail; sellers toggle 360° per photo when uploading/editing)
- [x] Smart location insights (nearby schools, hospitals, shopping, transport + travel distance)
- [x] Instant property alerts (search preference saved, notify on matching new listings)
- [x] Price-drop alerts for saved properties (alert creation + manual check mutation)
- [x] Enhanced AI property description generator (seller flow — exists in premium router)
- [x] One-tap WhatsApp inquiry with personalized pre-filled message (property name, price, listing ID)
- [x] Virtual/physical viewing booking with calendar scheduling (buyer My Viewings + Seller Viewings)
- [x] Tests for new procedures (modern.test.ts — 54 tests passing)
- [x] Checkpoint and deliver

## Leads Dashboard (agent inquiry management)
- [x] Backend: seller leads procedure (aggregates inquiries per listing, statuses: new/contacted/viewing/negotiating/closed/lost, buyer details)
- [x] Backend: lead status update mutation (ownership-checked)
- [x] Backend: lead stats (total, new, contacted, viewing, negotiating, closed, lost, conversion rate)
- [x] Leads Dashboard page: leads table with per-lead status, listing info, buyer info, actions
- [x] Leads Dashboard: filter by status and listing, stats cards at top
- [x] Wire /leads route and nav entry in Seller Dashboard (Leads button with count badge)
- [x] Vitest tests for leads procedures (5 tests passing, 40 total)
- [x] Verify production deployment (sync checkpoint re-triggered deployment after index.html build failure)
- [x] Checkpoint and deliver

## Reference-inspired mobile-first layout refresh
- [x] Rebuild the home dashboard layout around compact mobile navigation, a search-first header, and a visual property hero
- [x] Add a mobile quick-actions strip for AI Assistant, Map Search, Saved, Compare, and Alerts
- [x] Restyle recommendation cards as horizontally scrollable mobile property cards while preserving live listing data
- [x] Add a map discovery preview and compact AI assistant prompt card to the mobile home flow
- [x] Introduce a fixed mobile bottom navigation with Home, Explore, Add Property, Saved, and Profile links
- [x] Preserve and refine the desktop layout so it complements the new mobile-first experience
- [x] Verify responsive rendering, run tests/build, checkpoint, and publish (mobile and desktop home plus key discovery pages checked; 54 tests and production build passing)

## Discovery personalization enhancement
- [x] Generate and integrate a high-quality Kenyan estate hero image with left-side text-safe composition
- [x] Add protected live header activity counts for unread buyer inquiries and persisted account notifications
- [x] Build a first-use onboarding flow for location, budget, property type, and bedrooms
- [x] Connect onboarding preferences to the existing recommendation engine and refresh Picked For You on completion
- [x] Add procedure coverage, verify responsive behavior, build, checkpoint, and publish (57 tests and production build passing)

## Reference-inspired profile hub
- [x] Rebuild the signed-in profile page as a mobile-first identity and account summary hub
- [x] Add live saved-property, alert, viewing, and message statistics to the profile header
- [x] Add a premium membership callout and connect its action to the Premium plan page
- [x] Add grouped Account, Activity, and Help actions connected to available profile and marketplace routes
- [x] Preserve profile editing, picture upload, and logout access behind the refined profile hub
- [x] Add or update tests, verify responsive rendering, build, checkpoint, and publish (58 tests, production build, and mobile/desktop verification passing)

## Website documentation
- [x] Document product purpose, branding, public site navigation, and buyer journeys
- [x] Document seller, agent, admin, premium, and profile workflows
- [x] Document modern discovery, AI, map, alert, booking, and notification features
- [x] Document the technical architecture, data model, security model, operations, and deployment workflow
- [x] Review documentation for accuracy and deliver the Markdown guide (3,640 words; 17 top-level sections)

## Public contact and footer update
- [x] Change the public address to Nairobi, Kilimani
- [x] Make the public phone number callable and email address open a new email message when clicked
- [x] Add the “Designed and made by Jacks Ict Solutions” footer credit
- [x] Verify the contact links and responsive footer (61 tests passing; production build plus mobile and desktop Contact/footer views verified)
- [x] Checkpoint and publish the public contact/footer update

## Nyumba 360 brand update
- [x] Update all public-facing brand references, metadata, and product labels to Nyumba 360
- [x] Verify the Nyumba 360 brand across responsive layouts, tests, and production build (64 tests passing; production build passed; desktop Home/About and mobile Home branding reviewed)
- [x] Checkpoint and publish the Nyumba 360 rebrand

## Nyumba 360 favicon and app icon
- [x] Create a recognizable Nyumba 360 favicon and app icon asset set (finished 1920×1920 house-and-orbit image confirmed)
- [x] Add browser and app metadata that uses the Nyumba 360 icon assets
- [x] Verify favicon/app-icon delivery, metadata, and production build (asset URL and install manifest resolve; 66 tests passing; production build and mobile home view verified)
- [x] Checkpoint and publish the Nyumba 360 icon update

## Reference-inspired Explore redesign
- [x] Audit the existing Explore page data, filtering controls, and reusable property components
- [x] Rebuild the mobile Explore layout with category tiles, compact filters, map discovery, sorting, and rich property rows
- [x] Preserve live search/filter/listing behavior and add targeted regression coverage
- [x] Verify responsive Explore layouts and build (69 tests passing; production build plus mobile and desktop Explore layouts reviewed)
- [x] Checkpoint and publish the Explore redesign
- [x] Add an explicit property-query error state with a retry action
- [x] Strengthen Explore behavior coverage for live querying, sorting, and pagination expectations
- [x] Re-run tests, build, and visual review after the production-quality hardening (72 tests passing; production build and final mobile Explore view verified)

## Add Property repair
- [x] Diagnose the broken Add Property navigation and seller listing workflow
- [x] Repair the broken Add Property path and preserve authenticated seller behavior
- [x] Add regression coverage and verify the direct mobile seller form (75 tests passing; production build passed; /seller?new=1 opens the listing form)
- [x] Checkpoint and publish the Add Property repair
- [x] Strengthen direct-add route behavior coverage and query-clearing logic
- [x] Reconfirm the authenticated seller form launch on mobile and desktop without creating test listings (authenticated New Property form opened on both layouts; 77 tests and production build passing)
- [x] Preserve the direct Add Property intent across sign-in for unauthenticated users (one-time post-auth continuation covered; 78 tests and production build passing)

## Seller listing workflow enhancements
- [x] Audit current seller form state and reusable map/location capabilities
- [x] Add local draft autosave and restoration for incomplete new listings
- [x] Convert the listing form into a clear multi-step flow with progress indication
- [x] Add address suggestions that populate location and coordinates
- [x] Add coverage and verify responsive form behavior (84 tests passing; production build and mobile/desktop Add Property dialogs reviewed)
- [x] Checkpoint and publish the seller listing workflow enhancements
- [x] Prevent stale saved drafts from returning after a seller discards all listing content
- [x] Strengthen behavior coverage for draft lifecycle, step progression, and location selection
- [x] Route seller form step and location-selection updates through behavior-tested workflow helpers
- [x] Re-run seller workflow tests and production build after behavior-test hardening

## Listing description validation repair
- [x] Confirm the server description requirements and current client validation gap (server enforces a 10-character minimum)
- [x] Add description-length guidance and aligned client-side validation to the listing form
- [x] Add regression coverage and verify the repair (85 tests passing; production build and mobile seller form guidance reviewed)
- [x] Checkpoint and publish the listing description validation repair
- [x] Add behavior coverage that blocks a sub-10-character description at the Basics step

## Premium membership checkout form
- [x] Audit the current plan-selection, subscription, and payment-record flow
- [x] Open a payment form for the selected premium plan with payment-method-specific details
- [x] Safely validate payment details and connect completion to the existing subscription flow
- [x] Add coverage and verify the checkout experience (92 tests passing; production build, rendered-dialog interaction tests, and opened desktop/mobile checkout dialogs reviewed)
- [x] Checkpoint and publish the premium membership checkout form
- [x] Send normalized checkout payment details through the subscription flow and persist the payment reference safely
- [x] Add interaction-focused checkout payload coverage and verify the opened payment form on responsive layouts
- [x] Support direct plan checkout links and visually verify the opened payment form
- [x] Add dialog-level checkout flow coverage for plan selection, validation, method changes, and confirmation payloads
- [x] Capture direct-checkout evidence confirming selected-plan payment form contents on mobile and desktop
- [x] Add component-level behavior coverage for premium checkout dialog interactions
- [x] Capture inspectable direct-checkout page evidence for selected-plan dialog contents
- [x] Add accessible dialog title and description metadata for the premium payment form

## Live M-Pesa STK Push integration
- [ ] Confirm the selected live payment provider, merchant account type, and callback requirements
- [ ] Add secure Daraja payment initiation and callback handling for premium subscriptions
- [ ] Store pending, successful, and failed STK Push outcomes without exposing payment secrets
- [ ] Update premium checkout status feedback and payment history for live transactions
- [ ] Test with authorized provider credentials, verify the webhook, checkpoint, and publish

## Mock M-Pesa checkout simulation
- [x] Review the existing premium checkout and payment-record contracts for a safe simulation boundary
- [x] Add a clearly labelled mock M-Pesa path that simulates pending, successful, and failed outcomes without contacting a payment provider or moving money
- [x] Add focused checkout and payment-record coverage, verify responsive behavior, checkpoint, and publish (36 test files / 167 tests passing; TypeScript, production build, and authenticated premium checkout rendering verified)
- [x] Verify the authenticated mock checkout on a 390px mobile viewport and save the verified sandbox release checkpoint (desktop and 390px checkout dialogs reviewed; no live payment prompt or money movement)
- [x] Record authenticated-administrator sandbox evidence for desktop and mobile, then save and publish the mock M-Pesa release checkpoint (administrator-only sandbox controls and all three outcomes confirmed; no Safaricom call, STK prompt, or money movement)
- [x] Save the verified mock M-Pesa sandbox release checkpoint and confirm the published deployment (checkpoint `5a9c36ae` saved; auto-publish triggered)
- [x] Confirm checkpoint `5a9c36ae` on the live domain and verify the published mock-only checkout boundary (deployment-success notification received; published bundle contains the Mock M-Pesa sandbox UI while the signed-out route remains gated)

## Publishing reliability
- [ ] Reproduce the reported publishing failure with the current version and capture the build or deployment error output
- [ ] Apply the smallest safe fix if a concrete publishing blocker is identified, then rerun verification
- [ ] Republish the latest Nyumba 360 version and confirm the live domain serves that published version

## Administrator dashboard redesign
- [x] Add an administrator-only live dashboard overview for factual metrics, daily property/user trends, recent listings, and safe recent activity
- [x] Rebuild the `/admin` landing experience with the approved mobile-first operational hierarchy, Nyumba 360 visual language, responsive navigation, and no fabricated data
- [x] Preserve and reorganize functional moderation, users, premium, content, and module-control workflows without weakening authorization
- [x] Add focused authorization/overview tests and complete responsive verification (140 tests passing; production build plus desktop and mobile dashboard views verified)
- [x] Checkpoint and publish the administrator dashboard redesign

## Nyumba 360 general AI assistant
- [x] Expand server-side assistant prompts to support friendly everyday conversation and normal questions alongside property expertise
- [x] Use the signed-in client name only for personalised greetings and optional wellbeing check-ins without exposing private profile details
- [x] Refresh the assistant UI with a name-aware welcome, check-in starters, everyday question suggestions, and preserved property-search prompts
- [x] Add focused prompt/context tests and verify responsive behavior (143 tests passing; production build plus desktop and mobile assistant views verified)
- [x] Checkpoint and publish the expanded Nyumba 360 general AI assistant

## AI chat typing indicator
- [x] Replace the generic AI response loader with an accessible, motion-aware typing-indicator animation
- [x] Verify the typing indicator on responsive assistant layouts and add coverage (144 tests passing; production build verified)
- [x] Checkpoint and publish the AI typing-indicator refinement

## Smartphone Add Property optimization
- [x] Audit the Add Property route and multi-step listing form at a phone viewport to identify touch, spacing, control, and action-bar issues
- [x] Rework the listing form for a phone-first workflow while preserving drafts, validation, media uploads, and location suggestions
- [x] Add focused mobile workflow coverage, verify on a phone viewport, checkpoint, and publish (146 tests passing; production build and 390px phone form reviewed)

## Listing submission success experience
- [x] Review the listing create response and property-detail route needed for safe post-submit navigation
- [x] Add an accessible, motion-aware success animation with a View Property action after creating a listing
- [x] Add regression coverage, verify the post-submit experience on a phone viewport, checkpoint, and publish (147 tests passing; production build and 390px listing dialog verified)

## Reference-inspired About page redesign
- [x] Audit the current About route, mobile navigation, and reusable image assets against the supplied reference
- [x] Rebuild the About page with a Nyumba 360 hero, overlapping mission card, values, story, benefits, and contact call-to-action
- [x] Add regression coverage, verify phone and desktop rendering, checkpoint, and publish (35 test files / 161 tests passing; production build plus 390px and desktop About-page reviews completed)

## Interactive About-page team section
- [x] Review the current About-page story boundary and choose an interaction that is accessible, responsive, and consistent with Nyumba 360
- [x] Add an interactive team-member section immediately below the story without disturbing the existing benefits and contact sections
- [x] Add focused coverage, verify mobile and desktop behavior, checkpoint, and publish (35 test files / 162 tests passing; TypeScript, production build, 390px mobile, and desktop About-page views verified)

## Administrator control-center enhancement program
- [x] Audit the current administrator dashboard, data domains, existing authorization, and mobile navigation against the supplied control-center brief
- [x] Create a phased delivery map that distinguishes implemented controls, safely derivable factual metrics, administrator-entered configuration, and modules that require new approved product scope or data models
- [x] Deliver the dashboard foundation: date-aware factual KPIs, pending task queue, operational quick actions, status summaries, global admin discovery, and responsive mobile/desktop navigation (36 test files / 168 tests passing; TypeScript, production build, and desktop plus 390px administrator views verified)
- [x] Extend property moderation, verification, users/agents, payments, leads, viewings, content, locations, operations, documents, audit, and system-health workspaces without fabricating data or weakening authorization (delivered data-backed moderation, agency verification, operations, audit, health, and navigation control-center layers while preserving existing user, premium, content, leads, and property workflows)
- [x] Deliver an administrator operations hub that exposes existing recorded payments, active viewing appointments, document metadata, and audit activity through paginated, server-authorized summaries (36 test files / 169 tests passing; TypeScript, production build, and desktop plus 390px operations views verified)
- [x] Support direct, safe administrator tab links for operations and existing control surfaces
- [x] Deliver a richer administrator moderation queue for existing property records, including bounded filtering, listing context, and auditable approve/reject actions (36 test files / 170 tests passing; TypeScript, production build, and desktop plus 390px moderation views verified)
- [x] Deliver an administrator agency-verification directory using existing agency records, bounded filtering, and audited verification changes (36 test files / 171 tests passing; TypeScript, production build, and desktop plus 390px agency views verified)
- [x] Deliver an administrator system-health and control-posture summary with an actual database-availability check and clearly labelled configuration states (36 test files / 172 tests passing; TypeScript, production build, and desktop plus 390px health views verified)
- [x] Add role/permission and audit-action boundaries for newly introduced sensitive controls, with server-side authorization and pagination for large data sets (all new data and mutations use server-side administrator procedures; bounded inputs and paginated summaries applied)
- [x] Add direct regression coverage that administrator-only verification mutations write their audit events
- [x] Add a focused mobile administrator navigation strip for the dashboard, moderation, agencies, operations, and health workspaces
- [x] Add focused regression coverage, complete responsive reviews, publish the delivered phase, and document deferred modules (36 test files / 173 tests passing; TypeScript, production build, desktop and 390px reviews, and updated delivery roadmap)

## AI-assisted property moderation signals
- [x] Audit the current property moderation queue, existing property fields, audit records, and server-side AI integration boundary
- [x] Add a protected AI analysis that returns structured review signals for inappropriate, deceptive, discriminatory, or unsafe listing content without automatic rejection or account action
- [x] Persist only the minimum review outcome and show the signal, confidence, and human-review boundary in the administrator moderation queue
- [x] Add authorization, schema-validation, and human-review regression coverage; verify responsive behavior, publish, and document limitations (migration 0017 applied; 36 test files / 175 tests passing; TypeScript, production build, and desktop plus 390px moderation views verified)

## Pending human-review badge
- [x] Review the existing factual pending-listing count and current administrator desktop/mobile navigation locations
- [x] Add a visible, accessible pending-human-review badge that routes administrators to the moderation queue without changing the count source
- [x] Add coverage, verify desktop and mobile rendering, checkpoint, and publish (37 test files / 177 tests passing; TypeScript, production build, desktop, and 390px header views verified)

## Project documentation refresh
- [x] Inventory existing product, technical, security, operational, and release documentation against the current Nyumba 360 feature set
- [x] Prepare an updated maintainable documentation package covering public journeys, role workflows, architecture, security controls, operations, deployment, and current deferred work
- [x] Add documentation regression coverage, verify accuracy and project health, checkpoint, publish, and deliver the Markdown guide (36 test files / 165 tests passing; TypeScript and production build verified)

## Cybersecurity review
- [x] Inventory security-relevant code, application configuration, and external dependency exposure across the project
- [x] Review authentication, authorization, data exposure, input handling, file uploads, APIs, and client-side security controls
- [x] Validate dependency and deployment configuration risks, prioritize findings, and deliver a plain-English remediation report

## Immediate cybersecurity remediation
- [x] Define safe public property, seller, photo, and storage-object access contracts without breaking approved-listing discovery
- [x] Upgrade vulnerable direct and transitive production dependencies and confirm the production audit result (0 critical and 0 high production advisories; one moderate remains for separate follow-up)
- [x] Prevent anonymous access to pending/rejected listing data and private seller fields while preserving owner/admin workflows
- [x] Restrict the storage proxy to explicitly public asset prefixes and preserve authorized signed downloads for private documents
- [x] Add security regression coverage, run the full verification suite, checkpoint, and publish the remediation (153 tests passing; production build and mobile public-marketplace views verified)

## Comprehensive cybersecurity hardening
- [x] Resolve the remaining moderate production dependency advisory and verify a clean production audit
- [x] Add reusable endpoint rate limiting, payload limits, security-event logging, and abuse-safe public inquiry handling
- [x] Add strict file type, size, count, and content validation for listing, profile, agency, video, and document upload paths
- [x] Harden session handling, CSRF/origin validation, and production-only token exposure controls without breaking OAuth
- [x] Add a staged browser security-header policy and remove unnecessary server fingerprinting
- [x] Add focused security regression tests, run complete verification, update documentation, checkpoint, and publish (34 test files / 157 tests passing; production build, mobile smoke checks, live headers, and clean production audit verified)
- [x] Preserve valid signed legacy sessions during the JWT-claim migration and rotate them into the new 30-day issuer/audience-bound cookie format (focused migration regression coverage passing)

## Advanced platform enhancement program
- [x] Inventory every requested module and map it to existing Nyumba 360 data, roles, APIs, and screens
- [x] Define phased releases, shared domain models, permissions, audit controls, and integration boundaries
- [x] Build coherent advanced-module releases without duplicating existing marketplace functionality
- [x] Add regression coverage, verify responsive workflows, checkpoint, and publish each active advanced release
- [x] Specify shared advanced-platform entities, ownership relationships, lifecycle statuses, and module boundaries
- [x] Define auditable sensitive actions, actor/resource metadata, access rules, and admin review surfaces

## Advanced release 1 — Planning Studio
- [x] Add shared investment-analysis records and ownership-safe APIs for saved planning scenarios
- [x] Build ROI and rental-yield calculators using user-provided assumptions and clearly labelled estimates
- [x] Build construction and development estimators with transparent, configurable inputs and cost breakdowns
- [x] Add a responsive Planning Studio dashboard with reusable charts and saved-scenario management
- [x] Add server-side validation, behavior tests, migration, and visual checks (100 tests passing; desktop and mobile Planning Studio views reviewed)
- [x] Replace the zero-value Planning Studio chart blank state with clear calculation guidance
- [x] Checkpoint and publish Advanced release 1 — Planning Studio
- [x] Add user-scoped Planning Studio router behavior tests for save, list, delete, and owned-property linking
- [x] Add server-side validation coverage for invalid Planning Studio percentage inputs

## Advanced release 2 — Property Operations
- [x] Define property-operations data model, access grants, module audit events, and dashboard boundaries
- [x] Build secure property document vault uploads, metadata, property linking, access checks, and activity logging (104 tests passing; mobile and desktop vault layouts reviewed)
- [x] Add lease, inspection, maintenance, rent, and vacancy records with ownership-scoped workflows
- [x] Build an owner-side Property Operations dashboard with role-safe summaries, workflow status controls, and mobile-first responsive layouts
- [x] Add tenant-linked dashboards after introducing an explicit tenant identity and property-access relationship model (no access is inferred from contact data)
- [x] Add behavior coverage, database migration, and responsive checks (108 tests passing; production build, desktop, and mobile Operations views verified)
- [x] Checkpoint and publish Advanced release 2 — Property Operations

## Advanced release 3 — Agent Operations
- [x] Add agent-owned CRM contacts, activity timeline, listing template, and property transaction records without replacing existing marketplace inquiries or payments
- [x] Build protected, ownership-scoped Agent Operations APIs with server-side validation and audit events
- [x] Create a responsive agent workspace for CRM pipeline, performance metrics, activity notes, templates, and transaction timelines
- [x] Add focused router tests, generate and apply migrations, and verify responsive behavior (114 tests passing; production build plus desktop and mobile workspace views verified)
- [x] Checkpoint and publish Advanced release 3 — Agent Operations

## Advanced release 4 — Engagement and Property Identity
- [x] Add user-owned wishlist collections that reuse existing favourites rather than duplicating saved-property records
- [x] Add permanent, human-readable property identifiers with owner/admin creation and public approved-listing lookup only
- [x] Build protected APIs and responsive collection/identity interfaces with loading, empty, and error states
- [x] Add authorization tests, generate and apply migrations, and verify responsive behavior (119 tests passing; production build plus desktop and mobile views verified)
- [x] Checkpoint and publish Advanced release 4 — Engagement and Property Identity

## Advanced release 5 — Platform Foundations
- [x] Add English/Kiswahili translation infrastructure and a persisted language control for shared navigation and new workflow status copy
- [x] Strengthen local listing drafts with offline-aware metadata, safe restoration, and visible connectivity/save status without overwriting server listings
- [x] Add a safe service-worker registration and offline application-shell fallback while preserving the existing manifest and normal online behavior
- [x] Add focused tests and verify responsive behavior and production shell build (122 tests passing; production build plus desktop shared navigation and seller workspace views verified)
- [x] Checkpoint and publish Advanced release 5 — Platform Foundations

## Advanced release 6 — Referrals and Rewards
- [x] Add private referral-code profiles, explicit one-time referral claims, and status history without inferring attribution from contact data
- [x] Add append-only rewards ledger records, calculated balances, and admin-only point adjustments without fabricating earned points or replacing payments
- [x] Build a responsive account dashboard for sharing referral codes, viewing status history, and reviewing reward-ledger activity
- [x] Add authorization and validation tests, generate and apply migrations, and verify responsive behavior (126 tests passing; production build plus desktop and mobile rewards workspace views verified)
- [x] Checkpoint and publish Advanced release 6 — Referrals and Rewards

## Advanced release 7 — QR and Public Property Sharing
- [x] Add public-share records derived only from permanent property identifiers and approved listing data
- [x] Add protected owner/admin sharing controls and public QR-resolution endpoints that never reveal drafts, documents, or owner-private data
- [x] Build responsive QR preview, print-ready, and social-sharing surfaces for approved property listings
- [x] Add authorization/privacy tests, generate and apply migrations, and verify responsive behavior (130 tests passing; production build plus desktop and mobile owner and public-sharing views verified)
- [x] Checkpoint and publish Advanced release 7 — QR and Public Property Sharing

## Advanced release 8 — Tenant Identity and Dashboard
- [x] Add explicit owner-created tenant-to-property assignments linked to authenticated user identities, without inferring access from names, email addresses, or phone numbers
- [x] Add owner-only assignment controls and protected tenant dashboard APIs for assigned property operations and document access
- [x] Build responsive owner assignment and tenant dashboard interfaces with empty, pending, and revoked-access states
- [x] Add authorization tests, generate and apply migrations, and verify responsive behavior (134 tests passing; production build plus desktop and mobile tenant workspace views verified)
- [x] Checkpoint and publish Advanced release 8 — Tenant Identity and Dashboard

## Advanced release 9 — Administrator Module Controls
- [x] Add administrator-owned module settings with audited enablement controls and no exposure of admin actions to normal users
- [x] Add controlled planning-assumption templates that are clearly labelled as administrator-provided defaults, never invented market data
- [x] Build responsive administrator controls and Planning Studio default-selection surfaces with user-entered values remaining editable
- [x] Add authorization tests, generate and apply migrations, and verify responsive behavior (138 tests passing; production build plus desktop and mobile controls and Planning Studio views verified)
- [x] Checkpoint and publish Advanced release 9 — Administrator Module Controls
