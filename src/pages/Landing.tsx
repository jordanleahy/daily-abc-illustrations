import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
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
import { useLandingImagePreloader } from '@/hooks/useLandingImagePreloader';

const Landing = () => {
  const { trackEvent } = useGA4();
  const { data: landingData, isLoading } = useLandingPageData();

  // Strategically preload images in batches
  useLandingImagePreloader(
    landingData?.dailyPublished?.pages?.map(p => p.image_url) || [],
    landingData?.popularBooks?.map(b => b.image_url) || [],
    landingData?.libraryBooks?.map(b => b.og_image_url) || []
  );

  useEffect(() => {
    trackEvent('page_view', {
      page_title: 'Landing Page',
      page_location: window.location.href,
      page_path: '/landing'
    });
  }, [trackEvent]);

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
          isLoading={isLoading} 
        />
        <PopularBooks 
          books={landingData?.popularBooks} 
          isLoading={isLoading} 
        />
        <PricingSection />
        <LibrarySection 
          books={landingData?.libraryBooks} 
          isLoading={isLoading} 
        />
        <SignupSection />
        <Footer />
      </div>
    </>
  );
};

export default Landing;
