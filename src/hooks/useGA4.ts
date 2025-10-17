import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsAdmin } from '@/contexts/RoleContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { getOrCreateVisitorId, trackVisit, getVisitorStats } from '@/utils/storage';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const useGA4 = () => {
  const location = useLocation();
  const isAdmin = useIsAdmin();
  const { user } = useAuthContext();

  // Set up visitor tracking for non-authenticated users
  useEffect(() => {
    if (typeof window.gtag === 'function' && !isAdmin) {
      const userType = user ? 'authenticated' : 'anonymous';
      
      // For anonymous users, set visitor ID and stats
      if (!user) {
        const visitorId = getOrCreateVisitorId();
        const visitorStats = trackVisit();
        
        window.gtag('set', 'user_properties', {
          user_type: userType,
          visitor_id: visitorId,
          visit_count: visitorStats.visitCount,
          days_since_first_visit: Math.floor((Date.now() - visitorStats.firstVisit) / (1000 * 60 * 60 * 24)),
          total_books_read: visitorStats.totalBooksRead,
        });
      } else {
        window.gtag('set', 'user_properties', {
          user_type: userType,
          user_id: user.id,
        });
      }

      window.gtag('config', 'G-GW7XZWKQM0', {
        page_path: location.pathname,
      });
    }
  }, [location, isAdmin, user]);

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window.gtag === 'function' && !isAdmin) {
      // Enrich events with visitor data for anonymous users
      const enrichedParams = { ...parameters };
      
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
    }
  };

  return { trackEvent };
};