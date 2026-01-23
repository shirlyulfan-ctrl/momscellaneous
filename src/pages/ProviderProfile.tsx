import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/supabase/client";
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

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [provider, setProvider] = useState<ProviderProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  const displayName = provider?.location
    ? `Helper in ${provider.location}`
    : "Helper";

  const displayLocation =
    [provider?.neighborhood, provider?.location].filter(Boolean).join(", ") ||
    "Local";

  const hourly = Number(provider?.hourly_rate ?? 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Top bar */}
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
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Profile not found
              </h1>
              <p className="text-muted-foreground mb-6">
                This helper may have been removed or the link is invalid.
              </p>
              <Button onClick={() => navigate("/search")}>Go to Search</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main profile */}
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
                      {provider.verified && (
                        <BadgeCheck className="w-6 h-6 text-secondary" />
                      )}
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
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    About
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {provider.bio?.trim()
                      ? provider.bio
                      : "This helper hasn’t added a bio yet."}
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
                    <div className="text-sm text-muted-foreground">
                      Experience
                    </div>
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

              {/* Booking sidebar */}
              <aside className="bg-card rounded-2xl p-6 border border-border shadow-card h-fit">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Book this helper
                </h2>
                <p className="text-muted-foreground mb-6">
                  Booking flow is next — for now this can route to a “request”
                  form or open a modal.
                </p>

                <Button className="w-full" onClick={() => alert("Booking flow next!")}>
                  Book Now
                </Button>

                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => navigate("/search")}
                >
                  View More Helpers
                </Button>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
