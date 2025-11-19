import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { getOrCreateVisitorId, trackVisit, getVisitorStats } from '@/utils/storage';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const useGA4 = () => {
  const location = useLocation();
  const { isAdmin, isModerator, hasRole, isLoading: roleLoading } = useRole();
  const { user } = useAuthContext();

  // Determine user role safely using server-validated RoleContext
  const getUserRole = (): 'anonymous' | 'authenticated' | 'moderator' | 'admin' => {
    if (!user) return 'anonymous';
    if (isAdmin) return 'admin';
    if (isModerator) return 'moderator';
    return 'authenticated';
  };

  // Set up visitor tracking and page views
  useEffect(() => {
    // Wait for role to load and gtag to be available
    if (typeof window.gtag !== 'function') {
      console.warn('[GA4] Google Analytics not loaded');
      return;
    }

    if (roleLoading) return;

    try {
      const userRole = getUserRole();
      const userProperties: Record<string, any> = {
        user_role: userRole, // Primary dimension for filtering: anonymous, authenticated, moderator, admin
        user_type: user ? 'authenticated' : 'anonymous', // Legacy support
        is_admin: isAdmin, // Boolean flag for quick admin filtering
        is_moderator: isModerator, // Boolean flag for moderator filtering
      };
      
      // For anonymous users, set visitor ID and stats
      if (!user) {
        const visitorId = getOrCreateVisitorId();
        const visitorStats = trackVisit();
        
        userProperties.visitor_id = visitorId;
        userProperties.visit_count = visitorStats.visitCount;
        userProperties.days_since_first_visit = Math.floor((Date.now() - visitorStats.firstVisit) / (1000 * 60 * 60 * 24));
        userProperties.total_books_read = visitorStats.totalBooksRead;
      } else {
        userProperties.user_id = user.id;
      }

      window.gtag('set', 'user_properties', userProperties);
      window.gtag('config', 'G-GW7XZWKQM0', {
        page_path: location.pathname,
        user_role: userRole, // Add to page view for easier segmentation
      });
    } catch (error) {
      console.error('[GA4] Error configuring analytics:', error);
    }
  }, [location, isAdmin, isModerator, roleLoading, user]);

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    // Wait for role to load and gtag to be available
    if (typeof window.gtag !== 'function') {
      console.warn('[GA4] Google Analytics not loaded, skipping event:', eventName);
      return;
    }

    if (roleLoading) return;

    try {
      const userRole = getUserRole();
      
      // Enrich events with standard parameters for segmentation
      const enrichedParams: Record<string, any> = { 
        ...parameters,
        user_role: userRole, // Primary dimension: anonymous, authenticated, moderator, admin
        is_admin: isAdmin, // Boolean for quick filtering
        is_moderator: isModerator, // Boolean for moderator filtering
      };
      
      if (!user) {
        const visitorId = getOrCreateVisitorId();
        const visitorStats = getVisitorStats();
        
        enrichedParams.visitor_id = visitorId;
        enrichedParams.user_type = 'anonymous'; // Legacy support
        
        if (visitorStats) {
          enrichedParams.visit_count = visitorStats.visitCount;
          enrichedParams.days_since_first_visit = Math.floor((Date.now() - visitorStats.firstVisit) / (1000 * 60 * 60 * 24));
        }
      } else {
        enrichedParams.user_type = 'authenticated'; // Legacy support
        enrichedParams.user_id = user.id;
      }
      
      window.gtag('event', eventName, enrichedParams);
    } catch (error) {
      console.error('[GA4] Error tracking event:', eventName, error);
    }
  };

  return { trackEvent };
};