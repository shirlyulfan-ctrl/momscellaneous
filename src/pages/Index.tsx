import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServiceCategories from "@/components/ServiceCategories";
import FeaturedProviders from "@/components/FeaturedProviders";
import HowItWorks from "@/components/HowItWorks";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ServiceCategories />
        <HowItWorks />
        <FeaturedProviders />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;