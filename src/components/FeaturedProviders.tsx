import ProviderCard from "./ProviderCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const providers = [
  {
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    rating: 4.9,
    reviews: 127,
    location: "Brooklyn, NY",
    hourlyRate: 25,
    services: ["Babysitting", "Tutoring", "After-school care"],
    verified: true,
    available: true,
  },
  {
    name: "Marcus Chen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    rating: 4.8,
    reviews: 89,
    location: "Manhattan, NY",
    hourlyRate: 30,
    services: ["Dog walking", "Pet sitting", "Vet visits"],
    verified: true,
    available: true,
  },
  {
    name: "Emily Rodriguez",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    rating: 5.0,
    reviews: 64,
    location: "Queens, NY",
    hourlyRate: 22,
    services: ["Cleaning", "Organizing", "Meal prep"],
    verified: true,
    available: false,
  },
  {
    name: "James Wilson",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    rating: 4.7,
    reviews: 156,
    location: "Bronx, NY",
    hourlyRate: 35,
    services: ["Handyman", "Furniture assembly", "Moving help"],
    verified: true,
    available: true,
  },
  {
    name: "Lisa Park",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    rating: 4.9,
    reviews: 203,
    location: "Staten Island, NY",
    hourlyRate: 28,
    services: ["Elder care", "Companionship", "Errands"],
    verified: true,
    available: true,
  },
  {
    name: "David Thompson",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    rating: 4.6,
    reviews: 78,
    location: "Jersey City, NJ",
    hourlyRate: 20,
    services: ["Yard work", "Gardening", "Snow removal"],
    verified: false,
    available: true,
  },
];

const FeaturedProviders = () => {
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
          <Button variant="outline" size="lg" className="mt-6 md:mt-0">
            View All Helpers
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider, index) => (
            <div
              key={provider.name}
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