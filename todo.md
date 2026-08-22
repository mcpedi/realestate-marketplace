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
