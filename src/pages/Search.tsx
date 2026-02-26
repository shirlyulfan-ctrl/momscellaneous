// src/pages/Search.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProviderCard from "@/components/ProviderCard";
import SearchFilters from "@/components/SearchFilters";

import { categories, neighborhoods } from "@/data/providers";
import { supabase } from "@/integrations/supabase/client";

import { Search, MapPin, SlidersHorizontal, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

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

type ProviderAvailabilitySlot = {
  provider_id: string;
  start_at: string;
  end_at: string;
  timezone?: string | null;
};

type SearchType = "one-time" | "recurring";

const DAY_KEY_TO_DOW: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function addMinutes(d: Date, minutes: number) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() + minutes);
  return x;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function timeToMinutes(t: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Incoming query params (from HeroSection and/or manual edits)
  const queryType = (searchParams.get("type") as SearchType | null) ?? "one-time";
  const whenParam = searchParams.get("when"); // YYYY-MM-DDTHH:MM (home page)
  const timeParam = searchParams.get("time"); // HH:MM (home page recurring)
  const daysParam = searchParams.get("days"); // mon,tue,wed (home page recurring)

  const initialQuery = searchParams.get("q") || "";
  const initialLocation = searchParams.get("location") || "";
  const initialCategory = searchParams.get("category") || "all";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);

  // Window-based availability search (existing UX on /search)
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("All Neighborhoods");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);

  const [rows, setRows] = useState<ProviderProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Availability matches
  const [availabilityProviderIds, setAvailabilityProviderIds] = useState<Set<string> | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // If one-time "when" exists, auto-fill start/end (end defaults +2h just for the UI)
  useEffect(() => {
    if (!whenParam) return;
    const start = new Date(whenParam);
    if (!Number.isFinite(start.getTime())) return;

    const end = addMinutes(start, 120);
    setStartDateTime(toDatetimeLocalValue(start));
    setEndDateTime(toDatetimeLocalValue(end));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whenParam]);

  const hasWindow = !!startDateTime && !!endDateTime;

  const isWindowInvalid = useMemo(() => {
    if (!hasWindow) return false;
    const startMs = new Date(startDateTime).getTime();
    const endMs = new Date(endDateTime).getTime();
    return Number.isFinite(startMs) && Number.isFinite(endMs) && endMs < startMs;
  }, [hasWindow, startDateTime, endDateTime]);

  // Load providers
  useEffect(() => {
    const loadProviders = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("provider_profiles")
        .select(
          "id,user_id,bio,location,neighborhood,hourly_rate,services,verified,available,years_experience,created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load provider_profiles:", error);
        setRows([]);
      } else {
        setRows((data ?? []) as ProviderProfileRow[]);
      }

      setLoading(false);
    };

    loadProviders();
  }, []);

  // Availability filtering:
  // A) If queryType=recurring and time+days exist, match providers who have a slot containing that time
  //    for EACH selected weekday (within next 56 days).
  // B) Else if start+end exists, do window coverage match.
  useEffect(() => {
    const fetchAvailabilityMatches = async () => {
      setAvailabilityError(null);

      const isRecurringQuery = queryType === "recurring" && !!timeParam && !!daysParam;

      // --- Recurring mode (from Home page) ---
      if (isRecurringQuery) {
        const requestedMinutes = timeToMinutes(timeParam!);
        if (requestedMinutes === null) {
          setAvailabilityProviderIds(new Set());
          setAvailabilityError("Invalid time format for recurring search.");
          return;
        }

        const selectedDow = daysParam!
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
          .map((k) => DAY_KEY_TO_DOW[k])
          .filter((n) => typeof n === "number") as number[];

        if (selectedDow.length === 0) {
          setAvailabilityProviderIds(new Set());
          setAvailabilityError("Pick at least one weekday for recurring search.");
          return;
        }

        setAvailabilityLoading(true);

        const today = startOfDay(new Date());
        const limit = addDays(today, 56);

        const { data, error } = await supabase
          .from("provider_availability")
          .select("provider_id,start_at,end_at,timezone")
          .gte("start_at", today.toISOString())
          .lte("start_at", limit.toISOString());

        if (error) {
          console.error("Failed to load provider_availability (recurring):", error);
          setAvailabilityProviderIds(new Set());
          setAvailabilityError("Couldn’t check recurring availability yet.");
          setAvailabilityLoading(false);
          return;
        }

        const slots = (data ?? []) as ProviderAvailabilitySlot[];

        // For each provider, track which selected weekdays they cover at the requested time.
        const providerToWeekdayOK = new Map<string, Set<number>>();

        for (const s of slots) {
          const utcStart = new Date(s.start_at);
          const utcEnd = new Date(s.end_at);
          if (!Number.isFinite(utcStart.getTime()) || !Number.isFinite(utcEnd.getTime())) continue;

          const tz = s.timezone || "America/New_York";

          // Convert UTC -> provider local (important for correct weekday + clock time)
          const startLocal = new Date(utcStart.toLocaleString("en-US", { timeZone: tz }));
          const endLocal = new Date(utcEnd.toLocaleString("en-US", { timeZone: tz }));

          const dow = startLocal.getDay();
          if (!selectedDow.includes(dow)) continue;

          const stMin = startLocal.getHours() * 60 + startLocal.getMinutes();
          const enMin = endLocal.getHours() * 60 + endLocal.getMinutes();

          // Match if slot CONTAINS requested time (no fixed duration assumption)
          let contains = stMin <= requestedMinutes && requestedMinutes < enMin;

          // Support overnight slots (e.g., 23:00 -> 01:00)
          if (enMin < stMin) {
            contains = requestedMinutes >= stMin || requestedMinutes < enMin;
          }

          if (!contains) continue;

          const set = providerToWeekdayOK.get(s.provider_id) ?? new Set<number>();
          set.add(dow);
          providerToWeekdayOK.set(s.provider_id, set);
        }

        const matching = new Set<string>();
        for (const [providerId, okDays] of providerToWeekdayOK.entries()) {
          const all = selectedDow.every((d) => okDays.has(d));
          if (all) matching.add(providerId);
        }

        setAvailabilityProviderIds(matching);
        setAvailabilityLoading(false);
        return;
      }

      // --- Window mode (manual /search date-time inputs) ---
      if (!hasWindow) {
        setAvailabilityProviderIds(null);
        return;
      }

      if (isWindowInvalid) {
        setAvailabilityProviderIds(new Set());
        setAvailabilityError("End time must be after start time.");
        return;
      }

      const startISO = new Date(startDateTime).toISOString();
      const endISO = new Date(endDateTime).toISOString();

      setAvailabilityLoading(true);

      // Slot must fully cover the requested window
      const { data, error } = await supabase
        .from("provider_availability")
        .select("provider_id")
        .lte("start_at", startISO)
        .gte("end_at", endISO);

      if (error) {
        console.error("Failed to load provider_availability (window):", error);
        setAvailabilityProviderIds(new Set());
        setAvailabilityError("Couldn’t check availability yet.");
      } else {
        const ids = new Set((data as { provider_id: string }[] | null)?.map((r) => r.provider_id) ?? []);
        setAvailabilityProviderIds(ids);
      }

      setAvailabilityLoading(false);
    };

    fetchAvailabilityMatches();
  }, [queryType, timeParam, daysParam, hasWindow, isWindowInvalid, startDateTime, endDateTime]);

  // Filter + sort providers (client-side)
  const filteredProviders = useMemo(() => {
    let result = [...rows];

    const recurringActive = queryType === "recurring" && !!timeParam && !!daysParam;

    // Apply availability constraint
    if ((hasWindow || recurringActive) && availabilityProviderIds !== null) {
      const allowed = availabilityProviderIds ?? new Set<string>();
      result = result.filter((p) => allowed.has(p.id));
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => {
        const bio = (p.bio ?? "").toLowerCase();
        const loc = (p.location ?? "").toLowerCase();
        const nbh = (p.neighborhood ?? "").toLowerCase();
        const services = (p.services ?? []).map((s) => s.toLowerCase());
        return (
          bio.includes(q) ||
          loc.includes(q) ||
          nbh.includes(q) ||
          services.some((s) => s.includes(q))
        );
      });
    }

    // Location text
    if (location.trim()) {
      const loc = location.toLowerCase();
      result = result.filter((p) => {
        const l = (p.location ?? "").toLowerCase();
        const n = (p.neighborhood ?? "").toLowerCase();
        return l.includes(loc) || n.includes(loc);
      });
    }

    // Category (maps to services)
    if (selectedCategory !== "all") {
      const catLabel =
        (categories as any[]).find((c: any) => c.id === selectedCategory)?.label ?? "";
      const target1 = selectedCategory.toLowerCase();
      const target2 = catLabel.toLowerCase();

      result = result.filter((p) => {
        const services = (p.services ?? []).map((s) => s.toLowerCase());
        return (
          services.some((s) => s.includes(target1)) ||
          (target2 ? services.some((s) => s.includes(target2)) : false)
        );
      });
    }

    // Neighborhood
    if (selectedNeighborhood !== "All Neighborhoods") {
      result = result.filter((p) => (p.neighborhood ?? "") === selectedNeighborhood);
    }

    // Existing boolean availability toggle
    if (showAvailableOnly) {
      result = result.filter((p) => !!p.available);
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => Number(a.hourly_rate ?? 0) - Number(b.hourly_rate ?? 0));
        break;
      case "price-high":
        result.sort((a, b) => Number(b.hourly_rate ?? 0) - Number(a.hourly_rate ?? 0));
        break;
      // rating/reviews default: keep current order
      default:
        break;
    }

    return result;
  }, [
    rows,
    queryType,
    timeParam,
    daysParam,
    hasWindow,
    availabilityProviderIds,
    searchQuery,
    location,
    selectedCategory,
    selectedNeighborhood,
    showAvailableOnly,
    sortBy,
  ]);

  // Map to ProviderCard props
  const cardModels = useMemo(() => {
    return filteredProviders.map((p) => {
      const loc = [p.neighborhood, p.location].filter(Boolean).join(", ") || "Local";
      return {
        id: p.id,
        name: `Helper in ${p.location ?? "your area"}`,
        avatar: "/avatar-placeholder.png",
        rating: 5,
        reviews: 0,
        location: loc,
        hourlyRate: Number(p.hourly_rate ?? 0),
        services: p.services ?? [],
        verified: !!p.verified,
        available: !!p.available,
        bio: p.bio ?? "",
      };
    });
  }, [filteredProviders]);

  const showCountLoading = loading || availabilityLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-4">Find Local Helpers</h1>
            <p className="text-xl text-muted-foreground">
              Search for trusted providers in your neighborhood
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-card rounded-2xl p-6 shadow-card mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* What do you need */}
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="What do you need help with?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Location */}
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Start */}
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Start time</p>
                  <input
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-foreground"
                  />
                </div>
              </div>

              {/* End */}
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">End time</p>
                  <input
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>

              {(availabilityLoading || availabilityError) && (
                <div className="text-sm text-muted-foreground">
                  {availabilityLoading ? "Checking availability…" : availabilityError}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters */}
            <div className={`lg:block ${showFilters ? "block" : "hidden"}`}>
              <SearchFilters
                categories={categories as any}
                neighborhoods={neighborhoods as any}
                selectedCategory={selectedCategory}
                selectedNeighborhood={selectedNeighborhood}
                showAvailableOnly={showAvailableOnly}
                sortBy={sortBy}
                onCategoryChange={setSelectedCategory}
                onNeighborhoodChange={setSelectedNeighborhood}
                onAvailableChange={setShowAvailableOnly}
                onSortChange={setSortBy}
              />
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {showCountLoading ? "…" : cardModels.length} helpers found
                  {selectedCategory !== "all" && (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      in {(categories as any[]).find((c: any) => c.id === selectedCategory)?.label}
                    </span>
                  )}
                </h2>
              </div>

              {loading ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">Loading helpers…</p>
                </div>
              ) : availabilityLoading ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">Checking availability…</p>
                </div>
              ) : cardModels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cardModels.map((provider, index) => (
                    <div
                      key={`${provider.id}-${index}`}
                      onClick={() => navigate(`/providers/${provider.id}`)}
                      className="cursor-pointer"
                    >
                      <ProviderCard {...provider} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-2xl font-semibold text-foreground mb-4">No helpers found</h3>
                  <p className="text-muted-foreground text-lg mb-6">
                    Try adjusting your search or filters to find more providers in your area.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;