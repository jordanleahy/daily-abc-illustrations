import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ParentDashboard = () => {
  const navigate = useNavigate();

  return (
    <PreviewPageLayout>
      {/* Hero */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Parent Dashboard
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your command center for family reading. See progress, habits, and rewards at a glance.
          </p>
        </div>
      </PreviewSection>

      {/* Customizable Widgets */}
      <PreviewSection variant="feature">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Customize your view
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Drag and drop widgets to focus on what matters most to your family
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Reading streaks and minutes per child</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Coin balances and pending rewards</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Recent books and word learning progress</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Dashboard widgets</span>
          </div>
        </div>
      </PreviewSection>

      {/* Multi-Child View */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Multi-child view</span>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Track multiple kids
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              See each child's progress in one organized dashboard
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Separate profiles with age and reading level</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Compare progress across children</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Filter views by individual or see the whole family</span>
              </li>
            </ul>
          </div>
        </div>
      </PreviewSection>

      {/* Monthly Review */}
      <PreviewSection variant="feature">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Monthly reading review
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Swipe through a summary of wins and patterns
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Total minutes and books completed</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Favorite book types and themes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Coins earned and rewards redeemed</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Monthly summary</span>
          </div>
        </div>
      </PreviewSection>

      {/* Insights & Reports */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Reports & charts</span>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Insights that matter
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Turn reading data into actionable insights
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">See trends over weeks and months</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Identify peak reading times and days</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Export reports for teachers or specialists</span>
              </li>
            </ul>
          </div>
        </div>
      </PreviewSection>

      {/* CTA */}
      <PreviewSection variant="cta">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Get clarity on family reading
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

export default ParentDashboard;
