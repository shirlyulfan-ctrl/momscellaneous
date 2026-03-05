import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProviderCard from "./ProviderCard";
import { useNavigate } from "react-router-dom";

const FeaturedProviders = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<any[]>([]);
  const [avatarByProviderId, setAvatarByProviderId] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProviders = async () => {
      const { data, error } = await supabase
        .from("provider_profiles")
        .select("id, location, neighborhood, hourly_rate, services, verified, available, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("Failed to load providers", error);
        return;
      }

      const rows = data ?? [];
      setProviders(rows);

      const ids = rows.map((r: any) => r.id).filter(Boolean);
      if (ids.length) {
        const { data: media, error: mediaErr } = await supabase
          .from("provider_media")
          .select("provider_id,url")
          .in("provider_id", ids)
          .eq("is_primary", true)
          .eq("media_type", "photo");

        if (mediaErr) {
          console.error("Failed to load featured avatars", mediaErr);
          setAvatarByProviderId({});
        } else {
          const map: Record<string, string> = {};
          for (const m of media ?? []) {
            if (m?.provider_id && m?.url) map[m.provider_id] = m.url;
          }
          setAvatarByProviderId(map);
        }
      } else {
        setAvatarByProviderId({});
      }
    };

    loadProviders();
  }, []);

  return (
    <section id="providers" className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider: any, index: number) => (
            <div
              key={provider.id}
              className="animate-fade-in cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate(`/providers/${provider.id}`)}
            >
              <ProviderCard
                name={`Helper in ${provider.location ?? "your area"}`}
                avatar={avatarByProviderId[provider.id] ?? "/avatar-placeholder.png"}
                rating={5}
                reviews={0}
                location={[provider.neighborhood, provider.location].filter(Boolean).join(", ") || "Local"}
                hourlyRate={Number(provider.hourly_rate ?? 0)}
                services={provider.services ?? []}
                verified={!!provider.verified}
                available={!!provider.available}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProviders;