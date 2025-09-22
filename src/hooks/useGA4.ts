import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const useGA4 = (measurementId?: string) => {
  const location = useLocation();

  useEffect(() => {
    if (!measurementId || typeof window === 'undefined') return;

    // Send page view to Google Analytics on route change
    window.gtag('config', measurementId, {
      page_location: window.location.href,
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  }, [location, measurementId]);

  // Function to track custom events
  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (!measurementId || typeof window === 'undefined') return;
    
    window.gtag('event', eventName, parameters);
  };

  return { trackEvent };
};