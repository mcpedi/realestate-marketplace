import { FormEvent, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polygon, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

type Property = {
  id: number;
  title: string;
  location: string;
  type: "House" | "Apartment" | "Land";
  listingType: "sale" | "rent";
  price: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  seller: string;
  verified: boolean;
  latitude: number;
  longitude: number;
  neighborhood: "Migori Town" | "Rongo" | "Suna West";
  commuteMinutes: number;
};

const properties: Property[] = [
  { id: 1, title: "Greenview Family Home", location: "Migori, Kenya", type: "House", listingType: "sale", price: 8_500_000, bedrooms: 4, bathrooms: 3, description: "A bright, secure family home with generous outdoor space and easy access to local amenities.", seller: "Achieng Homes", verified: true, latitude: -1.0636, longitude: 34.4731, neighborhood: "Migori Town", commuteMinutes: 12 },
  { id: 2, title: "Rongo Modern Apartment", location: "Rongo, Migori", type: "Apartment", listingType: "rent", price: 28_000, bedrooms: 2, bathrooms: 2, description: "A well-finished two-bedroom apartment with reliable water, parking, and a quiet neighborhood setting.", seller: "Rongo Living", verified: true, latitude: -0.7567, longitude: 34.5964, neighborhood: "Rongo", commuteMinutes: 18 },
  { id: 3, title: "Lakeview Development Land", location: "Suna West, Migori", type: "Land", listingType: "sale", price: 3_200_000, bedrooms: 0, bathrooms: 0, description: "A level parcel with road access, suitable for a private home, small development, or long-term investment.", seller: "Lake Region Lands", verified: false, latitude: -1.0922, longitude: 34.4548, neighborhood: "Suna West", commuteMinutes: 24 },
];

function formatPrice(property: Property) {
  const amount = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(property.price);
  return `KSh ${amount}${property.listingType === "rent" ? " / month" : ""}`;
}

function Header() {
  return <header className="site-header"><a className="brand" href="/" aria-label="Nyumba 360 home"><span className="brand-mark">N</span><span>Nyumba <strong>360</strong></span></a><nav aria-label="Primary navigation"><a href="#properties">Explore</a><a href="/map">Map search</a><a href="#how-it-works">How it works</a><a href="#sell">List a property</a></nav><button className="outline-button" type="button">Sign in</button></header>;
}

const neighborhoods: Record<Property["neighborhood"], [number, number][]> = {
  "Migori Town": [[-1.045, 34.45], [-1.045, 34.50], [-1.085, 34.50], [-1.085, 34.45]],
  Rongo: [[-0.735, 34.575], [-0.735, 34.62], [-0.78, 34.62], [-0.78, 34.575]],
  "Suna West": [[-1.075, 34.43], [-1.075, 34.48], [-1.115, 34.48], [-1.115, 34.43]],
};

const amenities = [
  { id: "schools", label: "Schools", position: [-1.057, 34.478] as [number, number] },
  { id: "hospitals", label: "Healthcare", position: [-1.073, 34.466] as [number, number] },
  { id: "markets", label: "Markets", position: [-1.06, 34.49] as [number, number] },
];

function ClusteredMarkers({ properties }: { properties: Property[] }) {
  const map = useMap();
  useEffect(() => {
    const cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 42 });
    properties.forEach((property) => {
      const marker = L.marker([property.latitude, property.longitude], {
        icon: L.divIcon({ className: "property-pin", html: `<span>${property.id}</span>`, iconSize: [32, 32], iconAnchor: [16, 16] }),
      });
      marker.bindPopup(`<strong>${property.title}</strong><br />${formatPrice(property)}<br /><a href="/property/${property.id}">View details →</a>`);
      cluster.addLayer(marker);
    });
    map.addLayer(cluster);
    return () => { map.removeLayer(cluster); };
  }, [map, properties]);
  return null;
}

function MapPage() {
  const [query, setQuery] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("all");
  const [commute, setCommute] = useState(30);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const filteredProperties = useMemo(() => properties.filter((property) => `${property.title} ${property.location} ${property.type}`.toLowerCase().includes(query.toLowerCase()) && (selectedNeighborhood === "all" || property.neighborhood === selectedNeighborhood) && property.commuteMinutes <= commute), [query, selectedNeighborhood, commute]);
  const toggleAmenity = (id: string) => setSelectedAmenities((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const averagePrice = filteredProperties.length ? filteredProperties.reduce((sum, property) => sum + property.price, 0) / filteredProperties.length : 0;
  return <><a className="skip-link" href="#map-content">Skip to content</a><Header /><main className="map-page" id="map-content"><div className="map-heading"><div><p className="eyebrow">Explore by location</p><h1>Find your place on the map.</h1><p className="muted">Live OpenStreetMap tiles, clustered listings, and neighborhood context for Migori County.</p></div><a className="outline-button" href="/">← List view</a></div><div className="map-layout"><aside className="map-filters" aria-label="Map filters"><label htmlFor="map-search">Search area or listing</label><input id="map-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Migori or Rongo" /><label htmlFor="neighborhood">Neighborhood</label><select id="neighborhood" value={selectedNeighborhood} onChange={(event) => setSelectedNeighborhood(event.target.value)}><option value="all">All neighborhoods</option>{Object.keys(neighborhoods).map((name) => <option key={name}>{name}</option>)}</select><label htmlFor="commute">Commute time to town: <strong>{commute} min</strong></label><input id="commute" type="range" min="10" max="30" step="5" value={commute} onChange={(event) => setCommute(Number(event.target.value))} /><fieldset><legend>Nearby amenities</legend>{amenities.map((amenity) => <label className="checkbox-label" key={amenity.id}><input type="checkbox" checked={selectedAmenities.includes(amenity.id)} onChange={() => toggleAmenity(amenity.id)} />{amenity.label}</label>)}</fieldset><label className="checkbox-label"><input type="checkbox" checked={showBoundaries} onChange={(event) => setShowBoundaries(event.target.checked)} />Show neighborhood boundaries</label><div className="map-result-summary"><strong>{filteredProperties.length} listings found</strong><span>Average price: {averagePrice ? `KSh ${Math.round(averagePrice).toLocaleString("en-KE")}` : "—"}</span></div><div className="trend-card"><p className="eyebrow">12-month price trend</p><div className="trend-bars" aria-label="Neighborhood price trends">{Object.entries({ "Migori Town": 78, Rongo: 54, "Suna West": 66 }).map(([name, value]) => <div key={name}><span>{name}</span><i style={{ width: `${value}%` }} /><small>{value > 70 ? "+8.4%" : value > 60 ? "+5.9%" : "+3.2%"}</small></div>)}</div></div></aside><section className="map-stage" aria-label="Interactive property map"><MapContainer center={[-1.02, 34.51]} zoom={10} scrollWheelZoom className="leaflet-map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><ClusteredMarkers properties={filteredProperties} />{showBoundaries && Object.entries(neighborhoods).map(([name, polygon]) => <Polygon key={name} positions={polygon} pathOptions={{ color: name === selectedNeighborhood ? "#d65b47" : "#18824c", fillOpacity: .08, weight: 2 }}><Popup>{name} neighborhood boundary</Popup></Polygon>)}{selectedAmenities.map((id) => { const amenity = amenities.find((item) => item.id === id); return amenity ? <CircleMarker key={id} center={amenity.position} radius={9} pathOptions={{ color: "#d65b47", fillColor: "#ffba68", fillOpacity: .9 }}><Popup>{amenity.label} nearby</Popup></CircleMarker> : null; })}</MapContainer><div className="map-legend"><span><i className="legend-pin" /> Listings cluster as you zoom</span><span><i className="legend-boundary" /> Neighborhood boundary</span></div></section></div></main></>;
}

function PropertyCard({ property, favorite, compared, onFavorite, onCompare }: { property: Property; favorite: boolean; compared: boolean; onFavorite: () => void; onCompare: () => void }) {
  return <article className="property-card"><div className={`property-image image-${property.id}`} aria-label={`${property.type} listing image`} role="img"><span className="listing-badge">For {property.listingType === "sale" ? "sale" : "rent"}</span><button className={`favorite-button ${favorite ? "is-favorite" : ""}`} aria-label={`${favorite ? "Remove" : "Save"} ${property.title}`} aria-pressed={favorite} onClick={onFavorite} type="button">{favorite ? "♥" : "♡"}</button></div><div className="property-card-content"><div className="card-title-row"><div><p className="eyebrow">{property.type}</p><h3>{property.title}</h3></div>{property.verified ? <span className="verified-badge" title="Seller identity reviewed">✓ Verified</span> : <span className="unverified-badge">New seller</span>}</div><p className="muted">{property.location}</p><div className="property-meta">{property.bedrooms > 0 && <span>{property.bedrooms} beds</span>}{property.bathrooms > 0 && <span>{property.bathrooms} baths</span>}<span>{property.seller}</span></div><strong className="price">{formatPrice(property)}</strong><div className="card-actions"><a className="text-link" href={`/property/${property.id}`}>View details →</a><button className="compare-button" aria-pressed={compared} onClick={onCompare} type="button">{compared ? "Compared" : "Compare"}</button></div></div></article>;
}

function FilterBar({ type, setType, listingType, setListingType, sort, setSort }: { type: string; setType: (value: string) => void; listingType: string; setListingType: (value: string) => void; sort: string; setSort: (value: string) => void }) {
  return <div className="filter-bar" aria-label="Property filters"><label>Type<select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option><option>House</option><option>Apartment</option><option>Land</option></select></label><label>Listing<select value={listingType} onChange={(event) => setListingType(event.target.value)}><option value="all">Sale or rent</option><option value="sale">For sale</option><option value="rent">For rent</option></select></label><label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div>;
}

function ComparisonTray({ selected, onRemove }: { selected: Property[]; onRemove: (id: number) => void }) {
  if (!selected.length) return null;
  return <aside className="comparison-tray" aria-label="Property comparison"><strong>Compare properties ({selected.length}/2)</strong><div className="comparison-items">{selected.map((property) => <span key={property.id}>{property.title}<button onClick={() => onRemove(property.id)} aria-label={`Remove ${property.title} from comparison`} type="button">×</button></span>)}</div>{selected.length === 2 && <div className="comparison-table"><div><b>Price</b>{selected.map((property) => <span key={property.id}>{formatPrice(property)}</span>)}</div><div><b>Type</b>{selected.map((property) => <span key={property.id}>{property.type}</span>)}</div><div><b>Trust</b>{selected.map((property) => <span key={property.id}>{property.verified ? "Verified seller" : "Seller review pending"}</span>)}</div></div>}</aside>;
}

function InquiryForm({ property, onClose }: { property: Property; onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSubmitted(true); };
  return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="inquiry-title"><button className="modal-close" onClick={onClose} aria-label="Close inquiry form" type="button">×</button>{submitted ? <div className="success-message"><p className="eyebrow">Request received</p><h2>We&apos;ll help you take the next step.</h2><p>A viewing request for <strong>{property.title}</strong> has been saved. A seller will follow up shortly.</p><button className="primary-button" onClick={onClose} type="button">Done</button></div> : <form onSubmit={submit}><p className="eyebrow">Viewing request</p><h2 id="inquiry-title">{property.title}</h2><label htmlFor="inquiry-name">Your name</label><input id="inquiry-name" required name="name" autoComplete="name" /><label htmlFor="inquiry-contact">Phone or email</label><input id="inquiry-contact" required name="contact" autoComplete="email" /><label htmlFor="inquiry-message">Message</label><textarea id="inquiry-message" name="message" defaultValue={`I would like to view ${property.title}.`} rows={4} /><button className="primary-button full-width" type="submit">Request a viewing</button></form>}</section></div>;
}

function HomePage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [listingType, setListingType] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [favorites, setFavorites] = useState<number[]>(() => JSON.parse(localStorage.getItem("nyumba-favorites") ?? "[]") as number[]);
  const [comparison, setComparison] = useState<number[]>([]);
  const [alertSaved, setAlertSaved] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  useEffect(() => { localStorage.setItem("nyumba-favorites", JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { document.title = query ? `Search “${query}” | Nyumba 360` : "Nyumba 360 — Find your next place"; const description = document.querySelector('meta[name="description"]'); description?.setAttribute("content", "Find verified homes, land, and commercial property in Kenya with Nyumba 360."); }, [query]);
  const visibleProperties = useMemo(() => { const filtered = properties.filter((property) => `${property.title} ${property.location} ${property.type}`.toLowerCase().includes(query.toLowerCase()) && (type === "all" || property.type === type) && (listingType === "all" || property.listingType === listingType)); return [...filtered].sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : a.id - b.id); }, [query, type, listingType, sort]);
  const toggleFavorite = (id: number) => setFavorites((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const toggleComparison = (id: number) => setComparison((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < 2 ? [...current, id] : current);
  const selected = properties.filter((property) => comparison.includes(property.id));
  return <><a className="skip-link" href="#main-content">Skip to content</a><Header /><main id="main-content"><section className="hero"><div className="hero-copy"><p className="eyebrow light">Kenya&apos;s property edit</p><h1>Make room<br /><span>for more.</span></h1><p className="hero-lede">Find verified homes, land, and commercial spaces with a smarter, more human way to find your next chapter.</p><div className="hero-actions"><a className="primary-button" href="#properties">Explore properties</a><a className="secondary-button" href="#how-it-works">Find my fit</a></div></div><div className="search-panel"><p className="eyebrow">Start your search</p><h2>Where do you want to live?</h2><label htmlFor="property-search">Location, property type, or keyword</label><input id="property-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “2 bedroom in Migori”" /><button className="primary-button full-width" onClick={() => document.getElementById("properties")?.scrollIntoView()} type="button">Search homes</button><button className="alert-link" onClick={() => setShowAlertForm(true)} type="button">Save this search for alerts</button><p className="search-note">Browse trusted listings from verified sellers.</p></div></section><section className="content-section" id="properties"><div className="section-heading"><div><p className="eyebrow">Curated for you</p><h2>Featured properties</h2></div><span className="muted">{visibleProperties.length} listings · {favorites.length} saved</span></div><FilterBar {...{ type, setType, listingType, setListingType, sort, setSort }} />{visibleProperties.length > 0 ? <div className="property-grid">{visibleProperties.map((property) => <PropertyCard key={property.id} property={property} favorite={favorites.includes(property.id)} compared={comparison.includes(property.id)} onFavorite={() => toggleFavorite(property.id)} onCompare={() => toggleComparison(property.id)} />)}</div> : <p className="empty-state">No listings match those filters. Try broadening your search.</p>}</section><section className="trust-section" id="how-it-works"><div><p className="eyebrow">A better way to move</p><h2>Search with confidence.</h2></div><div className="trust-grid"><div><strong>01</strong><h3>Discover</h3><p>Search homes and land using the details that matter to you.</p></div><div><strong>02</strong><h3>Compare</h3><p>Review transparent pricing, amenities, and verified listing information.</p></div><div><strong>03</strong><h3>Move forward</h3><p>Connect with the seller and book a viewing when you are ready.</p></div></div></section></main><footer id="sell"><span>© 2026 Nyumba 360</span><span>Find a place that moves you forward.</span></footer><ComparisonTray selected={selected} onRemove={toggleComparison} />{showAlertForm && <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="alert-title"><button className="modal-close" onClick={() => setShowAlertForm(false)} aria-label="Close alert form" type="button">×</button>{alertSaved ? <div className="success-message"><p className="eyebrow">Alert saved</p><h2>We&apos;ll watch for new matches.</h2><p>You&apos;ll be notified when a property matches your current search.</p></div> : <form onSubmit={(event) => { event.preventDefault(); setAlertSaved(true); }}><p className="eyebrow">Property alert</p><h2 id="alert-title">Never miss a match.</h2><label htmlFor="alert-email">Email address</label><input id="alert-email" required type="email" autoComplete="email" placeholder="you@example.com" /><button className="primary-button full-width" type="submit">Create alert</button></form>}</section></div>}</>;
}

function PropertyDetailPage({ property }: { property: Property }) {
  const [showInquiry, setShowInquiry] = useState(false);
  useEffect(() => { document.title = `${property.title} | Nyumba 360`; }, [property.title]);
  return <><a className="skip-link" href="#main-content">Skip to content</a><Header /><main className="detail-page" id="main-content"><a className="back-link" href="/">← Back to properties</a><div className={`detail-image image-${property.id}`} role="img" aria-label={`${property.type} listing image`}><span className="listing-badge">{property.verified ? "✓ Verified listing" : "Seller review pending"}</span></div><div className="detail-content"><div><p className="eyebrow">{property.type} · {property.location}</p><h1>{property.title}</h1><p className="detail-description">{property.description}</p><div className="seller-panel"><div className="seller-avatar">{property.seller[0]}</div><div><strong>{property.seller}</strong><p className="muted">{property.verified ? "Identity reviewed by Nyumba 360" : "New seller — review in progress"}</p></div></div><div className="property-meta large"><span>{property.bedrooms || "Land"} {property.bedrooms ? "bedrooms" : ""}</span><span>{property.bathrooms ? `${property.bathrooms} bathrooms` : "Road access"}</span><span>{property.verified ? "Verified seller" : "Seller review pending"}</span></div></div><aside className="contact-card"><p className="muted">Listed for {property.listingType}</p><strong className="price">{formatPrice(property)}</strong><button className="primary-button full-width" onClick={() => setShowInquiry(true)} type="button">Schedule a viewing</button><button className="outline-button full-width" onClick={() => setShowInquiry(true)} type="button">Contact seller</button></aside></div></main>{showInquiry && <InquiryForm property={property} onClose={() => setShowInquiry(false)} />}</>;
}

export function App() {
  if (window.location.pathname === "/map") return <MapPage />;
  const match = window.location.pathname.match(/^\/property\/(\d+)$/);
  const property = match ? properties.find((item) => item.id === Number(match[1])) : undefined;
  return property ? <PropertyDetailPage property={property} /> : <HomePage />;
}
