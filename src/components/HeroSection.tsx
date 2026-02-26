import { Button } from "@/components/ui/button";
import { Search, MapPin, CalendarDays, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type BookingType = "one-time" | "recurring";

const DAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  const [helpDate, setHelpDate] = useState(""); // YYYY-MM-DD
  const [helpTime, setHelpTime] = useState(""); // HH:MM

  const [bookingType, setBookingType] = useState<BookingType>("one-time");
  const [recurringDays, setRecurringDays] = useState<Record<string, boolean>>({
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
    sun: false,
  });

  const navigate = useNavigate();

  const selectedDaysCsv = useMemo(() => {
    return DAYS.filter((d) => recurringDays[d.key]).map((d) => d.key).join(",");
  }, [recurringDays]);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("location", location);

    // always send type so /search can act on it
    params.set("type", bookingType);

    // One-time: use exact date+time if provided
    // Recurring: still pass time, plus recurring days
    if (helpTime) params.set("time", helpTime);

    if (bookingType === "one-time") {
      if (helpDate && helpTime) params.set("when", `${helpDate}T${helpTime}`);
      if (helpDate && !helpTime) params.set("date", helpDate);
    } else {
      if (selectedDaysCsv) params.set("days", selectedDaysCsv);
      // optional anchor date if user picked one (useful for calendars later)
      if (helpDate) params.set("start_date", helpDate);
    }

    navigate(`/search?${params.toString()}`);
  };

  const handleTagClick = (tag: string) => {
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };

  const toggleDay = (key: string) => {
    setRecurringDays((prev) => ({ ...prev, [key]: !prev[key] }));
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
          {/* Headline (UPDATED) */}
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Find help for life&apos;s odds &amp; ends
          </h1>

          {/* Subheadline (UPDATED) */}
          <p
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Connect with providers that fill the gaps in your schedule
          </p>

          {/* Search Box */}
          <div
            className="bg-card rounded-2xl p-3 shadow-card-hover max-w-4xl mx-auto animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            {/* Main row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Service Search */}
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="What do you need help with?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground placeholder:text-sm"
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
                  className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground placeholder:text-sm"
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

              {/* Time */}
              <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
                <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="time"
                  value={helpTime}
                  onChange={(e) => setHelpTime(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-foreground"
                />
              </div>

              {/* Button */}
              <Button size="xl" className="shrink-0" onClick={handleSearch}>
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Search</span>
              </Button>
            </div>

            {/* One-time / Recurring */}
            <div className="mt-3 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="bookingType"
                    checked={bookingType === "one-time"}
                    onChange={() => setBookingType("one-time")}
                  />
                  One-time
                </label>

                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="bookingType"
                    checked={bookingType === "recurring"}
                    onChange={() => setBookingType("recurring")}
                  />
                  Recurring
                </label>
              </div>

              {/* Days of week (only if recurring) */}
              {bookingType === "recurring" && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {DAYS.map((d) => (
                    <label
                      key={d.key}
                      className="flex items-center gap-2 text-xs px-3 py-2 rounded-full bg-muted border border-border text-muted-foreground cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={!!recurringDays[d.key]}
                        onChange={() => toggleDay(d.key)}
                      />
                      {d.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Tags (UPDATED) */}
          <div
            className="flex flex-wrap justify-center gap-3 mt-8 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              "Babysitter",
              "Dog Walker",
              "House Cleaning",
              "Pet Sitting",
              "Grocery Shopping",
              "Tutoring",
              "School drop off",
              "School Pickup",
              "Handovers",
              "Appointments",
              "Afterschool activities",
              "Homework help",
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