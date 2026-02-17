import { Button } from "@/components/ui/button";
import { Search, MapPin, CalendarDays, Clock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  // NEW
  const [helpDate, setHelpDate] = useState(""); // YYYY-MM-DD
  const [helpTime, setHelpTime] = useState(""); // HH:MM

  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("location", location);

    // NEW: pass a single "when" datetime (Search page can expand this)
    if (helpDate && helpTime) params.set("when", `${helpDate}T${helpTime}`);

    navigate(`/search?${params.toString()}`);
  };

  const handleTagClick = (tag: string) => {
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-16 overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-60"
        style={{ background: "var(--hero-gradient)" }}
      />

      {/* Decorative circles */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "1s" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border mb-8 animate-fade-in shadow-card">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">
              Trusted by 10,000+ families
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Find Local Help for{" "}
            <span className="text-primary">Life&apos;s Everyday Needs</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Connect with trusted local providers for childcare, pet sitting, home
            tasks, and all those odd jobs that don&apos;t fit a regular
            schedule.
          </p>

          {/* Search Box */}
          <div
            className="bg-card rounded-2xl p-3 shadow-card-hover max-w-3xl mx-auto animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Service Search */}
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
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
                <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Your location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Date */}
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <CalendarDays className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="date"
                  value={helpDate}
                  onChange={(e) => setHelpDate(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-foreground"
                />
              </div>

              {/* Time + Button */}
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                  <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
                  <input
                    type="time"
                    value={helpTime}
                    onChange={(e) => setHelpTime(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-foreground"
                  />
                </div>

                <Button size="xl" className="shrink-0" onClick={handleSearch}>
                  <Search className="w-5 h-5" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Tags */}
          <div
            className="flex flex-wrap justify-center gap-3 mt-8 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              "Babysitter",
              "Dog Walker",
              "House Cleaning",
              "Handyman",
              "Pet Sitting",
              "Grocery Shopping",
              "Tutoring",
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-all duration-200"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
