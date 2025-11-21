import { PageLayout } from '@/components/layout/PageLayout';
import { LandingHero } from '@/components/landing/LandingHero';
import { CategorizedBookSections } from '@/components/library';
import { SignupSection } from '@/components/landing/SignupSection';
import { useLandingPageData } from '@/hooks/useLandingPageData';
import { useLandingPageImagePreloader } from '@/hooks/useLandingPageImagePreloader';
import { useLandingPageSubscription } from '@/hooks/useLandingPageSubscription';
import { useLibraryBooksDecoupled } from '@/hooks/useLibraryBooksDecoupled';
import { MetaHead } from '@/components/common/MetaHead';
import { SITE_CONFIG, getSiteTitle } from '@/config/site';

const Landing = () => {
  const { data: landingData } = useLandingPageData();
  const { data: libraryBooks = [], isLoading: isLoadingBooks } = useLibraryBooksDecoupled();
  
  // Enable real-time updates for all landing page content
  useLandingPageSubscription();
  
  // Preload images progressively
  useLandingPageImagePreloader(landingData);

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
          <CategorizedBookSections
            books={libraryBooks}
            showAllCategories={true}
            isLoading={isLoadingBooks}
          />
          <SignupSection />
        </div>
      </PageLayout>
    </>
  );
};

export default Landing;
