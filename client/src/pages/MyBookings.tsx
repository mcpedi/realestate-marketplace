import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { CalendarDays, Clock, Video, Home as HomeIcon, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
  completed: "bg-blue-50 text-blue-700",
};

export default function MyBookings() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [propertyId, setPropertyId] = useState("");

  const bookingsQuery = trpc.modern.myBookings.useQuery(undefined, { enabled: isAuthenticated });
  const bookings = (bookingsQuery.data ?? []) as Array<{
    id: number;
    propertyId: number;
    scheduledAt: number;
    type: string;
    status: string;
    notes: string | null;
  }>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-16 text-center">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            My Viewings
          </h1>
          <p className="text-muted-foreground mb-6">Sign in to book and manage property viewings.</p>
          <Button onClick={() => startLogin()}>Sign in</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              My Viewings
            </h1>
            <p className="text-sm text-muted-foreground">
              Physical and virtual property viewing bookings
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <CalendarDays className="w-4 h-4 mr-1" /> Book a viewing
          </Button>
        </div>

        {bookingsQuery.isLoading && (
          <div className="flex justify-center py-12"><Spinner /></div>
        )}

        {!bookingsQuery.isLoading && bookings.length === 0 && (
          <Card className="p-10 text-center space-y-4">
            <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground" />
            <div className="text-lg font-semibold">No viewings booked yet</div>
            <p className="text-sm text-muted-foreground">
              Open a property's details page and click "Book Viewing" to schedule a physical or virtual tour.
            </p>
            <Button asChild>
              <Link href="/properties">Browse properties</Link>
            </Button>
          </Card>
        )}

        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} utils={utils} />
          ))}
        </div>

        <BookingDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          prefillPropertyId={propertyId ? Number(propertyId) : undefined}
        />
      </main>
      <Footer />
    </div>
  );
}

function BookingRow({
  booking,
  utils,
}: {
  booking: { id: number; propertyId: number; scheduledAt: number; type: string; status: string; notes: string | null };
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [expanded, setExpanded] = useState(false);
  const propertyQuery = trpc.property.byId.useQuery(booking.propertyId);
  const updateMutation = trpc.modern.bookingUpdate.useMutation({
    onSuccess: () => {
      utils.modern.myBookings.invalidate();
      toast.success("Booking updated");
    },
    onError: () => toast.error("Could not update the booking"),
  });
  const p = propertyQuery.data as
    | { id: number; title: string; location: string; photos?: { url: string }[] }
    | undefined;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[booking.status] ?? "bg-gray-50 text-gray-600"}`}
        >
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
        <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
          <Clock className="w-3.5 h-3.5" />
          {new Date(booking.scheduledAt).toLocaleString()}
        </div>
        <button
          className="text-xs text-[oklch(0.45_0.18_260)] hover:underline flex-shrink-0"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Hide" : "Details"}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border text-sm space-y-2">
          {p ? (
            <Link href={`/property/${p.id}`} className="font-medium hover:underline">
              {p.title} — {p.location}
            </Link>
          ) : (
            <div>Property #{booking.propertyId}</div>
          )}
          {booking.notes && <div className="text-muted-foreground">Notes: {booking.notes}</div>}
          {booking.status === "pending" && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: booking.id, status: "cancelled" })}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function BookingDialog({
  open,
  onClose,
  prefillPropertyId,
}: {
  open: boolean;
  onClose: () => void;
  prefillPropertyId?: number;
}) {
  const utils = trpc.useUtils();
  const [propertyId, setPropertyId] = useState<string>(prefillPropertyId ? String(prefillPropertyId) : "");
  const [type, setType] = useState<"virtual" | "physical">("physical");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = trpc.modern.bookingCreate.useMutation({
    onSuccess: () => {
      utils.modern.myBookings.invalidate();
      toast.success("Viewing booked! Check My Viewings for details.");
      onClose();
      setPropertyId("");
      setDate("");
      setTime("");
      setNotes("");
    },
    onError: () => toast.error("Could not book the viewing. Please check the property ID."),
  });

  const submit = () => {
    const id = Number(propertyId);
    if (!Number.isFinite(id) || id <= 0) {
      toast.error("Please enter a valid property ID.");
      return;
    }
    if (!date || !time) {
      toast.error("Please pick a date and time.");
      return;
    }
    const scheduledAt = new Date(`${date}T${time}`).getTime();
    if (scheduledAt < Date.now()) {
      toast.error("Please choose a date and time in the future.");
      return;
    }
    createMutation.mutate({ propertyId: id, scheduledAt, type, notes: notes || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book a Viewing</DialogTitle>
          <DialogDescription>
            Schedule a physical or virtual tour of a property. You can find the property ID on its details page.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <Input placeholder="Property ID (e.g. 12)" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Time</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Viewing type</label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as "virtual" | "physical")}
            >
              <option value="physical">Physical (in person)</option>
              <option value="virtual">Virtual (video call)</option>
            </select>
          </div>
          <Textarea
            placeholder="Optional notes for the seller (e.g. preferred time window)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button className="w-full" disabled={createMutation.isPending} onClick={submit}>
            {createMutation.isPending ? <Spinner /> : "Confirm booking"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
