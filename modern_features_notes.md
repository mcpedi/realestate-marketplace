
## Status (Aug 20 ~20:45) — pages created & verified
ALL 6 new pages render correctly: /assistant, /map, /discover, /compare, /alerts, /bookings. 0 TS errors.
- index.css brace mismatch fixed (missing `}` closing @layer components).
- MapDiscovery may have `listingType: "any"` filter bug (getProperties status filter is fine but listingType "any" is NOT a valid enum value — check MapDiscovery default filter). Map showed "0 properties shown".
- PropertyCard still lacks "Compare" button (needs Compare toggle via localStorage + count badge).
- PropertyDetail enhancements pending: PropertyScore badge, MatchBadge, nearby POIs section, Book Viewing dialog, WhatsApp prefill with listing ID, 360 viewer.
- Home "Picked for You" section pending (trpc.modern.recommendations, logged-in only).
- Navbar links for /discover, /compare, /bookings need verifying/adding.
- Seller bookings tab in SellerDashboard/Leads: trpc.modern.sellerBookings + updateBookingStatus.
- vitest: add server/modern.test.ts, run pnpm test, checkpoint + publish.

## Status (Aug 20 ~20:48) — SellerViewings + PropertyDetail enhancements
DONE:
- MapDiscovery listingType "any" bug fixed.
- Navbar: added /discover, /compare, /bookings (My Viewings) links desktop+mobile.
- PropertyCard: Compare toggle button (uses useCompareIds hook in client/src/hooks/useCompareIds.ts, key pw-compare-ids, emitCompareChange from Compare.tsx).
- PropertyDetail: PropertyScoreChip+MatchBadge in title, listing ID shown, Compare button, "Book a Viewing" button + Dialog (date/time/type/notes, trpc.modern.bookingCreate), WhatsApp prefill with title/price/listing ID, ScoreBreakdown + LocationInsights components appended at end (ScoreBreakdown uses trpc.modern.propertyScore breakdown: valueScore/locationScore/amenitiesScore/accessibilityScore, cols: emerald >=80, blue >=60, amber else; LocationInsights uses nearbyPois categories school/hospital/shopping_mall/transit_station/restaurant/park).
- Home.tsx: "Picked for You" section (trpc.modern.recommendations.useQuery(undefined, {enabled: isAuthenticated}), recsData?.items, empty state links to /assistant).
- SellerDashboard: Viewings button -> /seller/viewings with pending badge (trpc.modern.sellerBookings).
- server/routers.ts: added sellerBookingUpdate procedure (owner-check via getSellerPendingBookings, calls db.updateBookingStatusBySeller).
- server/db.ts: added updateBookingStatusBySeller(id, status).
- client/src/pages/SellerViewings.tsx CREATED — ERROR: trpc.modern.buyerInfo does not exist. Need to add buyerInfo procedure (input {buyerId}) -> returns {name, phone, email} from users table for property owners (check property owned by ctx user first).

NEXT:
1. Add buyerInfo procedure to modernRouter (server/routers.ts ~line 363 after sellerBookings).
2. Register /seller/viewings route in App.tsx (import SellerViewings, route: <SellerViewings /> under protected? it does own auth check).
3. Add server/modern.test.ts vitest (propertyScore computation, recommendations, alerts, bookings) then pnpm test.
4. Webdev_take_screenshot verify pages, then webdev_save_checkpoint (auto-publish enabled).
App.tsx existing modern routes: /assistant, /map, /discover, /compare, /alerts, /bookings (already registered earlier per earlier sessions).
