import { PreviewSection } from './layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';

export const PreviewPricingSection = () => {
  const navigate = useNavigate();

  const features = [
    'Full library access for all book types',
    'Habits, coins, and rewards store',
    'Multiple kid profiles',
    'Download PDF versions',
    'Track reading progress',
    'Premium reading experience'
  ];

  return (
    <PreviewSection variant="feature">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Free for Everyone
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All features are included with a simple free signup. No credit card required.
          </p>
        </div>

        <div 
          className="p-8 rounded-lg border-2 border-primary bg-card cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] max-w-md mx-auto"
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
  );
};
