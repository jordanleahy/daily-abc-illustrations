import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { RoleProvider } from "@/contexts/RoleContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AuthConfirm from "./pages/AuthConfirm";
import Agents from "./pages/Agents";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import { AdminOnly } from "@/components/AdminOnly";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Library from "./pages/Library";
import LibraryBookView from "./pages/LibraryBookView";
import LibraryDetail from "./pages/LibraryDetail";
import Rewards from "./pages/Rewards";
import RewardsManage from "./pages/RewardsManage";
import DailyPublished from "./pages/DailyPublished";
import DailyPublishedSchedule from "./pages/DailyPublishedSchedule";
import Schedule from "./pages/Schedule";
import Reddit from "./pages/Reddit";
import Pricing from "./pages/Pricing";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancel from "./pages/SubscriptionCancel";
import SubscriptionManage from "./pages/SubscriptionManage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import { QuickTestInlineEdit } from '@/components/demo/QuickTestInlineEdit';
import PerformanceComparison from '@/components/demo/PerformanceComparison';
import NotFound from "./pages/NotFound";
import { GA4Tracker } from "./components/GA4Tracker";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <AuthProvider>
          <RoleProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <GA4Tracker />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/confirm" element={<AuthConfirm />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/editor" element={<AdminOnly><Books /></AdminOnly>} />
              <Route path="/editor/:id" element={<AdminOnly><BookDetail /></AdminOnly>} />
                <Route path="/library" element={<ProtectedRoute requireSubscription={false}><Library key="library" /></ProtectedRoute>} />
                <Route path="/library/:id" element={<ProtectedRoute requireSubscription={false}><LibraryBookView /></ProtectedRoute>} />
                <Route path="/library/:id/detail" element={<ProtectedRoute requireSubscription={false}><LibraryDetail /></ProtectedRoute>} />
                <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
                <Route path="/rewards/manage" element={<ProtectedRoute><RewardsManage /></ProtectedRoute>} />
               <Route path="/daily-published/:id" element={<DailyPublished />} />
               <Route path="/daily-published-schedule" element={<DailyPublishedSchedule />} />
               <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
               <Route path="/reddit" element={<Reddit />} />
               <Route path="/pricing" element={<Pricing />} />
               <Route path="/subscription/success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
               <Route path="/subscription/cancel" element={<ProtectedRoute><SubscriptionCancel /></ProtectedRoute>} />
               <Route path="/subscription/manage" element={<ProtectedRoute><SubscriptionManage /></ProtectedRoute>} />
               <Route path="/privacy-policy" element={<PrivacyPolicy />} />
               <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/test-inline-edit" element={<div className="container mx-auto py-8"><QuickTestInlineEdit /></div>} />
                <Route path="/test" element={<div className="container mx-auto py-8"><QuickTestInlineEdit /></div>} />
                <Route path="/performance" element={<PerformanceComparison />} />
               {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </RoleProvider>
        </AuthProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
