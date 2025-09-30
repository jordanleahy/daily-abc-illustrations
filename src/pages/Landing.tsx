import { useEffect } from 'react';
import { useGA4 } from '@/hooks/useGA4';
import { MetaHead } from '@/components/common';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';
import { 
  LandingHero, 
  PopularBooks, 
  RewardsFeature, 
  Testimonials,
  PricingSection,
  SignupSection 
} from '@/components/landing';
import { Header } from '@/components/layout';

const Landing = () => {
  const { trackEvent } = useGA4();

  useEffect(() => {
    trackEvent('page_view', {
      page_title: 'Landing Page',
      page_location: window.location.href,
      page_path: '/landing'
    });
  }, [trackEvent]);

  return (
    <>
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
        
        <LandingHero />
        <PopularBooks />
        <RewardsFeature />
        <Testimonials />
        <PricingSection />
        <SignupSection />
      </div>
    </>
  );
};

export default Landing;
