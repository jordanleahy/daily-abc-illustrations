import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { RoleProvider } from "@/contexts/RoleContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import AdminChat from "./pages/AdminChat";
import GoogleChat from "./pages/GoogleChat";
import Auth from "./pages/Auth";
import AuthConfirm from "./pages/AuthConfirm";
import ResetPassword from "./pages/ResetPassword";
import Agents from "./pages/Agents";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Library from "./pages/Library";
import LibraryBookView from "./pages/LibraryBookView";
import LibraryDetail from "./pages/LibraryDetail";
import UserLibraryDetail from "./pages/UserLibraryDetail";
import BookReadingView from "./pages/BookReadingView";
import PublicBook from "./pages/PublicBook";
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
import NotFound from "./pages/NotFound";
import { GA4Tracker } from "./components/GA4Tracker";
import HabitsManage from "./pages/HabitsManage";
import MyHabits from "./pages/MyHabits";
import TricksManage from "./pages/TricksManage";
import MyTricks from "./pages/MyTricks";
import Profile from "./pages/Profile";
import WordProgress from "./pages/WordProgress";
import AdminCategorizeBooks from "./pages/AdminCategorizeBooks";
import Videos from "./pages/Videos";
import AdminUserActivity from "./pages/AdminUserActivity";
import PreviewHome from "./pages/preview/PreviewHome";
import ProductOverview from "./pages/preview/ProductOverview";
import ReadingTracking from "./pages/preview/ReadingTracking";
import HabitsRewards from "./pages/preview/HabitsRewards";
import AIStudio from "./pages/preview/AIStudio";
import ParentDashboard from "./pages/preview/ParentDashboard";
import ForFamilies from "./pages/preview/ForFamilies";
import PreviewPricing from "./pages/preview/PreviewPricing";
import BlogHome from "./pages/preview/BlogHome";
import { useEffect } from "react";
import { scheduleCacheCleanup } from "./utils/cacheCleanup";
import { initializeCacheWarming } from "./utils/cacheWarming";
import { initializePerformanceMonitoring } from "./utils/performanceMonitoring";
import { PerformanceDashboard } from "./components/dev/PerformanceDashboard";
import { detectPlainImageTags, assertPerformanceTargets } from "./utils/imageOptimizationGuards";
import { useChatBookCoversPreloader } from "./hooks/useChatBookCoversPreloader";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days - instant loading for returning users
      gcTime: 14 * 24 * 60 * 60 * 1000, // 14 days - keep cached data for 2x staleTime
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Export queryClient for use in utilities and edge cases
export { queryClient };

