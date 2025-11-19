import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const HabitsRewards = () => {
  const navigate = useNavigate();

  return (
    <PreviewPageLayout>
      {/* Hero */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Habits that flex with your family life
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Reading habits work best when they fit your schedule. Chairlift supports flexible habit rules and kid-friendly rewards that feel fair.
          </p>
        </div>
      </PreviewSection>

      {/* Insights */}
      <PreviewSection variant="feature">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Insights at the level you need
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              See progress at a glance with visual indicators
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">See progress bars for each habit by child and by week</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Zoom into trends, such as which days often break streaks</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Add widgets on mobile so reading is top of mind</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Progress visualization</span>
          </div>
        </div>
      </PreviewSection>

      {/* Plan Beyond One Week */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Planning calendar</span>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Plan beyond one week
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Set habits that adapt to your family rhythm
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Set up habits for weekdays, weekends, and school breaks</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Plan rewards that match seasons, events, or trips</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Save for bigger rewards alongside smaller treats</span>
              </li>
            </ul>
          </div>
        </div>
      </PreviewSection>

      {/* Customize */}
      <PreviewSection variant="feature">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Customize to your family
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Make habits and rewards fit your rules
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Edit habit names, icons, and colors</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Reorder habits and rewards so the most important items sit at the top</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Pick gentle reminders that match your parenting style</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Customization options</span>
          </div>
        </div>
      </PreviewSection>

      {/* Two Ways to Structure */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Two ways to structure habits
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            Choose how you prefer to track reading, so you have the structure or flexibility you need.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="p-8 rounded-lg border border-border bg-card">
              <h3 className="text-2xl font-bold text-foreground mb-4">Flex Habits</h3>
              <p className="text-muted-foreground leading-relaxed">
                One focus number, for total reading time or total finished books in a period. Simple and flexible for busy families.
              </p>
            </div>
            <div className="p-8 rounded-lg border border-border bg-card">
              <h3 className="text-2xl font-bold text-foreground mb-4">Category Habits</h3>
              <p className="text-muted-foreground leading-relaxed">
                Separate habits for storytime, independent reading, and audio follow-along. Detailed tracking for specific goals.
              </p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* CTA */}
      <PreviewSection variant="cta">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Build habits that stick
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

export default HabitsRewards;
