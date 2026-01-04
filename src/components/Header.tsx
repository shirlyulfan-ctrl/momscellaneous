import { Button } from "@/components/ui/button";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">​Momscellaneous</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Services
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              How It Works
            </a>
            <a href="#providers" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Find Help
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost">Log In</Button>
            <Button>Get Started</Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-foreground" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && <div className="md:hidden bg-card border-b border-border animate-fade-in">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <a href="#services" className="text-foreground font-medium py-2">
              Services
            </a>
            <a href="#how-it-works" className="text-foreground font-medium py-2">
              How It Works
            </a>
            <a href="#providers" className="text-foreground font-medium py-2">
              Find Help
            </a>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button variant="ghost" className="w-full">Log In</Button>
              <Button className="w-full">Get Started</Button>
            </div>
          </nav>
        </div>}
    </header>;
};
export default Header;