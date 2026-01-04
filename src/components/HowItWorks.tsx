import { Search, UserCheck, CalendarCheck, Star } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Search & Browse",
    description: "Tell us what you need and browse verified local helpers in your area.",
  },
  {
    icon: UserCheck,
    number: "02",
    title: "Review & Choose",
    description: "Check profiles, read reviews, and pick the perfect match for your needs.",
  },
  {
    icon: CalendarCheck,
    number: "03",
    title: "Book & Confirm",
    description: "Schedule at your convenience and get instant confirmation.",
  },
  {
    icon: Star,
    number: "04",
    title: "Get Help & Review",
    description: "Receive quality help and share your experience to help others.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Getting help has never been easier. Four simple steps to connect with trusted local helpers.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative group"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-border" />
              )}

              {/* Card */}
              <div className="relative bg-card rounded-2xl p-8 text-center border border-border hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 shadow-card hover:shadow-card-hover">
                {/* Number Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;