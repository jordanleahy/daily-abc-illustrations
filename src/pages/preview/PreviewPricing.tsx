import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';

const PreviewPricing = () => {
  const navigate = useNavigate();

  const features = [
    'Full library access for all book types',
    'Habits, coins, and rewards store',
    'Multiple kid profiles',
    'Download PDF versions',
    'Track reading progress',
    'Daily AI-generated ABC books'
  ];

  return (
    <PreviewPageLayout>
      {/* Hero */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Free for Everyone
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            All features are included with a simple free signup. No credit card required.
          </p>
        </div>
      </PreviewSection>

      {/* Pricing Card */}
      <PreviewSection variant="default">
        <div className="max-w-md mx-auto">
          <div 
            className="p-8 rounded-lg border-2 border-primary bg-card cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
            onClick={() => navigate('/auth?mode=signup')}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">Free Access</h3>
            </div>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-foreground">$0</span>
              <span className="text-muted-foreground">/forever</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="text-center">
              <Button size="lg" className="w-full">
                Sign Up Free
              </Button>
            </div>
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
                Is it really free?
              </h3>
              <p className="text-muted-foreground">
                Yes! All features are completely free. Just sign up with your email and you'll have full access to the entire library, habits system, and more.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">
                Do I need a credit card?
              </h3>
              <p className="text-muted-foreground">
                No credit card is required. Simply create a free account and start using all features immediately.
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
            onClick={() => navigate('/auth?mode=signup')}
          >
            Sign Up Free
          </Button>
        </div>
      </PreviewSection>
    </PreviewPageLayout>
  );
};

export default PreviewPricing;
