import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProviderCard from "./ProviderCard";
import { useNavigate } from "react-router-dom";

const FeaturedProviders = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<any[]>([]);

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

      setProviders(data ?? []);
    };

    loadProviders();
  }, []);

  return (
    <section className="py-24">
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
              avatar="/avatar-placeholder.png"
              rating={5}
              reviews={0}
              location={[provider.neighborhood, provider.location].filter(Boolean).join(", ") || "Local"}
              hourlyRate={Number(provider
