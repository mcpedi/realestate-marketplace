import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Auth from "./pages/Auth";
import SellerDashboard from "./pages/SellerDashboard";
import SellerViewings from "./pages/SellerViewings";
import LeadsDashboard from "./pages/LeadsDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Favorites from "./pages/Favorites";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Testimonials from "./pages/Testimonials";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Profile from "./pages/Profile";
import Premium from "./pages/Premium";
import MapDiscovery from "./pages/MapDiscovery";
import SwipeDiscovery from "./pages/SwipeDiscovery";
import Compare from "./pages/Compare";
import Alerts from "./pages/Alerts";
import MyBookings from "./pages/MyBookings";
import AIAssistant from "./pages/AIAssistant";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/properties" component={Properties} />
      <Route path="/property/:id" component={PropertyDetail} />
      <Route path="/auth" component={Auth} />
      <Route path="/seller" component={SellerDashboard} />
      <Route path="/seller/viewings" component={SellerViewings} />
      <Route path="/leads" component={LeadsDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/faq" component={FAQ} />
      <Route path="/testimonials" component={Testimonials} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/profile" component={Profile} />
      <Route path="/premium" component={Premium} />
      <Route path="/map" component={MapDiscovery} />
      <Route path="/discover" component={SwipeDiscovery} />
      <Route path="/compare" component={Compare} />
      <Route path="/alerts" component={Alerts} />
      <Route path="/bookings" component={MyBookings} />
      <Route path="/assistant" component={AIAssistant} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
