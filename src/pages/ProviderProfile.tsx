import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MapPin, BadgeCheck, Clock, ArrowLeft } from "lucide-react";

type ProviderProfileRow = {
  id: string;
  user_id: string;
  bio: string | null;
  location: string | null;
  neighborhood: string | null;
  hourly_rate: string | number | null;
  services: string[] | null;
  verified: boolean | null;
  available: boolean | null;
  years_experience: number | null;
  created_at: string;
};

const FEE_RATE = 0.075;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function combineLocalDateTime(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
}

function hoursBetween(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function weekday0Sunday(date: Date) {
  return date.getDay(); // 0=Sun..6=Sat
}

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState<ProviderProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Booking form state
  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [recurring, setRecurring] = useState<"none" | "daily" | "weekly">("none");

  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      setLoading(true);
      setNotFound(false);

      const { data, error } = await supabase
        .from("provider_profiles")
        .select(
          "id,user_id,bio,location,neighborhood,hourly_rate,services,verified,available,years_experience,created_at"
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("ProviderProfile load error:", error);
        setProvider(null);
        setNotFound(true);
      } else {
        setProvider(data as ProviderProfileRow);
      }

      setLoading(false);
    };

    load();
  }, [id]);

  const displayName = provider?.location ? `Helper in ${provider.location}` : "Helper";
  const displayLocation =
    [provider?.neighborhood, provider?.location].filter(Boolean).join(", ") || "Local";

  const hourly = Number(provider?.hourly_rate ?? 0);

  const pricing = useMemo(() => {
    setBookingError(null);

    if (!provider) return null;
    if (!date || !startTime || !endTime) return null;

    const start = combineLocalDateTime(date, startTime);
    const end = combineLocalDateTime(date, endTime);

    const hrs = hoursBetween(start, end);

    if (!isFinite(hrs) || hrs <= 0) {
      return {
        start,
        end,
        hours: 0,
        providerBase: 0,
        fee: 0,
        total: 0,
        error: "End time must be after start time.",
      };
    }

    const providerBase = round2(hourly * hrs);
    const total = round2(providerBase * (1 + FEE_RATE));
    const fee = round2(total - providerBase);

    return { start, end, hours: hrs, providerBase, fee, total, error: null as string | null };
  }, [provider, date, startTime, endTime, hourly]);

  const handleBookAndPay = async () => {
    setBookingError(null);

    if (!provider) return;

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    if (authErr || !userId) {
      setBookingError("Please log in to book and pay.");
      navigate("/auth");
      return;
    }

    if (!pricing) {
      setBookingError("Please select a valid date and time.");
      return;
    }
    if (pricing.error) {
      setBookingError(pricing.error);
      return;
    }
    if (pricing.total <= 0) {
      setBookingError("Total must be greater than $0.00.");
      return;
    }

    setBookingLoading(true);

    try {
      const start = pricing.start;
      const end = pricing.end;

      // 1) If recurring, create booking_series first
      let seriesId: string | null = null;

      if (recurring !== "none") {
        const byweekday = recurring === "weekly" ? [weekday0Sunday(start)] : null;

        const { data: series, error: seriesErr } = await supabase
          .from("booking_series")
          .insert({
            customer_user_id: userId,
            provider_id: provider.id,
            frequency: recurring,
            interval: 1,
            byweekday,
            start_time: startTime, // "HH:MM"
            end_time: endTime,     // "HH:MM"
            starts_on: date,       // "YYYY-MM-DD"
            ends_on: null,
            max_occurrences: null,
            provider_rate: hourly,
            fee_rate: FEE_RATE,
            status: "active",
          })
          .select("id")
          .single();

        if (seriesErr || !series?.id) {
          console.error("booking_series insert error:", seriesErr);
          setBookingError("Could not create recurring series. Please try again.");
          setBookingLoading(false);
          return;
        }

        seriesId = series.id;
      }

      // 2) Create a booking row for the FIRST occurrence
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          customer_user_id: userId,
          provider_id: provider.id,
          series_id: seriesId,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          status: "pending_payment",

          provider_rate: hourly,
          fee_rate: FEE_RATE,

          customer_total: pricing.total,
          platform_fee: pricing.fee,
          provider_payout: pricing.providerBase,
        })
        .select("id")
        .single();

      if (bookingErr || !booking?.id) {
        console.error("bookings insert error:", bookingErr);
        setBookingError("Could not create booking. Please try again.");
        setBookingLoading(false);
        return;
      }

      // 3) Create Stripe Checkout session via Netlify function
      const resp = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: booking.id }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Checkout session error:", txt);
        setBookingError("Payment setup failed. Please try again.");
        setBookingLoading(false);
        return;
      }

      const json = await resp.json();
      const url = json?.url as string | undefined;

      if (!url) {
        setBookingError("Payment setup failed (missing checkout URL).");
        setBookingLoading(false);
        return;
      }

      window.location.href = url;
    } catch (e) {
      console.error(e);
      setBookingError("Something went wrong. Please try again.");
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {loading ? (
            <div className="text-muted-foreground">Loading profile…</div>
          ) : notFound || !provider ? (
            <div className="bg-card rounded-2xl p-10 border border-border text-center">
              <h1 className="text-2xl font-bold text-foreground mb-2">Profile not found</h1>
              <p className="text-muted-foreground mb-6">
                This helper may have been removed or the link is invalid.
              </p>
              <Button onClick={() => navigate("/search")}>Go to Search</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-card">
                <div className="flex items-start gap-5">
                  <img
                    src="/avatar-placeholder.png"
                    alt={displayName}
                    className="w-20 h-20 rounded-2xl object-cover border border-border"
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        {displayName}
                      </h1>
                      {provider.verified && <BadgeCheck className="w-6 h-6 text-secondary" />}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{displayLocation}</span>
                      </div>

                      {provider.available && (
                        <div className="flex items-center gap-2 text-secondary font-medium">
                          <Clock className="w-4 h-4" />
                          <span>Available now</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(provider.services ?? []).map((s) => (
                        <span
                          key={s}
                          className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {provider.bio?.trim() ? provider.bio : "This helper hasn’t added a bio yet."}
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-muted rounded-2xl p-4">
                    <div className="text-sm text-muted-foreground">Rate</div>
                    <div className="text-xl font-bold text-foreground">
                      ${hourly.toFixed(2)}
                      <span className="text-sm text-muted-foreground">/hr</span>
                    </div>
                  </div>

                  <div className="bg-muted rounded-2xl p-4">
                    <div className="text-sm text-muted-foreground">Experience</div>
                    <div className="text-xl font-bold text-foreground">
                      {provider.years_experience ?? 0} yrs
                    </div>
                  </div>

                  <div className="bg-muted rounded-2xl p-4">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="text-xl font-bold text-foreground">
                      {provider.available ? "Available" : "Unavailable"}
                    </div>
                  </div>
                </div>
              </div>

              <aside className="bg-card rounded-2xl p-6 border border-border shadow-card h-fit">
                <h2 className="text-lg font-semibold text-foreground mb-1">Book this helper</h2>
                <p className="text-muted-foreground mb-4">
                  Choose a time, see the total (incl. 7.5% fee), then pay securely.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground">Start time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground">End time</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">Recurring</label>
                    <select
                      value={recurring}
                      onChange={(e) => setRecurring(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground outline-none"
                    >
                      <option value="none">One-time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly (same day)</option>
                    </select>
                  </div>

                  <div className="bg-muted rounded-2xl p-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Duration</span>
                      <span>{pricing?.hours ? `${pricing.hours.toFixed(2)} hr` : "—"}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                      <span>Provider base</span>
                      <span>${pricing ? pricing.providerBase.toFixed(2) : "0.00"}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                      <span>Platform fee (7.5%)</span>
                      <span>${pricing ? pricing.fee.toFixed(2) : "0.00"}</span>
                    </div>

                    <div className="border-t border-border my-3" />

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Total due today</span>
                      <span className="font-bold text-foreground">
                        ${pricing ? pricing.total.toFixed(2) : "0.00"}
                      </span>
                    </div>

                    {pricing?.error && (
                      <div className="text-sm text-destructive mt-2">{pricing.error}</div>
                    )}
                  </div>

                  {bookingError && <div className="text-sm text-destructive">{bookingError}</div>}

                  <Button
                    className="w-full"
                    onClick={handleBookAndPay}
                    disabled={bookingLoading || !!pricing?.error}
                  >
                    {bookingLoading ? "Redirecting to payment…" : "Book & Pay"}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/search")}
                    disabled={bookingLoading}
                  >
                    View More Helpers
                  </Button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
