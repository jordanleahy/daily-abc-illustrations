import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Battery, Smartphone, RefreshCw } from 'lucide-react';

const HabitsRewards = () => {
  const navigate = useNavigate();

  return (
    <PreviewPageLayout>
      {/* Hero - Core Philosophy */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary font-medium mb-4 tracking-wide uppercase text-sm">
            The Foundation
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Habits compound.<br />Outcomes expire.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Most parenting tools chase milestones. We care about helping your children master the process of showing up, adjusting, and repeating. Outcomes follow without pressure.
          </p>
          <Link 
            to="/blog/habits-are-the-product" 
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            Read the philosophy <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PreviewSection>

      {/* Parent First */}
      <PreviewSection variant="feature">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Users className="h-4 w-4" />
              Parent-first design
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              This system is designed for you, not your children
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Kids do not need motivation speeches. They need models. If you want your child to read every day, you read every day. Same time. Same place. Same rule.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium shrink-0">1</span>
                <span className="text-muted-foreground">Parent and child complete the same habit together</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium shrink-0">2</span>
                <span className="text-muted-foreground">Parent and child earn the same coins</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium shrink-0">3</span>
                <span className="text-muted-foreground">You lead by doing, not by reminding</span>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl aspect-square flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-6xl font-bold text-primary mb-2">2x</p>
              <p className="text-muted-foreground">habits tracked together</p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* Low Energy Days */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 bg-gradient-to-br from-amber-500/5 to-amber-500/10 rounded-2xl aspect-square flex items-center justify-center p-8">
            <div className="text-center">
              <Battery className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <p className="text-muted-foreground">Designed for survival mode</p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Battery className="h-4 w-4" />
              For low-energy days
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Parents do not lack intention. They lack energy.
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Most days feel like survival. Work. Cleanup. Bedtime negotiations. When parents run out of energy, habit leadership disappears. Screens fill the gap because they are easy.
            </p>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-foreground font-medium mb-3">This system exists for those days:</p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Opening the app counts</li>
                <li>• Looking at habits counts</li>
                <li>• Completing one small action counts</li>
              </ul>
              <p className="text-primary font-medium mt-4">Momentum beats motivation.</p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* Screens vs Habits */}
      <PreviewSection variant="feature">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <Smartphone className="h-4 w-4" />
              A better default
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How bad days still work
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              On bad days, parents default to screens. This creates an alternative.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Habits replace screen time as the first response</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold">🪙</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Screen time becomes something earned</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Coins remove arguments. Structure replaces negotiation.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 rounded-2xl aspect-square flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground line-through">Default to screens</p>
              <ArrowRight className="h-6 w-6 text-primary mx-auto rotate-90" />
              <p className="text-foreground font-medium">Default to habits</p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* How It Works */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How habits work
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple setup, flexible enough for your family
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">✏️</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Create or choose</h3>
              <p className="text-muted-foreground text-sm">
                Build your own habits from scratch or pick from a library of common ones. Reading, brushing teeth, tidying up—whatever matters to your family.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🪙</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Assign coins</h3>
              <p className="text-muted-foreground text-sm">
                Set a coin value for each habit. Harder habits earn more. Kids see their coins grow and trade them for rewards you approve.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Schedule flexibly</h3>
              <p className="text-muted-foreground text-sm">
                Set habits for specific days or let them repeat. Skip weekends, pause for vacations, or add extra habits when you need them.
              </p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* Consistency > Topic */}
      <PreviewSection variant="feature">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            The topic barely matters
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Reading. Manners. Responsibility. Accountability. All are interchangeable early on. What matters is tracking something and doing it again tomorrow.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-xl border border-border bg-card">
              <p className="text-4xl mb-4">📚</p>
              <h3 className="text-lg font-bold text-foreground mb-2">Reading daily</h3>
              <p className="text-muted-foreground text-sm">
                Even when it feels pointless
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <p className="text-4xl mb-4">👕</p>
              <h3 className="text-lg font-bold text-foreground mb-2">Hanging pajamas</h3>
              <p className="text-muted-foreground text-sm">
                Same spot, every morning
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <p className="text-4xl mb-4">🧹</p>
              <h3 className="text-lg font-bold text-foreground mb-2">Quick cleanup</h3>
              <p className="text-muted-foreground text-sm">
                Before the next activity
              </p>
            </div>
          </div>
          
          <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/20 max-w-xl mx-auto">
            <p className="text-foreground font-medium">
              Consistency builds identity. Identity builds behavior.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              A child who sees progress daily learns one thing: improvement is normal.
            </p>
          </div>
        </div>
      </PreviewSection>

      {/* The Real Win */}
      <PreviewSection variant="feature">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Repetition is the system
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            No long explanations. No complex setup. Just open, check, do.
          </p>
          <div className="bg-card border border-border rounded-xl p-8">
            <p className="text-lg text-foreground mb-4">
              The smallest action still reinforces identity:
            </p>
            <blockquote className="text-2xl font-medium text-primary italic">
              "I am someone who shows up."
            </blockquote>
            <p className="text-muted-foreground mt-6 text-sm">
              Missing days happens. Stopping is the failure.
            </p>
          </div>
        </div>
      </PreviewSection>

      {/* CTA */}
      <PreviewSection variant="cta">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            One day at a time
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Reflect often. Never stop.
          </p>
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

export default HabitsRewards;
