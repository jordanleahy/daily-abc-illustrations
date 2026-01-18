import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { WireframePricing } from '@/components/subscription/WireframePricing';
import { MetaHead } from '@/components/common/MetaHead';
import { getSiteTitle } from '@/config/site';

export default function Pricing() {
  const navigate = useNavigate();
  const pageTitle = 'Pricing';
  const seoMetadata = {
    title: getSiteTitle(pageTitle),
    description: 'Daily ABC Illustrations is free! Sign up to access all features.',
    keywords: ['free', 'ABC books', 'educational content', 'kids learning'],
    canonical: `${window.location.origin}/pricing`,
    openGraph: {
      title: getSiteTitle(pageTitle),
      description: 'Daily ABC Illustrations is free! Sign up to access all features.',
      type: 'website',
      url: `${window.location.origin}/pricing`,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: getSiteTitle(pageTitle),
      description: 'Daily ABC Illustrations is free! Sign up to access all features.',
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  return (
    <>
      <MetaHead metadata={seoMetadata} />
      <PageLayout>
        <main className="min-h-screen">
          <WireframePricing />
        </main>
      </PageLayout>
    </>
  );
}
