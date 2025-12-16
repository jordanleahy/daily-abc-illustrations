import { PreviewSection } from './layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

export const PreviewPricingSection = () => {
  const navigate = useNavigate();

  return (
    <PreviewSection variant="feature">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple pricing for busy families
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with free daily books and basic tracking. Upgrade to Chairlift Plus for full library access, habits, and rewards.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="p-8 rounded-lg border-2 border-border bg-card">
            <h3 className="text-2xl font-bold text-foreground mb-4">Free</h3>
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
          </div>

          {/* Annual Pass */}
          <div className="p-8 rounded-lg border-2 border-border bg-card">
            <h3 className="text-2xl font-bold text-foreground mb-4">Annual Pass</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-foreground">$8.99</span>
              <span className="text-muted-foreground">/month</span>
              <p className="text-sm text-muted-foreground mt-1">billed annually</p>
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
                <span className="text-muted-foreground">Multiple kid profiles</span>
              </li>
            </ul>
          </div>

          {/* Plus Plan */}
          <div className="p-8 rounded-lg border-2 border-primary bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">Chairlift Plus</h3>
              <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                Popular
              </span>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-foreground">$14.99</span>
              <span className="text-muted-foreground">/month</span>
              <p className="text-sm text-muted-foreground mt-1">or $99/year</p>
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
            </ul>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={() => navigate('/preview/pricing')}
          >
            View full pricing
          </Button>
        </div>
      </div>
    </PreviewSection>
  );
};
