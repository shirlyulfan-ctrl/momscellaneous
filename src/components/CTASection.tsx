import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Get Started?
        </h2>

        <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto opacity-90">
          Whether you need help or want to offer your services, join our
          community today.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {/* Find Help Now */}
          <Button
            size="xl"
            variant="secondary"
            onClick={() => navigate("/search")}
          >
            Find Help Now
          </Button>

          {/* Become a Helper */}
          <Button
            size="xl"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-primary"
            onClick={() => navigate("/become-provider")}
          >
            Become a Helper
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
