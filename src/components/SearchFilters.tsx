import { Baby, PawPrint, Home, ShoppingBag, PartyPopper, Grid } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Grid,
  Baby,
  PawPrint,
  Home,
  ShoppingBag,
  PartyPopper,
};

interface Category {
  id: string;
  label: string;
  icon: string;
}

interface SearchFiltersProps {
  categories: Category[];
  neighborhoods: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedNeighborhood: string;
  setSelectedNeighborhood: (neighborhood: string) => void;
  showAvailableOnly: boolean;
  setShowAvailableOnly: (show: boolean) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

const SearchFilters = ({
  categories,
  neighborhoods,
  selectedCategory,
  setSelectedCategory,
  selectedNeighborhood,
  setSelectedNeighborhood,
  showAvailableOnly,
  setShowAvailableOnly,
  sortBy,
  setSortBy,
}: SearchFiltersProps) => {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border sticky top-24">
      <h3 className="font-bold text-foreground text-lg mb-6">Filters</h3>

      {/* Categories */}
      <div className="mb-6">
        <h4 className="font-semibold text-foreground text-sm mb-3">Category</h4>
        <div className="space-y-2">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon];
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {IconComponent && <IconComponent className="w-4 h-4" />}
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Neighborhood */}
      <div className="mb-6">
        <h4 className="font-semibold text-foreground text-sm mb-3">Neighborhood</h4>
        <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select neighborhood" />
          </SelectTrigger>
          <SelectContent>
            {neighborhoods.map((neighborhood) => (
              <SelectItem key={neighborhood} value={neighborhood}>
                {neighborhood}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <h4 className="font-semibold text-foreground text-sm mb-3">Sort by</h4>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="reviews">Most Reviews</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Availability Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="available-only" className="text-sm font-medium text-foreground">
          Available now
        </Label>
        <Switch
          id="available-only"
          checked={showAvailableOnly}
          onCheckedChange={setShowAvailableOnly}
        />
      </div>
    </div>
  );
};

export default SearchFilters;
