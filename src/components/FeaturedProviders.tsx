import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import ProviderCard from "./ProviderCard";
import { useNavigate } from "react-router-dom";

const FeaturedProviders = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<any[]>([]);

  useEffect(() => {
    const loadProviders = async () => {
      const { data, error } = await supabase
        .from("provider_profiles")
        .select(`
          id,
          location,
          neighborhood,
          hourly_rate,
          services,
          verified,
          available,
          user_id
        `)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("Failed to load providers", error);
        return;
      }

      setProviders(data ?? []);
    };

    loadProviders();
  }, []);

  return (
    <section className="py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            name={`Helper in ${provider.location}`}   // temporary display name
            avatar="/avatar-placeholder.png"
            rating={5}
            reviews={0}
            location={`${provider.neighborhood}, ${provider.location}`}
            hourlyRate={Number(provider.hourly_rate)}
            services={provider.services ?? []}
            verified={provider.verified}
            available={provider.available}
            onViewProfile={() => navigate(`/providers/${provider.id}`)}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedProviders;
