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
