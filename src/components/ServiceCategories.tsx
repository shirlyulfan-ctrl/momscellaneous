import { Baby, Home, PawPrint, Wrench, Sparkles, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = [
  {
    icon: Baby,
    title: "Child Care",
    description: "Babysitters, nannies, after-school pickup, and occasional care",
    color: "bg-primary/10 text-primary",
    count: "2,400+ helpers",
    searchCategory: "childcare",
  },
  {
    icon: PawPrint,
    title: "Pet Care",
    description: "Dog walking, pet sitting, grooming visits, and vet runs",
    color: "bg-secondary/10 text-secondary",
    count: "1,800+ helpers",
    searchCategory: "petcare",
  },
  {
    icon: Home,
    title: "Home Care",
    description: "Cleaning, organizing, meal prep, and elderly assistance",
    color: "bg-accent/20 text-accent-foreground",
    count: "3,200+ helpers",
    searchCategory: "household",
  },
  {
    icon: Wrench,
    title: "Odd Jobs",
    description: "Handyman tasks, furniture assembly, yard work, and moving help",
    color: "bg-primary/10 text-primary",
    count: "2,100+ helpers",
    searchCategory: "household",
  },
  {
    icon: Car,
    title: "Errands",
    description: "Grocery runs, package pickup, waiting for deliveries",
    color: "bg-secondary/10 text-secondary",
    count: "1,500+ helpers",
    searchCategory: "errands",
  },
  {
    icon: Sparkles,
    title: "Special Events",
    description: "Party help, event setup, holiday assistance",
    color: "bg-accent/20 text-accent-foreground",
    count: "900+ helpers",
    searchCategory: "events",
  },
];

const ServiceCategories = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (searchCategory: string) => {
    navigate(`/search?category=${searchCategory}`);
  };

  return (
    <section id="services" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Our Services
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            Help for Every Need
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Whether it's a one-time task or ongoing support, find the right helper for any situation.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={category.title}
              onClick={() => handleCategoryClick(category.searchCategory)}
              className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer border border-border hover:border-primary/30 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl ${category.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <category.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-2">
                {category.title}
              </h3>
              <p className="text-muted-foreground mb-4">
                {category.description}
              </p>

              {/* Count Badge */}
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                {category.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceCategories;