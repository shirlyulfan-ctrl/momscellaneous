import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type BookingRow = {
  id: string;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  customer_total: number | null;
  provider_id: string;
};

export default function BookingSuccess() {
  const [params] = useSearchParams();
  const bookingId = params.get("booking") || "";
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!bookingId) {
        setError("Missing booking id.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("bookings")
        .select("id,status,start_at,end_at,customer_total,provider_id")
        .eq("id", bookingId)
        .single();

      if (error) {
        setError("Could not load booking.");
        setBooking(null);
      } else {
        setBooking(data as BookingRow);
      }
      setLoading(false);
    };

    load();
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-2xl p-10 border border-border">
            <h1 className="text-3xl font-bold text-foreground">Payment successful ✅</h1>
            <p className="text-muted-foreground mt-2">
              Thanks! Your booking has been received.
            </p>

            {loading ? (
              <div className="mt-6 text-muted-foreground">Loading booking…</div>
            ) : error ? (
              <div className="mt-6 text-destructive">{error}</div>
            ) : booking ? (
              <div className="mt-6 space-y-2 text-foreground">
                <div><span className="text-muted-foreground">Booking ID:</span> {booking.id}</div>
                <div><span className="text-muted-foreground">Status:</span> {booking.status ?? "unknown"}</div>
                <div>
                  <span className="text-muted-foreground">Total:</span>{" "}
                  ${Number(booking.customer_total ?? 0).toFixed(2)}
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link to="/search">Find more helpers</Link>
              </Button>
              {booking?.provider_id ? (
                <Button variant="outline" asChild>
                  <Link to={`/providers/${booking.provider_id}`}>Back to provider</Link>
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link to="/">Home</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
