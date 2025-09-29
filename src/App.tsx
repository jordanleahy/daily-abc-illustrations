import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { RoleProvider } from "@/contexts/RoleContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Agents from "./pages/Agents";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import { AdminOnly } from "@/components/AdminOnly";
import Library from "./pages/Library";
import LibraryBookView from "./pages/LibraryBookView";
import LibraryDetail from "./pages/LibraryDetail";
import Rewards from "./pages/Rewards";
import DailyPublished from "./pages/DailyPublished";
import DailyPublishedSchedule from "./pages/DailyPublishedSchedule";
import Schedule from "./pages/Schedule";
import Reddit from "./pages/Reddit";
import Pricing from "./pages/Pricing";
import Subscription from "./pages/Subscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancel from "./pages/SubscriptionCancel";
import SubscriptionManage from "./pages/SubscriptionManage";
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
              <Route path="/auth" element={<Auth />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/editor" element={<AdminOnly><Books /></AdminOnly>} />
              <Route path="/editor/:id" element={<AdminOnly><BookDetail /></AdminOnly>} />
                <Route path="/library" element={<Library key="library" />} />
                <Route path="/library/:id" element={<LibraryBookView />} />
                <Route path="/library/:id/detail" element={<LibraryDetail />} />
                <Route path="/rewards" element={<Rewards />} />
               <Route path="/daily-published/:id" element={<DailyPublished />} />
               <Route path="/daily-published-schedule" element={<DailyPublishedSchedule />} />
               <Route path="/schedule" element={<Schedule />} />
               <Route path="/reddit" element={<Reddit />} />
               <Route path="/pricing" element={<Pricing />} />
               <Route path="/subscription" element={<Subscription />} />
               <Route path="/subscription/success" element={<SubscriptionSuccess />} />
               <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
               <Route path="/subscription/manage" element={<SubscriptionManage />} />
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
