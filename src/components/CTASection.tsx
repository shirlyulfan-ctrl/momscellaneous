import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, Heart } from "lucide-react";

const benefits = [
  { icon: Shield, text: "Background checked" },
  { icon: Clock, text: "Flexible scheduling" },
  { icon: Heart, text: "Trusted community" },
];

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-primary/5" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-card px-4 py-2 rounded-full border border-border mb-8 shadow-card">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Join thousands of happy families
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Ready to Find Your{" "}
            <span className="text-primary">Perfect Helper?</span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Whether you need help today or want to plan ahead, our community of trusted helpers is ready to assist.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {benefits.map((benefit) => (
              <div
                key={benefit.text}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <benefit.icon className="w-5 h-5 text-secondary" />
                <span className="font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="hero">
              Find Help Now
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="xl" variant="hero-outline">
              Become a Helper
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;