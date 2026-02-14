import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Auth from "./pages/Auth";
import BecomeProvider from "./pages/BecomeProvider";
import NotFound from "./pages/NotFound";
import ProviderProfile from "@/pages/ProviderProfile";
import BookingSuccess from "@/pages/BookingSuccess";
import BookingCancel from "@/pages/BookingCancel";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
<Route path="/providers/:id" element={<ProviderProfile />} />

              <Route path="/" element={<Index />} />
              <Route path="/search" element={<Search />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/become-provider" element={<BecomeProvider />} />

<Route path="/booking-success" element={<BookingSuccess />} />
<Route path="/booking-cancel" element={<BookingCancel />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
