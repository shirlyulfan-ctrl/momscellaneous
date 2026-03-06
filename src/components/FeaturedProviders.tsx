import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProviderCard from "./ProviderCard";
import { useNavigate } from "react-router-dom";

type ProviderRow = {
  id: string;
  location: string | null;
  neighborhood: string | null;
  hourly_rate: string | number | null;
  services: string[] | null;
  verified: boolean | null;
  available: boolean | null;
  user_id: string;
  created_at: string;
  is_example?: boolean | null;
};

type ProviderMediaRow = {
  id: string;
  provider_id: string;
  url: string;
  is_primary: boolean | null;
  media_type: string | null;
};

const FeaturedProviders = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [avatarByProviderId, setAvatarByProviderId] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProviders = async () => {
      const { data, error } = await supabase
        .from("provider_profiles")
        .select("id, location, neighborhood, hourly_rate, services, verified, available, user_id, created_at, is_example")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("Failed to load providers", error);
        return;
      }

      const rows = (data ?? []) as ProviderRow[];
      setProviders(rows);

      const ids = rows.map((r) => r.id);
      if (ids.length === 0) return;

      // Fetch primary photo for all shown providers (single query)
      const { data: media, error: mediaErr } = await supabase
        .from("provider_media")
        .select("id,provider_id,url,is_primary,media_type")
        .in("provider_id", ids)
        .eq("is_primary", true);

      if (mediaErr) {
        console.error("Failed to load provider_media for avatars", mediaErr);
        return;
      }

      const map: Record<string, string> = {};
      (media ?? []).forEach((m: ProviderMediaRow) => {
        // Prefer primary photo, ignore videos for avatar
        if (m.media_type === "photo" && m.url && !map[m.provider_id]) {
          map[m.provider_id] = m.url;
        }
      });

      setAvatarByProviderId(map);
    };

    loadProviders();
  }, []);

  return (
    <section id="providers" className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider, index) => (
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
                isExample={!!provider.is_example}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProviders;