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
  const { isAdmin, isLoading: roleLoading } = useRole();
  const { user } = useAuthContext();

  // Set up visitor tracking and page views
  useEffect(() => {
    // Wait for role to load and gtag to be available
    if (typeof window.gtag !== 'function') {
      console.warn('[GA4] Google Analytics not loaded');
      return;
    }

    if (roleLoading) return;

    try {
      const userType = user ? 'authenticated' : 'anonymous';
      const userProperties: Record<string, any> = {
        user_type: userType,
        is_admin: isAdmin,
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
      });
    } catch (error) {
      console.error('[GA4] Error configuring analytics:', error);
    }
  }, [location, isAdmin, roleLoading, user]);

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    // Wait for role to load and gtag to be available
    if (typeof window.gtag !== 'function') {
      console.warn('[GA4] Google Analytics not loaded, skipping event:', eventName);
      return;
    }

    if (roleLoading) return;

    try {
      // Enrich events with standard parameters
      const enrichedParams: Record<string, any> = { 
        ...parameters,
        is_admin: isAdmin,
      };
      
      if (!user) {
        const visitorId = getOrCreateVisitorId();
        const visitorStats = getVisitorStats();
        
        enrichedParams.visitor_id = visitorId;
        enrichedParams.user_type = 'anonymous';
        
        if (visitorStats) {
          enrichedParams.visit_count = visitorStats.visitCount;
          enrichedParams.days_since_first_visit = Math.floor((Date.now() - visitorStats.firstVisit) / (1000 * 60 * 60 * 24));
        }
      } else {
        enrichedParams.user_type = 'authenticated';
        enrichedParams.user_id = user.id;
      }
      
      window.gtag('event', eventName, enrichedParams);
    } catch (error) {
      console.error('[GA4] Error tracking event:', eventName, error);
    }
  };

  return { trackEvent };
};