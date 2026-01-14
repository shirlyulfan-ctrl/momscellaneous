import ProviderCard from "./ProviderCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { providers } from "@/data/providers";

const FeaturedProviders = () => {
  const navigate = useNavigate();
  const featuredProviders = providers.slice(0, 6);

  return (
    <section id="providers" className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              Top Rated
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              Featured Helpers
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Our most trusted and highly-reviewed local providers ready to help.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="lg" 
            className="mt-6 md:mt-0"
            onClick={() => navigate("/search")}
          >
            View All Helpers
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProviders.map((provider, index) => (
            <div
              key={provider.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ProviderCard {...provider} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProviders;