import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

const PreviewPricing = () => {
  const navigate = useNavigate();

  return (
    <PreviewPageLayout>
      {/* Hero */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Simple pricing for busy families
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with free daily books and basic tracking. Upgrade to Chairlift Plus for full library access, habits, and rewards.
          </p>
        </div>
      </PreviewSection>

      {/* Pricing Cards */}
      <PreviewSection variant="default">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="p-8 rounded-lg border-2 border-border bg-card">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Free</h3>
              <div className="text-4xl font-bold text-foreground mb-4">
                $0
              </div>
              <p className="text-muted-foreground">
                Start reading with your family
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">One AI daily book</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Access to a rotating set of books</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Basic reading history for one child</span>
              </li>
            </ul>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/auth')}
            >
              Get started
            </Button>
          </div>

          {/* Plus Plan */}
          <div className="p-8 rounded-lg border-2 border-primary bg-card relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="px-4 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Chairlift Plus</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-foreground">$14.99</span>
                <span className="text-muted-foreground">per month</span>
              </div>
              <p className="text-muted-foreground mb-2">
                or $99 per year (save $80)
              </p>
              <p className="text-sm text-muted-foreground">
                30-day money-back guarantee
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Full library access for all book types</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Habits, coins, and rewards store</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Multiple kid profiles and full parent dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Custom AI book creation</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Word learning progress tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Export reports for teachers</span>
              </li>
            </ul>

            <Button 
              className="w-full"
              onClick={() => navigate('/auth')}
            >
              Start 30-day trial
            </Button>
          </div>
        </div>
      </PreviewSection>

      {/* FAQ */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Common questions
          </h2>
          <div className="space-y-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">
                Can I try Plus before committing?
              </h3>
              <p className="text-muted-foreground">
                Yes! Start with a 30-day free trial of Chairlift Plus. Cancel anytime during the trial period at no charge.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">
                What happens if I cancel?
              </h3>
              <p className="text-muted-foreground">
                You'll keep Plus access until the end of your billing period, then automatically move to the free plan. Your reading history and data stay safe.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">
                Do you offer family or group discounts?
              </h3>
              <p className="text-muted-foreground">
                One Plus subscription covers your entire household—multiple kids and caregivers at no extra cost. Contact us for educator or school pricing.
              </p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* CTA */}
      <PreviewSection variant="cta">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Start building better reading habits today
          </h2>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
          >
            Start free
          </Button>
        </div>
      </PreviewSection>
    </PreviewPageLayout>
  );
};

export default PreviewPricing;
