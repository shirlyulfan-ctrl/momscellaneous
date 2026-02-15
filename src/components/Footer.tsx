// src/components/Footer.tsx
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="text-lg font-semibold text-foreground">Momscellaneous</div>
            <p className="text-sm text-muted-foreground max-w-md">
              A community marketplace that connects families with independent providers.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <Link to="/terms" className="text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link to="/provider-agreement" className="text-muted-foreground hover:text-foreground">
              Provider Agreement
            </Link>
          </div>
        </div>

        <div className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Momscellaneous. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
