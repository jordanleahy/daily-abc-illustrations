import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Mountain, Target, Camera, Trophy, TrendingUp, Medal, Sparkles, User } from 'lucide-react';

const PreviewTricks = () => {
  const navigate = useNavigate();

  return (
    <PreviewPageLayout>
      {/* Hero */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Mountain className="w-4 h-4" />
            Snowboard Tricks
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground tracking-tight">
            Every trick counts.<br />
            <span className="text-primary">Watch them progress.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track your kid's snowboard tricks, set goals, capture progress, and celebrate every landing.
          </p>
        </div>
      </PreviewSection>

      {/* How It Works */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How trick tracking works
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Set trick goals</h3>
              <p className="text-muted-foreground text-sm">
                Pick a trick—ollie, butter, 180—and set a target. "Land 10 ollies this season."
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Capture the moment</h3>
              <p className="text-muted-foreground text-sm">
                Upload photos and videos of each attempt. Build a visual record of their progress.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Earn coins</h3>
              <p className="text-muted-foreground text-sm">
                Every completed trick earns coins they can spend on rewards. Harder tricks, bigger payouts.
              </p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* Progress Tracking */}
      <PreviewSection variant="feature">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Watch the progress unfold
              </h2>
              <p className="text-lg text-muted-foreground">
                See how many tricks they've landed, how close they are to their goals, and celebrate milestones together.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Visual progress bars</p>
                    <p className="text-muted-foreground text-sm">See at a glance how close they are to hitting their goal.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Medal className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Milestone celebrations</p>
                    <p className="text-muted-foreground text-sm">First ollie? First 180? Mark the big moments.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Media gallery</p>
                    <p className="text-muted-foreground text-sm">All their trick photos and videos in one place.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visual mockup */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg">🏂</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Ollie</p>
                    <p className="text-sm text-muted-foreground">7 of 10 landed</p>
                  </div>
                </div>
                <span className="text-primary font-bold">70%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg">🔄</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">180</p>
                    <p className="text-sm text-muted-foreground">3 of 5 landed</p>
                  </div>
                </div>
                <span className="text-primary font-bold">60%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg">🧈</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Butter</p>
                    <p className="text-sm text-muted-foreground">1 of 3 landed</p>
                  </div>
                </div>
                <span className="text-primary font-bold">33%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '33%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* Coins Connection */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Tricks feed into rewards
          </h2>
          <p className="text-xl text-muted-foreground">
            Landed a trick? Earn coins. Those coins go straight into their balance—same as habit coins. More tricks, more screen time, more rewards.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-3xl mb-2">🏂</p>
              <p className="font-medium text-foreground">Land trick</p>
            </div>
            <div className="flex items-center">
              <span className="text-2xl text-muted-foreground">→</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-3xl mb-2">💵</p>
              <p className="font-medium text-foreground">Earn coins</p>
            </div>
            <div className="flex items-center">
              <span className="text-2xl text-muted-foreground">→</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <p className="text-3xl mb-2">🎁</p>
              <p className="font-medium text-foreground">Get rewards</p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* AI Visualization Feature */}
      <PreviewSection variant="feature">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                See themselves doing it
              </h2>
              <p className="text-lg text-muted-foreground">
                Upload a photo of your child and we'll place them into trick images. Kids can visualize themselves landing each trick before they even try it.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Upload once</p>
                    <p className="text-muted-foreground text-sm">Add your child's photo and it applies to all trick cards automatically.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">AI visualization</p>
                    <p className="text-muted-foreground text-sm">See themselves on the rail, in the air, or landing the trick.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Build confidence</p>
                    <p className="text-muted-foreground text-sm">Visualization is a proven technique for learning new skills.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visual mockup */}
            <div className="relative">
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border-4 border-primary/30">
                        <span className="text-4xl">🏂</span>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">Your child here</p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur rounded-lg px-3 py-2 border border-border">
                    <p className="text-xs font-medium text-foreground">Boardslide</p>
                    <p className="text-xs text-muted-foreground">Round Rail</p>
                  </div>
                </div>
                <div className="p-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">AI Visualization Active</span>
                    </div>
                    <span className="text-xs text-primary font-medium">Personalized</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* CTA */}
      <PreviewSection variant="feature">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to track their trick progress?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Every landing counts. Start tracking today.
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
              onClick={() => navigate('/rewards-info')}
            >
              See rewards
            </Button>
          </div>
        </div>
      </PreviewSection>
    </PreviewPageLayout>
  );
};

export default PreviewTricks;
