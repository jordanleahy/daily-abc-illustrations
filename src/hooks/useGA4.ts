import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsAdmin } from '@/contexts/RoleContext';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const useGA4 = () => {
  const location = useLocation();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (typeof window.gtag === 'function' && !isAdmin) {
      window.gtag('config', 'G-GW7XZWKQM0', {
        page_path: location.pathname,
      });
    }
  }, [location, isAdmin]);

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window.gtag === 'function' && !isAdmin) {
      window.gtag('event', eventName, parameters);
    }
  };

  return { trackEvent };
};