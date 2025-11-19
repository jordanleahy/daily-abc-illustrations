import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewHero } from '@/components/preview/PreviewHero';
import { FeatureGrid } from '@/components/preview/FeatureGrid';
import { DeepDiveSection } from '@/components/preview/DeepDiveSection';
import { SocialProof } from '@/components/preview/SocialProof';
import { PreviewPricingSection } from '@/components/preview/PreviewPricingSection';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useGA4 } from '@/hooks/useGA4';
import { useEffect } from 'react';

const PreviewHome = () => {
  const navigate = useNavigate();
  const { trackEvent } = useGA4();

  useEffect(() => {
    trackEvent('page_view', {
      page_title: 'Preview Home',
      page_path: '/preview',
    });
  }, [trackEvent]);

  return (
    <PreviewPageLayout>
      {/* Hero Section */}
      <PreviewHero />

      {/* What is Chairlift? Explainer */}
      <PreviewSection variant="explainer" id="what-is-chairlift">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Your home base for reading clarity
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Chairlift brings all your family's reading into one clear view. See which books your child finishes, what words they learn, and how often they read. Stay on top of habits and rewards without juggling apps, spreadsheets, or paper charts.
          </p>
        </div>
      </PreviewSection>

      {/* Everything in one app - Feature Grid */}
      <FeatureGrid />

      {/* Deep Dive: Reading & Library */}
      <DeepDiveSection
        title="All your books, in one place"
        description="Connect your Chairlift library and see every book your child explores. Daily AI books appear each morning at 7:01 AM Eastern Time. You choose what stays in rotation and what moves to the side."
        features={[
          'Multiple book types: ABC, numbers, animals, colors, emotions, shapes, sight words, and more',
          'Text overlays on top of illustrations for an easy mobile reading experience',
          'Word learning system that highlights new vocabulary and tracks exposure over time'
        ]}
        ctaText="Explore the reading experience"
        ctaLink="/preview/tracking"
        imagePosition="left"
      />

      {/* Deep Dive: Habits & Rewards */}
      <DeepDiveSection
        title="Habits and rewards that stick"
        description="Parents decide the habit. Chairlift keeps score. Your child earns coins for reading and habit completion, then trades those coins for rewards you approve."
        features={[
          'Set habits by day, time, and length of reading',
          'Let your reader see streaks and coins climb in a simple view',
          'Use a shared "store" so kids know which rewards are in reach'
        ]}
        ctaText="See how habits work"
        ctaLink="/preview/habits"
        imagePosition="right"
      />

      {/* Deep Dive: AI Book Studio */}
      <DeepDiveSection
        title="AI Book Studio for personalized stories"
        description="Bring a few details about your child, and Chairlift creates a story that feels personal. The AI book agents build new ABC books and educational stories every day, then you adjust details through a simple chat."
        features={[
          'AI agents generate new daily books at 7:01 AM Eastern Time',
          'Parents guide themes, characters, and difficulty through a chat flow',
          'Books stay in your family library for re-reading and habit tracking'
        ]}
        ctaText="Create your first AI book"
        ctaLink="/preview/ai-studio"
        imagePosition="left"
      />

      {/* Deep Dive: Family Collaboration */}
      <DeepDiveSection
        title="Reading, shared across your household"
        description="Chairlift supports multiple kids and caregivers. Everyone sees the same reading status, habits, and rewards, so you stay aligned without long check-ins."
        features={[
          'Kid profiles with age, reading level, and preferences',
          'Parent dashboard with per-child progress and activity',
          'Invite partners or grandparents to view reading progress at no extra cost'
        ]}
        ctaText="View the parent dashboard"
        ctaLink="/preview/dashboard"
        imagePosition="right"
      />

      {/* Daily AI Books Section */}
      <PreviewSection variant="feature" id="daily-books">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Fresh stories, every morning
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Each morning, Chairlift's AI agents add new daily books to your library at 7:01 AM Eastern Time. Use them for quick bedtime reads, morning routines, or screen-time swaps.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">One free daily book</h3>
              <p className="text-sm text-muted-foreground">For every family</p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">Full access with Plus</h3>
              <p className="text-sm text-muted-foreground">See the full daily stream and back catalog</p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">Tagged & filtered</h3>
              <p className="text-sm text-muted-foreground">By type, theme, and difficulty</p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* Social Proof */}
      <SocialProof />

      {/* Pricing Teaser */}
      <PreviewPricingSection />

      {/* Final CTA */}
      <PreviewSection variant="cta">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Build a reading habit your child loves
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            With Chairlift in your corner
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8"
          >
            Start free
          </Button>
        </div>
      </PreviewSection>
    </PreviewPageLayout>
  );
};

export default PreviewHome;
