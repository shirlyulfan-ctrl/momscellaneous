import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function BookingCancel() {
  const [params] = useSearchParams();
  const bookingId = params.get("booking") || "";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-2xl p-10 border border-border">
            <h1 className="text-3xl font-bold text-foreground">Payment canceled</h1>
            <p className="text-muted-foreground mt-2">
              No worries — you can try again anytime.
            </p>

            {bookingId ? (
              <p className="text-muted-foreground mt-4">Booking: {bookingId}</p>
            ) : null}

            <div className="mt-8 flex gap-3">
              <Button asChild>
                <Link to="/search">Back to search</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
