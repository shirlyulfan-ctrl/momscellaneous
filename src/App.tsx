import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

import Index from "@/pages/Index";
import Search from "@/pages/Search";
import Auth from "@/pages/Auth";
import BecomeProvider from "@/pages/BecomeProvider";
import ProviderProfile from "@/pages/ProviderProfile";
import BookingSuccess from "@/pages/BookingSuccess";
import BookingCancel from "@/pages/BookingCancel";
import TermsPage from "@/pages/Terms";
import ProviderAgreementPage from "@/pages/ProviderAgreement";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<Search />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/become-provider" element={<BecomeProvider />} />

                <Route path="/providers/:id" element={<ProviderProfile />} />

                <Route path="/booking-success" element={<BookingSuccess />} />
                <Route path="/booking-cancel" element={<BookingCancel />} />

                <Route path="/terms" element={<TermsPage />} />
                <Route path="/provider-agreement" element={<ProviderAgreementPage />} />

                {/* keep last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
