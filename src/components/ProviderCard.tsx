import { Star, MapPin, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProviderCardProps {
  name: string;
  avatar?: string;
  rating?: number;
  reviews?: number;
  location: string;
  hourlyRate: number;
  services: string[];
  verified: boolean;
  available: boolean;
  onViewProfile?: () => void;
}


const ProviderCard = ({
  name,
  avatar,
  rating,
  reviews,
  location,
  hourlyRate,
  services,
  verified,
  available,
}: ProviderCardProps) => {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 border border-border hover:border-primary/30 group">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="relative">
          <img
  src={avatar ?? "/avatar-placeholder.png"}
  alt={name}
  className="w-16 h-16 rounded-xl object-cover"
/>

          {available && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-secondary rounded-full border-2 border-card flex items-center justify-center">
              <div className="w-2 h-2 bg-secondary-foreground rounded-full" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground text-lg">{name}</h3>
            {verified && (
              <CheckCircle className="w-5 h-5 text-secondary" />
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        </div>

        {/* Rate */}
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground">${hourlyRate}</span>
          <span className="text-muted-foreground text-sm">/hr</span>
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1">
          <Star className="w-5 h-5 text-accent fill-accent" />
          <span className="font-semibold text-foreground">{rating ?? 5}</span>

        </div>
        <span className="text-muted-foreground text-sm">
  ({reviews ?? 0} reviews)
</span>

        {available && (
          <div className="flex items-center gap-1 ml-auto text-secondary text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>Available now</span>
          </div>
        )}
      </div>

      {/* Services */}
      <div className="flex flex-wrap gap-2 mb-5">
        {services.map((service) => (
          <span
            key={service}
            className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground"
          >
            {service}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1">
          View Profile
        </Button>
        <Button className="flex-1">
          Book Now
        </Button>
      </div>
    </div>
  );
};

export default ProviderCard;