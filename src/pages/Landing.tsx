import { PageLayout } from '@/components/layout/PageLayout';
import { LandingHero } from '@/components/landing/LandingHero';
import { PopularBooks } from '@/components/landing/PopularBooks';
import { LibrarySection } from '@/components/landing/LibrarySection';
import { SignupSection } from '@/components/landing/SignupSection';
import { useLandingPageData } from '@/hooks/useLandingPageData';
import { useLandingPageImagePreloader } from '@/hooks/useLandingPageImagePreloader';
import { useGA4 } from '@/hooks/useGA4';
import { useEffect } from 'react';
import { MetaHead } from '@/components/common/MetaHead';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';

const Landing = () => {
  const { trackEvent } = useGA4();
  const { data: landingData } = useLandingPageData();
  
  // Preload images progressively
  useLandingPageImagePreloader(landingData);

  useEffect(() => {
    trackEvent('page_view', {
      page_title: 'Landing',
      page_path: '/',
    });
  }, [trackEvent]);

  return (
    <>
      <MetaHead 
        metadata={{
          title: getSiteTitle(),
          description: SITE_CONFIG.description,
          siteName: SITE_CONFIG.name,
        }}
      />
      <PageLayout showHeader={true} fullHeight={false}>
        <div className="flex flex-col">
          <LandingHero dailyPublished={landingData?.dailyPublished} />
          <PopularBooks books={landingData?.popularBooks} />
          <LibrarySection books={landingData?.libraryBooks} />
          <SignupSection />
        </div>
      </PageLayout>
    </>
  );
};

export default Landing;
