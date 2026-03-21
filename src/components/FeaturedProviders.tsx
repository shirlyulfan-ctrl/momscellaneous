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
  is_published?: boolean | null;
};

type ProviderMediaRow = {
  id: string;
  provider_id: string;
  url: string;
  is_primary: boolean | null;
  media_type: string | null;
};

type ProviderReviewSummaryRow = {
  provider_id: string;
  avg_rating: number | string | null;
  review_count: number | string | null;
};

const FeaturedProviders = () => {
  const navigate = useNavigate();

  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [avatarByProviderId, setAvatarByProviderId] = useState<Record<string, string>>({});
  const [reviewSummaryByProviderId, setReviewSummaryByProviderId] = useState<
    Record<string, { avg_rating: number; review_count: number }>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProviders = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("provider_profiles")
        .select(
          "id, location, neighborhood, hourly_rate, services, verified, available, user_id, created_at, is_example, is_published"
        )
        .or("is_published.eq.true,is_example.eq.true")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("Failed to load providers", error);
        setProviders([]);
        setAvatarByProviderId({});
        setReviewSummaryByProviderId({});
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as ProviderRow[];
      setProviders(rows);

      const ids = rows.map((r) => r.id);

      if (ids.length === 0) {
        setAvatarByProviderId({});
        setReviewSummaryByProviderId({});
        setLoading(false);
        return;
      }

      const [{ data: media, error: mediaErr }, { data: reviewsData, error: reviewsErr }] =
        await Promise.all([
          supabase
            .from("provider_media")
            .select("id,provider_id,url,is_primary,media_type")
            .in("provider_id", ids)
            .eq("is_primary", true),
          supabase
            .from("provider_review_summary")
            .select("provider_id, avg_rating, review_count")
            .in("provider_id", ids),
        ]);

      if (mediaErr) {
        console.error("Failed to load provider_media for avatars", mediaErr);
        setAvatarByProviderId({});
      } else {
        const mediaMap: Record<string, string> = {};
        (media ?? []).forEach((m: ProviderMediaRow) => {
          if (m.media_type === "photo" && m.url && !mediaMap[m.provider_id]) {
            mediaMap[m.provider_id] = m.url;
          }
        });
        setAvatarByProviderId(mediaMap);
      }

      if (reviewsErr) {
        console.error("Failed to load review summary", reviewsErr);
        setReviewSummaryByProviderId({});
      } else {
        const reviewMap: Record<string, { avg_rating: number; review_count: number }> = {};
        (reviewsData ?? []).forEach((r: ProviderReviewSummaryRow) => {
          reviewMap[r.provider_id] = {
            avg_rating: Number(r.avg_rating ?? 0),
            review_count: Number(r.review_count ?? 0),
          };
        });
        setReviewSummaryByProviderId(reviewMap);
      }

      setLoading(false);
    };

    loadProviders();
  }, []);

  if (loading) {
    return (
      <section id="providers" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">Loading featured helpers…</div>
        </div>
      </section>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  return (
    <section id="providers" className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider, index) => {
            const review = reviewSummaryByProviderId[provider.id];

            return (
              <div
                key={provider.id}
                className="animate-fade-in cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(`/providers/${provider.id}`)}
              >
                <ProviderCard
                  id={provider.id}
                  name={`Helper in ${provider.location ?? "your area"}`}
                  avatar={avatarByProviderId[provider.id] ?? "/avatar-placeholder.png"}
                  rating={review?.avg_rating ?? 0}
                  reviews={review?.review_count ?? 0}
                  location={[provider.neighborhood, provider.location].filter(Boolean).join(", ") || "Local"}
                  hourlyRate={Number(provider.hourly_rate ?? 0)}
                  services={provider.services ?? []}
                  verified={!!provider.verified}
                  available={!!provider.available}
                  isExample={!!provider.is_example}
                  onViewProfile={() => navigate(`/providers/${provider.id}`)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProviders;