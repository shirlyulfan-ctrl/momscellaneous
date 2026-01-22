import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProviderCard from "@/components/ProviderCard";
import SearchFilters from "@/components/SearchFilters";
import { categories, neighborhoods } from "@/data/providers";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialLocation = searchParams.get("location") || "";
  const initialCategory = searchParams.get("category") || "all";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedNeighborhood, setSelectedNeighborhood] =
    useState("All Neighborhoods");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);

  const [rows, setRows] = useState<ProviderProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 1) Load providers from Supabase
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

  // 2) Filter + sort (client-side, keeps your current UX)
  const filteredProviders = useMemo(() => {
    let result = [...rows];

    // Filter by search query (search bio/services/location/neighborhood)
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

    // Filter by location box (matches location or neighborhood)
    if (location.trim()) {
      const loc = location.toLowerCase();
      result = result.filter((p) => {
        const l = (p.location ?? "").toLowerCase();
        const n = (p.neighborhood ?? "").toLowerCase();
        return l.includes(loc) || n.includes(loc);
      });
    }

    // Filter by category
    // Your DB currently only has `services` (array). We’ll interpret “category”
    // as matching either the category id or its label inside services text.
    if (selectedCategory !== "all") {
      const catLabel =
        categories.find((c: any) => c.id === selectedCategory)?.label ?? "";
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

    // Filter by neighborhood dropdown
    if (selectedNeighborhood !== "All Neighborhoods") {
      result = result.filter((p) => (p.neighborhood ?? "") === selectedNeighborhood);
    }

    // Filter by availability
    if (showAvailableOnly) {
      result = result.filter((p) => !!p.available);
    }

    // Sort results
    // DB doesn’t have rating/reviews yet; we’ll keep stable ordering for those.
    switch (sortBy) {
      case "rating":
      case "reviews":
        // keep created_at order (already ordered desc when fetched)
        break;
      case "price-low":
        result.sort(
          (a, b) => Number(a.hourly_rate ?? 0) - Number(b.hourly_rate ?? 0)
        );
        break;
      case "price-high":
        result.sort(
          (a, b) => Number(b.hourly_rate ?? 0) - Number(a.hourly_rate ?? 0)
        );
        break;
    }

    return result;
  }, [
    rows,
    searchQuery,
    location,
    selectedCategory,
    selectedNeighborhood,
    showAvailableOnly,
    sortBy,
  ]);

  // 3) Map DB rows -> ProviderCard props shape
  const cardModels = useMemo(() => {
    return filteredProviders.map((p) => {
      const loc = [p.neighborhood, p.location].filter(Boolean).join(", ") || "Local";

      return {
        id: p.id,
        name: `Helper in ${p.location ?? "your area"}`, // until you add display_name
        avatar: "/avatar-placeholder.png", // add this file to /public
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Find Local Helpers
            </h1>
            <p className="text-muted-foreground">
              Search for trusted providers in your neighborhood
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="What do you need help with?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex-1 flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Your neighborhood"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <Button
                variant="outline"
                className="md:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-5 h-5 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <aside className={`lg:w-72 shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
              <SearchFilters
                categories={categories}
                neighborhoods={neighborhoods}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedNeighborhood={selectedNeighborhood}
                setSelectedNeighborhood={setSelectedNeighborhood}
                showAvailableOnly={showAvailableOnly}
                setShowAvailableOnly={setShowAvailableOnly}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            </aside>

            {/* Results */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {loading ? "…" : cardModels.length}
                  </span>{" "}
                  helpers found
                  {selectedCategory !== "all" && (
                    <span> in {categories.find((c: any) => c.id === selectedCategory)?.label}</span>
                  )}
                </p>
              </div>

              {/* Results Grid */}
              {loading ? (
                <div className="text-muted-foreground">Loading helpers…</div>
              ) : cardModels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cardModels.map((provider, index) => (
                    <div
                      key={provider.id}
                      className="animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => navigate(`/providers/${provider.id}`)}
                    >
                      <ProviderCard
                        name={provider.name}
                        avatar={provider.avatar}
                        rating={provider.rating}
                        reviews={provider.reviews}
                        location={provider.location}
                        hourlyRate={provider.hourlyRate}
                        services={provider.services}
                        verified={provider.verified}
                        available={provider.available}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card rounded-2xl border border-border">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No helpers found
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
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