const App = () => {
  // Preload critical book cover images at app startup for instant display
  useChatBookCoversPreloader();

  // PHASE 3 & 4: Initialize cache warming, cleanup, and performance monitoring
  useEffect(() => {
    scheduleCacheCleanup();
    initializeCacheWarming();
    initializePerformanceMonitoring();
    
    // PHASE 6: Development checks for image optimization system
    if (process.env.NODE_ENV === 'development') {
      detectPlainImageTags();
      
      // Run performance assertions after page settles
      setTimeout(async () => {
        const result = await assertPerformanceTargets();
        if (!result.passed) {
          console.warn('[Image Optimization] Performance targets not met:');
          result.failures.forEach(failure => console.warn('  -', failure));
          console.warn('See: docs/IMAGE_OPTIMIZATION_ARCHITECTURE.md');
        }
      }, 5000);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <RoleProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <GA4Tracker />
                {process.env.NODE_ENV === 'development' && <PerformanceDashboard />}
                <Routes>
                <Route path="/" element={<Landing />} />
                
                {/* Preview Routes - Phase 1 */}
                <Route path="/preview" element={<PreviewHome />} />
                <Route path="/preview/product" element={<ProductOverview />} />
                <Route path="/preview/tracking" element={<ReadingTracking />} />
                <Route path="/preview/habits" element={<HabitsRewards />} />
                <Route path="/preview/ai-studio" element={<AIStudio />} />
                <Route path="/preview/dashboard" element={<ParentDashboard />} />
                <Route path="/preview/for-families" element={<ForFamilies />} />
                <Route path="/preview/pricing" element={<PreviewPricing />} />
                <Route path="/preview/blog" element={<BlogHome />} />
                
                <Route path="/home" element={<ProtectedRoute requireSubscription={false}><Index /></ProtectedRoute>} />
                <Route path="/admin/chat" element={<ProtectedRoute requireRole="admin"><AdminChat /></ProtectedRoute>} />
                <Route path="/google-chat" element={<ProtectedRoute requireSubscription={false}><GoogleChat /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
               <Route path="/agents" element={<Agents />} />
               {/* User book routes - Own books only */}
               <Route path="/books" element={<ProtectedRoute requireSubscription={false}><Books key="my-books" /></ProtectedRoute>} />
               <Route path="/books/:id" element={<ProtectedRoute requireSubscription={false}><BookDetail /></ProtectedRoute>} />
                {/* Admin book routes - All books in system */}
                <Route path="/all-books" element={<ProtectedRoute requireRole="admin"><Books key="all-books" /></ProtectedRoute>} />
                <Route path="/all-books/:id" element={<ProtectedRoute requireRole="admin"><BookDetail /></ProtectedRoute>} />
                {/* Library routes - All subscription tiers */}
                <Route path="/library" element={<ProtectedRoute requireSubscription={false}><Library key="library" /></ProtectedRoute>} />
                <Route path="/library/:bookId" element={<ProtectedRoute requireSubscription={false}><LibraryBookView /></ProtectedRoute>} />
                <Route path="/library/:id/detail" element={<ProtectedRoute requireSubscription={false}><UserLibraryDetail /></ProtectedRoute>} />
                <Route path="/admin/library/:id" element={<ProtectedRoute requireRole="admin"><LibraryDetail /></ProtectedRoute>} />
                
                {/* User book reading view */}
                <Route path="/books/:id/read" element={<ProtectedRoute requireSubscription={false}><BookReadingView /></ProtectedRoute>} />
                
                {/* Public book landing page (no auth required) */}
                <Route path="/book/:slug" element={<PublicBook />} />
                
                {/* Habits & Rewards routes - Plus tier only */}
                <Route path="/rewards" element={<ProtectedRoute requireFeature="habits_rewards"><Rewards /></ProtectedRoute>} />
                <Route path="/rewards/manage" element={<ProtectedRoute requireFeature="habits_rewards"><RewardsManage /></ProtectedRoute>} />
                <Route path="/habits/manage" element={<ProtectedRoute requireFeature="habits_rewards"><HabitsManage /></ProtectedRoute>} />
                <Route path="/my-habits" element={<ProtectedRoute requireFeature="habits_rewards"><MyHabits /></ProtectedRoute>} />
                
                {/* Tricks routes - Plus tier only */}
                <Route path="/tricks/manage" element={<ProtectedRoute requireFeature="habits_rewards"><TricksManage /></ProtectedRoute>} />
                <Route path="/my-tricks" element={<ProtectedRoute requireFeature="habits_rewards"><MyTricks /></ProtectedRoute>} />
                
                <Route path="/videos" element={<ProtectedRoute requireRole="admin"><Videos /></ProtectedRoute>} />
               <Route path="/admin/user-activity" element={<ProtectedRoute requireRole="admin"><AdminUserActivity /></ProtectedRoute>} />
               <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/word-progress" element={<ProtectedRoute><WordProgress /></ProtectedRoute>} />
               <Route path="/daily-published/:id" element={<DailyPublished />} />
               <Route path="/daily-published-schedule" element={<DailyPublishedSchedule />} />
               <Route path="/schedule" element={<Schedule />} />
               <Route path="/reddit" element={<Reddit />} />
               <Route path="/admin/categorize-books" element={<ProtectedRoute><AdminCategorizeBooks /></ProtectedRoute>} />
               <Route path="/pricing" element={<Pricing />} />
               <Route path="/subscription/success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />
               <Route path="/subscription/cancel" element={<ProtectedRoute><SubscriptionCancel /></ProtectedRoute>} />
               <Route path="/subscription/manage" element={<ProtectedRoute><SubscriptionManage /></ProtectedRoute>} />
               <Route path="/privacy-policy" element={<PrivacyPolicy />} />
               <Route path="/terms-of-service" element={<TermsOfService />} />
               {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </RoleProvider>
        </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
  );
};

export default App;
