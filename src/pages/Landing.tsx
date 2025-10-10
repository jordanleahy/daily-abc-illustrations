import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useGA4 } from '@/hooks/useGA4';
import { MetaHead } from '@/components/common';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';
import { 
  LandingHero, 
  PopularBooks, 
  PricingSection,
  LibrarySection,
  SignupSection,
  Footer
} from '@/components/landing';
import { Header } from '@/components/layout';
import { useLandingPageData } from '@/hooks/useLandingPageData';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

const Landing = () => {
  const { trackEvent } = useGA4();
  const { data: landingData } = useLandingPageData();
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const { hasActiveSubscription, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent('page_view', {
      page_title: 'Landing Page',
      page_location: window.location.href,
      page_path: '/landing'
    });
  }, [trackEvent]);

  // Redirect authenticated users without subscription to subscription page
  useEffect(() => {
    if (!authLoading && !subscriptionLoading && isAuthenticated && !hasActiveSubscription) {
      navigate('/subscription', { replace: true });
    }
  }, [authLoading, subscriptionLoading, isAuthenticated, hasActiveSubscription, navigate]);

  return (
    <>
      <Helmet>
        {/* Preconnect to Supabase storage for faster image loading */}
        <link rel="preconnect" href="https://foxdnspwzhjxjxuicute.supabase.co" />
        <link rel="dns-prefetch" href="https://foxdnspwzhjxjxuicute.supabase.co" />
      </Helmet>
      
      <MetaHead
        metadata={{
          title: getSiteTitle(),
          description: SITE_CONFIG.description,
          siteName: SITE_CONFIG.name,
          type: 'website',
          url: window.location.href,
          locale: SITE_CONFIG.locale,
          image: SITE_CONFIG.defaultImage,
          author: SITE_CONFIG.author
        }}
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <LandingHero 
          dailyPublished={landingData?.dailyPublished} 
        />
        <PopularBooks 
          books={landingData?.popularBooks} 
        />
        <PricingSection />
        <LibrarySection 
          books={landingData?.libraryBooks} 
        />
        <SignupSection />
        <Footer />
      </div>
    </>
  );
};

export default Landing;
