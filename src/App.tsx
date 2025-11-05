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
import Profile from "./pages/Profile";

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
      <AuthProvider>
        <RoleProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <GA4Tracker />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/admin/chat" element={<ProtectedRoute requireRole="admin"><AdminChat /></ProtectedRoute>} />
                <Route path="/google-chat" element={<ProtectedRoute><GoogleChat /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
               <Route path="/agents" element={<Agents />} />
               <Route path="/editor" element={<ProtectedRoute requireRole="admin"><Books /></ProtectedRoute>} />
               <Route path="/editor/:id" element={<ProtectedRoute requireRole="admin"><BookDetail /></ProtectedRoute>} />
                {/* Library routes - All subscription tiers */}
                <Route path="/library" element={<ProtectedRoute requireSubscription={false}><Library key="library" /></ProtectedRoute>} />
                <Route path="/library/:id" element={<ProtectedRoute requireSubscription={false}><LibraryBookView /></ProtectedRoute>} />
                <Route path="/library/:id/detail" element={<ProtectedRoute requireSubscription={false}><UserLibraryDetail /></ProtectedRoute>} />
                <Route path="/admin/library/:id" element={<ProtectedRoute requireRole="admin"><LibraryDetail /></ProtectedRoute>} />
                
                {/* Public book landing page (no auth required) */}
                <Route path="/book/:slug" element={<PublicBook />} />
                
                {/* Habits & Rewards routes - Plus tier only */}
                <Route path="/rewards" element={<ProtectedRoute requireFeature="habits_rewards"><Rewards /></ProtectedRoute>} />
                <Route path="/rewards/manage" element={<ProtectedRoute requireFeature="habits_rewards"><RewardsManage /></ProtectedRoute>} />
                <Route path="/habits/manage" element={<ProtectedRoute requireFeature="habits_rewards"><HabitsManage /></ProtectedRoute>} />
                <Route path="/my-habits" element={<ProtectedRoute requireFeature="habits_rewards"><MyHabits /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
               <Route path="/daily-published/:id" element={<DailyPublished />} />
               <Route path="/daily-published-schedule" element={<DailyPublishedSchedule />} />
               <Route path="/schedule" element={<Schedule />} />
               <Route path="/reddit" element={<Reddit />} />
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

export default App;
