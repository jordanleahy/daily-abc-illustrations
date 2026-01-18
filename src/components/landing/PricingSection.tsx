import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Free Access Pricing Section for Landing Page
 */
export const PricingSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  const features = [
    'Full library access',
    'Download PDF versions',
    'Habits & Rewards system',
    'Track reading progress',
    'Premium experience',
    'Daily ABC books'
  ];

  return (
    <section className="w-full py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Free For Everyone
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            All features included with a simple signup
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="border-2 border-primary shadow-xl">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto mb-4">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">Free Access</CardTitle>
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="text-muted-foreground text-lg">/forever</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {isAuthenticated ? (
                <Button 
                  className="w-full text-lg py-6"
                  size="lg"
                  onClick={() => navigate('/')}
                >
                  Go to Library
                </Button>
              ) : (
                <Button 
                  className="w-full text-lg py-6"
                  size="lg"
                  onClick={() => navigate('/auth?mode=signup')}
                >
                  Sign Up Free
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
