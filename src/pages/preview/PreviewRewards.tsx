import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, ShieldCheck, Youtube, DollarSign, Timer } from 'lucide-react';

const PreviewRewards = () => {
  const navigate = useNavigate();

  return (
    <PreviewPageLayout>
      {/* Hero - YouTube Focus */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-full text-sm font-medium">
            <Youtube className="w-4 h-4" />
            Built-in Screen Time
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
            100 points = 5 minutes.<br />
            <span className="text-primary">Then it stops.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            YouTube is built into the app. When their earned time runs out, the video stops. No negotiations. No "just one more."
          </p>
        </div>
      </PreviewSection>

      {/* Primary Feature - YouTube Timer */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Screen time they earn
              </h2>
              <p className="text-lg text-muted-foreground">
                Kids spend their earned money on YouTube time. The videos play right in the app with a countdown timer. When time's up, it's up.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Simple math</p>
                    <p className="text-muted-foreground text-sm">$1 buys 5 minutes. $2 buys 10. Kids learn to budget.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Timer className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Automatic cutoff</p>
                    <p className="text-muted-foreground text-sm">The app stops playback when their time runs out. No parent intervention needed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">You control the content</p>
                    <p className="text-muted-foreground text-sm">Approve which videos are available. Kids can only watch what you've approved.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visual mockup */}
            <div className="relative">
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
                {/* Video placeholder */}
                <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                </div>
                {/* Timer bar */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Time remaining</span>
                    </div>
                    <span className="text-lg font-bold text-primary">3:42</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '74%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* How It Works */}
      <PreviewSection variant="feature">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How it works
            </h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Complete habits</h3>
              <p className="text-muted-foreground text-sm">
                Kids finish their daily habits and earn money into their balance.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Buy screen time</h3>
              <p className="text-muted-foreground text-sm">
                They spend $1 for 5 minutes. Their balance updates instantly.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Watch until time's up</h3>
              <p className="text-muted-foreground text-sm">
                YouTube plays in the app. When the timer hits zero, the video stops automatically.
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">4</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Back to a book</h3>
              <p className="text-muted-foreground text-sm">
                When time's up, the app redirects them to a book they can read on their own.
              </p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* Why This Works */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            No more screen time battles
          </h2>
          <p className="text-xl text-muted-foreground">
            When kids earn their screen time, they respect the limits. The timer isn't the bad guy—they simply used up what they earned. Want more? Complete more habits tomorrow.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 pt-4 text-left">
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="font-bold text-foreground mb-2">Before</p>
              <p className="text-muted-foreground text-sm">
                "Just 5 more minutes!" Arguments. Meltdowns. Parent becomes the bad guy.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="font-bold text-primary mb-2">After</p>
              <p className="text-muted-foreground text-sm">
                Time runs out. Video stops. "I'll earn more tomorrow." Done.
              </p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* Custom Rewards */}
      <PreviewSection variant="feature">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <span className="text-3xl mb-2 block">🧋</span>
                  <p className="font-medium text-foreground text-sm">Bubble Tea</p>
                  <p className="text-primary font-bold">$5.00</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <span className="text-3xl mb-2 block">🍬</span>
                  <p className="font-medium text-foreground text-sm">Candy</p>
                  <p className="text-primary font-bold">$1.00</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <span className="text-3xl mb-2 block">🎮</span>
                  <p className="font-medium text-foreground text-sm">Game Night</p>
                  <p className="text-primary font-bold">$3.00</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 text-center">
                  <span className="text-3xl mb-2 block">🍦</span>
                  <p className="font-medium text-foreground text-sm">Ice Cream</p>
                  <p className="text-primary font-bold">$4.00</p>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Add any reward you want
              </h2>
              <p className="text-lg text-muted-foreground">
                Screen time is just the start. Add custom rewards that matter to your family—bubble tea trips, candy, game nights, or that toy they've been eyeing. Set any price. You're in control.
              </p>
              <p className="text-muted-foreground">
                Kids see their balance grow and choose how to spend it. Some will cash out fast. Others will save for weeks. Both are learning.
              </p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* CTA */}
      <PreviewSection variant="feature">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to end the screen time fights?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Let them earn it. Let the app enforce it.
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
              onClick={() => navigate('/habits-info')}
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
