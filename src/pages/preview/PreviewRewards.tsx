import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, ShoppingBag, Clock, Coins, Star, Trophy } from 'lucide-react';

const PreviewRewards = () => {
  const navigate = useNavigate();

  return (
    <PreviewPageLayout>
      {/* Hero */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Gift className="w-4 h-4" />
            Rewards System
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
            Effort earns.<br />
            <span className="text-primary">Rewards motivate.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Kids see their hard work pay off. Parents control the store. Everyone wins.
          </p>
        </div>
      </PreviewSection>

      {/* How Rewards Work */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How rewards work
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A simple system that teaches value and delayed gratification
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Earn from habits</h3>
              <p className="text-muted-foreground text-sm">
                Every completed habit adds money to your child's balance. They see their earnings grow in real time.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Browse the store</h3>
              <p className="text-muted-foreground text-sm">
                Kids pick from rewards you've approved. Screen time, treats, activities—whatever motivates your family.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Redeem and enjoy</h3>
              <p className="text-muted-foreground text-sm">
                When they've earned enough, they cash in. You fulfill the reward. The cycle continues.
              </p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* Parent Control */}
      <PreviewSection variant="feature">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                You control the store
              </h2>
              <p className="text-lg text-muted-foreground">
                Add your own rewards with custom prices. A trip to the park? 50 cents. Extra screen time? $1. That special toy they've been wanting? $20.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">Set any price for any reward</span>
                </li>
                <li className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">Add photos so kids know what they're saving for</span>
                </li>
                <li className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">Approve purchases before they're fulfilled</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border rounded-xl p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">30 min screen time</p>
                      <p className="text-sm text-muted-foreground">Most popular</p>
                    </div>
                  </div>
                  <span className="font-bold text-primary">$1.00</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Gift className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Ice cream trip</p>
                      <p className="text-sm text-muted-foreground">Weekend reward</p>
                    </div>
                  </div>
                  <span className="font-bold text-primary">$5.00</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">New LEGO set</p>
                      <p className="text-sm text-muted-foreground">Big goal</p>
                    </div>
                  </div>
                  <span className="font-bold text-primary">$25.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* Life Lessons */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            More than just motivation
          </h2>
          <p className="text-xl text-muted-foreground">
            The rewards system teaches real-world lessons: saving for goals, delayed gratification, and the connection between effort and outcome. These are skills that last a lifetime.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 pt-4">
            <div className="p-4">
              <p className="text-4xl font-bold text-primary mb-2">Saving</p>
              <p className="text-muted-foreground text-sm">Watch their balance grow toward bigger goals</p>
            </div>
            <div className="p-4">
              <p className="text-4xl font-bold text-primary mb-2">Patience</p>
              <p className="text-muted-foreground text-sm">Learn that good things take time and effort</p>
            </div>
            <div className="p-4">
              <p className="text-4xl font-bold text-primary mb-2">Choice</p>
              <p className="text-muted-foreground text-sm">Decide how to spend what they've earned</p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* CTA */}
      <PreviewSection variant="feature">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to reward the right behaviors?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start building your family's reward store today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
            >
              Get started free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/preview/habits')}
            >
              See habits
            </Button>
          </div>
        </div>
      </PreviewSection>
    </PreviewPageLayout>
  );
};

export default PreviewRewards;
