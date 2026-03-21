import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  BadgeCheck,
  Clock,
  ArrowLeft,
  Ban,
  Star,
  User,
  Loader2,
} from "lucide-react";

import { TERMS_VERSION } from "@/lib/legalVersions";
import BackgroundCheckDisclaimerDialog from "@/components/BackgroundCheckDisclaimerDialog";

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
  is_example?: boolean | null;
  is_published?: boolean | null;
};

type ProviderMediaRow = {
  id: string;
  provider_id: string;
  url: string;
  is_primary: boolean | null;
  media_type: string | null;
};

type ProviderReviewRow = {
  id: string;
  provider_id: string;
  reviewer_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
};

type ProviderReviewSummaryRow = {
  provider_id: string;
  avg_rating: number | string | null;
  review_count: number | string | null;
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
  return date.getDay();
}

function formatReviewDate(value: string) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState<ProviderProfileRow | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("/avatar-placeholder.png");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [reviews, setReviews] = useState<ProviderReviewRow[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [hasReviewed, setHasReviewed] = useState(false);

  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

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

  // Terms acceptance / versioning (customer)
  const [acceptedTermsVersion, setAcceptedTermsVersion] = useState<string | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const needsTermsReaccept = acceptedTermsVersion !== TERMS_VERSION;

  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const loadProviderPage = async () => {
    if (!id) return;

    setLoading(true);
    setNotFound(false);
    setReviewError(null);
    setReviewSuccess(null);

    const { data: authData } = await supabase.auth.getUser();
    const authedUserId = authData?.user?.id ?? null;
    setCurrentUserId(authedUserId);

    const { data, error } = await supabase
      .from("provider_profiles")
      .select(
        "id,user_id,bio,location,neighborhood,hourly_rate,services,verified,available,years_experience,created_at,is_example,is_published"
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      console.error("ProviderProfile load error:", error);
      setProvider(null);
      setNotFound(true);
      setAvatarUrl("/avatar-placeholder.png");
      setReviews([]);
      setAvgRating(0);
      setReviewCount(0);
      setHasReviewed(false);
      setLoading(false);
      return;
    }

    const row = data as ProviderProfileRow;

    if (!row.is_published && !row.is_example) {
      setProvider(null);
      setNotFound(true);
      setAvatarUrl("/avatar-placeholder.png");
      setReviews([]);
      setAvgRating(0);
      setReviewCount(0);
      setHasReviewed(false);
      setLoading(false);
      return;
    }

    setProvider(row);

    const [mediaRes, reviewsRes, summaryRes] = await Promise.all([
      supabase
        .from("provider_media")
        .select("id,provider_id,url,is_primary,media_type")
        .eq("provider_id", row.id)
        .eq("is_primary", true)
        .limit(1),
      supabase
        .from("provider_reviews")
        .select("id,provider_id,reviewer_id,rating,review_text,created_at")
        .eq("provider_id", row.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("provider_review_summary")
        .select("provider_id,avg_rating,review_count")
        .eq("provider_id", row.id)
        .maybeSingle(),
    ]);

    if (mediaRes.error) {
      console.error("Provider avatar load error:", mediaRes.error);
      setAvatarUrl("/avatar-placeholder.png");
    } else {
      const m = (mediaRes.data?.[0] as ProviderMediaRow | undefined) ?? undefined;
      if (m?.media_type === "photo" && m.url) setAvatarUrl(m.url);
      else setAvatarUrl("/avatar-placeholder.png");
    }

    if (reviewsRes.error) {
      console.error("Provider reviews load error:", reviewsRes.error);
      setReviews([]);
      setHasReviewed(false);
    } else {
      const reviewRows = (reviewsRes.data ?? []) as ProviderReviewRow[];
      setReviews(reviewRows);
      setHasReviewed(!!authedUserId && reviewRows.some((r) => r.reviewer_id === authedUserId));
    }

    if (summaryRes.error) {
      console.error("Provider review summary load error:", summaryRes.error);
      setAvgRating(0);
      setReviewCount(0);
    } else {
      const summary = summaryRes.data as ProviderReviewSummaryRow | null;
      setAvgRating(Number(summary?.avg_rating ?? 0));
      setReviewCount(Number(summary?.review_count ?? 0));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProviderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load current user's accepted terms version (if logged in)
  useEffect(() => {
    const loadTermsAcceptance = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) {
        setAcceptedTermsVersion(null);
        setAgreeTerms(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("accepted_terms_version")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Load accepted_terms_version error:", error);
        return;
      }

      const v = (data as any)?.accepted_terms_version ?? null;
      setAcceptedTermsVersion(v);
      setAgreeTerms(v === TERMS_VERSION);
    };

    loadTermsAcceptance();
  }, []);

  const isExample = !!provider?.is_example;

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

  const ensureDisclaimerSeen = () => {
    const key = "mm_disclaimer_seen";
    const seen = localStorage.getItem(key) === "1";
    if (!seen) {
      setShowDisclaimer(true);
      localStorage.setItem(key, "1");
      return false;
    }
    return true;
  };

  const validateReview = () => {
    if (!currentUserId) return "Please log in to leave a review.";
    if (!provider) return "Provider not found.";
    if (isExample) return "Reviews are disabled for example listings.";
    if (hasReviewed) return "You have already reviewed this provider.";
    if (selectedRating < 1 || selectedRating > 5) return "Please select a star rating.";
    if (reviewText.trim().length < 10) return "Please write at least 10 characters.";
    if (reviewText.trim().length > 2000) return "Review is too long.";
    return null;
  };

  const handleSubmitReview = async () => {
    setReviewError(null);
    setReviewSuccess(null);

    const validationError = validateReview();
    if (validationError) {
      setReviewError(validationError);
      return;
    }

    if (!provider || !currentUserId) return;

    setReviewSubmitting(true);

    try {
      const { data: existing, error: existingErr } = await supabase
        .from("provider_reviews")
        .select("id")
        .eq("provider_id", provider.id)
        .eq("reviewer_id", currentUserId)
        .maybeSingle();

      if (existingErr) {
        console.error("Existing review check error:", existingErr);
        setReviewError("Could not verify your review status. Please try again.");
        setReviewSubmitting(false);
        return;
      }

      if (existing) {
        setHasReviewed(true);
        setReviewError("You have already reviewed this provider.");
        setReviewSubmitting(false);
        return;
      }

      const { error } = await supabase.from("provider_reviews").insert({
        provider_id: provider.id,
        reviewer_id: currentUserId,
        rating: selectedRating,
        review_text: reviewText.trim(),
      });

      if (error) {
        console.error("Review insert error:", error);
        setReviewError("Failed to submit review. Please try again.");
        setReviewSubmitting(false);
        return;
      }

      setSelectedRating(0);
      setHoverRating(0);
      setReviewText("");
      setReviewSuccess("Review submitted successfully.");
      await loadProviderPage();
    } catch (e) {
      console.error(e);
      setReviewError("Something went wrong while submitting your review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleBookAndPay = async () => {
    setBookingError(null);

    if (isExample) {
      setBookingError("This is an Example listing. Booking is disabled.");
      return;
    }

    if (!ensureDisclaimerSeen()) return;
    if (!provider) return;

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    if (authErr || !userId) {
      setBookingError("Please log in to book and pay.");
      navigate("/auth");
      return;
    }

    const { data: prof, error: profLoadErr } = await supabase
      .from("profiles")
      .select("accepted_terms_version")
      .eq("user_id", userId)
      .maybeSingle();

    if (profLoadErr) {
      console.error("profiles load error:", profLoadErr);
      setBookingError("Could not verify Terms acceptance. Please try again.");
      return;
    }

    const currentAccepted = (prof as any)?.accepted_terms_version ?? null;
    setAcceptedTermsVersion(currentAccepted);

    const mismatch = currentAccepted !== TERMS_VERSION;

    if (mismatch && !agreeTerms) {
      setBookingError("Please agree to the Terms & Conditions to continue.");
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

      if (mismatch && agreeTerms) {
        const { error: profErr } = await supabase
          .from("profiles")
          .update({
            accepted_terms_at: new Date().toISOString(),
            accepted_terms_version: TERMS_VERSION,
          })
          .eq("user_id", userId);

        if (profErr) {
          console.error("profiles acceptance update error:", profErr);
          setBookingError("Could not save Terms acceptance. Please try again.");
          setBookingLoading(false);
          return;
        }

        setAcceptedTermsVersion(TERMS_VERSION);
      }

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
            start_time: startTime,
            end_time: endTime,
            starts_on: date,
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
          accepted_terms_at: new Date().toISOString(),
          accepted_terms_version: TERMS_VERSION,
        })
        .select("id")
        .single();

      if (bookingErr || !booking?.id) {
        console.error("bookings insert error:", bookingErr);
        setBookingError("Could not create booking. Please try again.");
        setBookingLoading(false);
        return;
      }

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

      <BackgroundCheckDisclaimerDialog open={showDisclaimer} onOpenChange={setShowDisclaimer} />

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
                This helper may have been removed, is not yet published, or the link is invalid.
              </p>
              <Button onClick={() => navigate("/search")}>Go to Search</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-card relative overflow-hidden">
                  {isExample && (
                    <div className="pointer-events-none absolute inset-0 z-10">
                      <div
                        className="absolute top-5 right-[-55px] rotate-12 border-2 border-foreground/60 text-foreground/70 rounded-md px-4 py-1 text-xs md:text-sm font-bold tracking-wider uppercase bg-background/60 backdrop-blur-sm shadow-sm"
                        style={{ letterSpacing: "0.18em" }}
                      >
                        Example listing
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-5">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-20 h-20 rounded-2xl object-cover border border-border"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{displayName}</h1>
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

                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-accent fill-accent" />
                          <span className="font-medium text-foreground">
                            {reviewCount > 0 ? avgRating.toFixed(1) : "New"}
                          </span>
                          <span className="text-sm">
                            {reviewCount > 0
                              ? `(${reviewCount} review${reviewCount === 1 ? "" : "s"})`
                              : "(No reviews yet)"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {(provider.services ?? []).length > 0 ? (
                          (provider.services ?? []).map((s) => (
                            <span
                              key={s}
                              className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                            General help
                          </span>
                        )}
                      </div>

                      {isExample && (
                        <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-muted/60 p-4">
                          <Ban className="w-5 h-5 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="font-semibold text-foreground">Example listing</div>
                            <div className="text-sm text-muted-foreground">
                              This profile is shown as a demo. Booking is disabled.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {provider.bio?.trim() ? provider.bio : "This helper hasn’t added a bio yet."}
                    </p>
                  </div>
                </div>

                <aside className="bg-card rounded-2xl p-6 border border-border shadow-card h-fit">
                  <h2 className="text-lg font-semibold text-foreground mb-1">Book this helper</h2>
                  <p className="text-muted-foreground mb-4">
                    Choose a time, see the total (incl. 7.5% fee), then pay securely.
                  </p>

                  {isExample && (
                    <div className="mb-4 rounded-xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Booking disabled:</span>{" "}
                      this is an Example listing.
                    </div>
                  )}

                  <div className={`space-y-3 ${isExample ? "opacity-60 pointer-events-none select-none" : ""}`}>
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

                      {pricing?.error && <div className="text-sm text-destructive mt-2">{pricing.error}</div>}
                    </div>

                    {needsTermsReaccept && (
                      <label className="flex items-start gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-1"
                        />
                        <span className="text-muted-foreground">
                          I agree to the{" "}
                          <Link to="/terms" className="underline text-foreground">
                            Terms & Conditions
                          </Link>{" "}
                          (v{TERMS_VERSION}).
                        </span>
                      </label>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Reminder: Momscellaneous does not perform background checks.{" "}
                      <button type="button" className="underline" onClick={() => setShowDisclaimer(true)}>
                        Read safety notice
                      </button>
                      .
                    </div>

                    {bookingError && <div className="text-sm text-destructive">{bookingError}</div>}
                  </div>

                  <Button
                    className="w-full mt-3"
                    onClick={handleBookAndPay}
                    disabled={
                      bookingLoading ||
                      !!pricing?.error ||
                      isExample ||
                      (needsTermsReaccept && !agreeTerms)
                    }
                  >
                    {isExample ? "Booking Disabled" : bookingLoading ? "Redirecting to payment…" : "Book & Pay"}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => navigate("/search")}
                    disabled={bookingLoading}
                  >
                    View More Helpers
                  </Button>
                </aside>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-card">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Reviews</h2>

                  {!isExample && (
                    <div className="mb-8 rounded-2xl border border-border p-5 bg-background">
                      <h3 className="text-lg font-semibold text-foreground mb-4">Leave a review</h3>

                      {!currentUserId && (
                        <p className="text-sm text-muted-foreground mb-4">
                          Please log in to leave a review.
                        </p>
                      )}

                      {hasReviewed && (
                        <p className="text-sm text-muted-foreground mb-4">
                          You have already reviewed this provider.
                        </p>
                      )}

                      <div className="mb-4">
                        <p className="text-sm font-medium text-foreground mb-2">Your rating</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const active = (hoverRating || selectedRating) >= star;
                            return (
                              <button
                                key={star}
                                type="button"
                                className="p-1"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setSelectedRating(star)}
                                disabled={!currentUserId || hasReviewed || reviewSubmitting}
                                aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
                              >
                                <Star
                                  className={`w-7 h-7 ${
                                    active ? "text-accent fill-accent" : "text-muted-foreground"
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-foreground mb-2">Your review</p>
                        <Textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Write a helpful review about your experience..."
                          className="min-h-[120px]"
                          disabled={!currentUserId || hasReviewed || reviewSubmitting}
                          maxLength={2000}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Minimum 10 characters. {reviewText.trim().length}/2000
                        </p>
                      </div>

                      {reviewError && <p className="text-sm text-destructive mb-3">{reviewError}</p>}
                      {reviewSuccess && <p className="text-sm text-secondary mb-3">{reviewSuccess}</p>}

                      <Button
                        onClick={handleSubmitReview}
                        disabled={!currentUserId || hasReviewed || reviewSubmitting}
                      >
                        {reviewSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting…
                          </>
                        ) : (
                          "Submit Review"
                        )}
                      </Button>
                    </div>
                  )}

                  {isExample && (
                    <div className="mb-8 rounded-2xl border border-border p-5 bg-background">
                      <p className="text-sm text-muted-foreground">
                        Reviews are disabled for example listings.
                      </p>
                    </div>
                  )}

                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-2xl border border-border p-5 bg-background"
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">Community member</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatReviewDate(review.created_at)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "text-accent fill-accent"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {review.review_text?.trim() || "No written review provided."}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No reviews yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}