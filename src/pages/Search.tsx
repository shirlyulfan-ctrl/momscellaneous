import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProviderCard from "@/components/ProviderCard";
import SearchFilters from "@/components/SearchFilters";
import { providers, categories, neighborhoods } from "@/data/providers";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialLocation = searchParams.get("location") || "";
  const initialCategory = searchParams.get("category") || "all";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("All Neighborhoods");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);

  const filteredProviders = useMemo(() => {
    let result = [...providers];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (provider) =>
          provider.name.toLowerCase().includes(query) ||
          provider.services.some((s) => s.toLowerCase().includes(query)) ||
          provider.bio.toLowerCase().includes(query)
      );
    }

    // Filter by location
    if (location.trim()) {
      const loc = location.toLowerCase();
      result = result.filter(
        (provider) =>
          provider.location.toLowerCase().includes(loc) ||
          provider.neighborhood.toLowerCase().includes(loc)
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((provider) =>
        provider.categories.includes(selectedCategory)
      );
    }

    // Filter by neighborhood
    if (selectedNeighborhood !== "All Neighborhoods") {
      result = result.filter(
        (provider) => provider.neighborhood === selectedNeighborhood
      );
    }

    // Filter by availability
    if (showAvailableOnly) {
      result = result.filter((provider) => provider.available);
    }

    // Sort results
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "reviews":
        result.sort((a, b) => b.reviews - a.reviews);
        break;
      case "price-low":
        result.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case "price-high":
        result.sort((a, b) => b.hourlyRate - a.hourlyRate);
        break;
    }

    return result;
  }, [searchQuery, location, selectedCategory, selectedNeighborhood, showAvailableOnly, sortBy]);

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
                  <span className="font-semibold text-foreground">{filteredProviders.length}</span>{" "}
                  helpers found
                  {selectedCategory !== "all" && (
                    <span> in {categories.find((c) => c.id === selectedCategory)?.label}</span>
                  )}
                </p>
              </div>

              {/* Results Grid */}
              {filteredProviders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredProviders.map((provider, index) => (
                    <div
                      key={provider.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <ProviderCard {...provider} />
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
