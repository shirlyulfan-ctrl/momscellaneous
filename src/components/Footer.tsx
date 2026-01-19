import { Heart, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const footerLinks = {
  Services: ["Child Care", "Pet Care", "Home Care", "Odd Jobs", "Errands", "Events"],
  Company: ["About Us", "Careers", "Blog", "Press", "Partners"],
  Support: ["Help Center", "Safety", "Trust & Safety", "Accessibility"],
  Legal: ["Terms of Service", "Privacy Policy", "Cookie Policy"],
};

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Momscellaneous</span>
            </a>
            <p className="text-background/70 mb-6 max-w-xs">
              Connecting families with trusted local helpers for all of life's everyday needs.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-background/70 hover:text-background transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">
            © 2025 Momscellaneous. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-background/50 text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-primary fill-primary" />
            <span>for communities everywhere</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;