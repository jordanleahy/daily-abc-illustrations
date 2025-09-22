import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const useGTM = (gtmId?: string) => {
  const location = useLocation();

  useEffect(() => {
    if (!gtmId || typeof window === 'undefined') return;

    // Push page view to dataLayer on route change
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'page_view',
      page_location: window.location.href,
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  }, [location, gtmId]);

  // Function to track custom events
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (!gtmId || typeof window === 'undefined') return;
    
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...parameters,
    });
  };

  return { trackEvent };
};