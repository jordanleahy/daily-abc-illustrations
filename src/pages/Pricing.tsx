import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { WireframePricing } from '@/components/subscription/WireframePricing';
import { MetaHead } from '@/components/common/MetaHead';
import { getSiteTitle } from '@/config/site';
import { useRole } from '@/contexts/RoleContext';

export default function Pricing() {
  const navigate = useNavigate();
  const { hasRole } = useRole();
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
    
    // Redirect admins/teachers away from pricing page
    if (hasRole('admin') || hasRole('teacher')) {
      navigate('/');
    }
  }, [hasRole, navigate]);

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