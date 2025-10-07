import { useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { NonAuthPricingSection } from '@/components/subscription/NonAuthPricingSection';
import { MetaHead } from '@/components/common/MetaHead';
import { getSiteTitle } from '@/config/site';

export default function Pricing() {
  const pageTitle = 'Pricing';
  const seoMetadata = {
    title: getSiteTitle(pageTitle),
    description: 'Choose the perfect plan for your ABC book creation needs. Start free or upgrade to premium for unlimited features.',
    keywords: ['pricing', 'subscription', 'ABC books', 'educational content', 'premium features'],
    canonical: `${window.location.origin}/pricing`,
    openGraph: {
      title: getSiteTitle(pageTitle),
      description: 'Choose the perfect plan for your ABC book creation needs. Start free or upgrade to premium.',
      type: 'website',
      url: `${window.location.origin}/pricing`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: getSiteTitle(pageTitle),
      description: 'Choose the perfect plan for your ABC book creation needs. Start free or upgrade to premium.',
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  return (
    <>
      <MetaHead metadata={seoMetadata} />
      <PageLayout title={pageTitle}>
        <main className="min-h-screen">
          <NonAuthPricingSection />
        </main>
      </PageLayout>
    </>
  );
}