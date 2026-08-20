import { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { CalendarDays, Clock, Video, Home as HomeIcon, CheckCircle2, XCircle, Users, ArrowLeft, Phone, MessageSquare } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
  completed: "bg-blue-50 text-blue-700",
};

export default function SellerViewings() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const bookingsQuery = trpc.modern.sellerBookings.useQuery(undefined, { enabled: isAuthenticated });
  const bookings = (bookingsQuery.data ?? []) as Array<{
    id: number;
    propertyId: number;
    buyerId: number;
    scheduledAt: number;
    type: string;
    status: string;
    notes: string | null;
  }>;

  const confirmMutation = trpc.modern.sellerBookingUpdate.useMutation({
    onSuccess: () => {
      utils.modern.sellerBookings.invalidate();
      toast.success("Booking updated");
    },
    onError: () => toast.error("Could not update the booking"),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-16 text-center">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Viewing Requests
          </h1>
          <p className="text-muted-foreground mb-6">Sign in as a seller to manage viewing requests.</p>
          <Button onClick={() => startLogin()}>Sign in</Button>
        </main>
        <Footer />
      </div>
    );
  }

  const pending = bookings.filter((b) => b.status === "pending").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const completed = bookings.filter((b) => b.status === "completed").length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/seller" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Seller Dashboard
          </Link>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Viewing Requests
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage physical and virtual viewing requests for your listings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-3.5 h-3.5" /> Total Requests
            </div>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-amber-600 text-xs mb-1">
              <Clock className="w-3.5 h-3.5" /> Pending
            </div>
            <div className="text-2xl font-bold">{pending}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 text-xs mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
            </div>
            <div className="text-2xl font-bold">{confirmed}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-blue-600 text-xs mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            </div>
            <div className="text-2xl font-bold">{completed}</div>
          </Card>
        </div>

        {bookingsQuery.isLoading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {!bookingsQuery.isLoading && bookings.length === 0 && (
          <Card className="p-10 text-center space-y-4">
            <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground" />
            <div className="text-lg font-semibold">No viewing requests yet</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              When buyers book a viewing on one of your listings, the request will appear here.
            </p>
          </Card>
        )}

        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} confirmMutation={confirmMutation} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function BookingRow({
  booking,
  confirmMutation,
}: {
  booking: {
    id: number;
    propertyId: number;
    buyerId: number;
    scheduledAt: number;
    type: string;
    status: string;
    notes: string | null;
  };
  confirmMutation: ReturnType<typeof trpc.modern.sellerBookingUpdate.useMutation>;
}) {
  const propertyQuery = trpc.property.byId.useQuery(booking.propertyId);
  const buyerQuery = trpc.modern.buyerInfo.useQuery(
    { buyerId: booking.buyerId },
    { enabled: !!booking.buyerId },
  );
  const p = propertyQuery.data as
    | { id: number; title: string; location: string; photos?: { url: string }[] }
    | undefined;
  const buyer = buyerQuery.data;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[booking.status] ?? "bg-gray-50 text-gray-600"}`}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </div>
        <div className="flex items-center gap-1 text-sm font-medium min-w-0">
          {booking.type === "virtual" ? (
            <Video className="w-4 h-4 flex-shrink-0 text-[oklch(0.45_0.18_260)]" />
          ) : (
            <HomeIcon className="w-4 h-4 flex-shrink-0 text-[oklch(0.45_0.18_260)]" />
          )}
          {booking.type === "virtual" ? "Virtual viewing" : "Physical viewing"}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
          <Clock className="w-3.5 h-3.5" />
          {new Date(booking.scheduledAt).toLocaleString()}
        </div>
        <div className="ml-auto text-sm min-w-0">
          {p ? (
            <Link href={`/property/${p.id}`} className="font-medium hover:underline">
              {p.title}
            </Link>
          ) : (
            <span className="text-muted-foreground">Property #{booking.propertyId}</span>
          )}
          {p && <span className="text-muted-foreground"> — {p.location}</span>}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-4">
        {buyer ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">{buyer.name || "Buyer"}</span>
            {buyer.phone && (
              <a href={`tel:+${buyer.phone.replace(/[^0-9]/g, "")}`} className="flex items-center gap-1 text-[oklch(0.45_0.18_260)] hover:underline">
                <Phone className="w-3.5 h-3.5" /> {buyer.phone}
              </a>
            )}
            <a
              href={`https://wa.me/${(buyer.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Hi ${buyer.name || "there"}, this is regarding your viewing request for ${p?.title ?? "a property"} on ${new Date(booking.scheduledAt).toLocaleString()}.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-green-600 hover:underline"
            >
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Buyer ID: {booking.buyerId}</span>
        )}
        {booking.notes && <span className="text-sm text-muted-foreground ml-auto">Notes: {booking.notes}</span>}
        {booking.status === "pending" && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              disabled={confirmMutation.isPending}
              onClick={() => confirmMutation.mutate({ id: booking.id, status: "confirmed" })}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={confirmMutation.isPending}
              onClick={() => confirmMutation.mutate({ id: booking.id, status: "cancelled" })}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
            </Button>
          </div>
        )}
        {booking.status === "confirmed" && (
          <Button
            size="sm"
            variant="outline"
            disabled={confirmMutation.isPending}
            onClick={() => confirmMutation.mutate({ id: booking.id, status: "completed" })}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Completed
          </Button>
        )}
      </div>
    </Card>
  );
}
