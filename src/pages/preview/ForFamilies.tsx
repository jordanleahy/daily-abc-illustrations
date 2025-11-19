import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ForFamilies = () => {
  const navigate = useNavigate();

  return (
    <PreviewPageLayout>
      {/* Hero */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Stay on the same page about reading
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Bring each caregiver's view of reading into one shared dashboard. Align on goals, screen-time tradeoffs, and rewards without long debates.
          </p>
        </div>
      </PreviewSection>

      {/* Shared View */}
      <PreviewSection variant="feature">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Your household on a single screen
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Get a full picture by bringing all accounts together
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Combine reading data for all kids into one view</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Know how much each child reads, without manual updates</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Watch progress build across the whole family</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Family dashboard</span>
          </div>
        </div>
      </PreviewSection>

      {/* Collaboration */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Collaboration tools</span>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Collaboration made simple
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Keep everyone aligned without extra work
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Tag your partner on reading notes or rewards</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Use a monthly summary to guide short check-ins</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Agree on rewards and screen-time rules with shared facts</span>
              </li>
            </ul>
          </div>
        </div>
      </PreviewSection>

      {/* Go Further Together */}
      <PreviewSection variant="feature">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Go further, together
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Align on goals you feel proud of as a family
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Set shared reading goals and track progress</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Use reports to find easy ways to increase reading time</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Share progress with grandparents or educators when needed</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Goal tracking</span>
          </div>
        </div>
      </PreviewSection>

      {/* FAQ Section */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">
                How does Chairlift work for multiple kids?
              </h3>
              <p className="text-muted-foreground">
                Each child gets their own profile with separate reading history, habits, and coin balances. Parents see all children in one dashboard and can switch between individual and family views.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">
                Does it cost extra to add another caregiver?
              </h3>
              <p className="text-muted-foreground">
                No. Invite your partner, grandparents, or other caregivers at no additional cost. Everyone sees the same data and can mark habits complete or approve rewards.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">
                What information does each family member see?
              </h3>
              <p className="text-muted-foreground">
                All family members with access see the full reading history, habits, coins, and rewards for every child in the household. You control who has access through simple invitations.
              </p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* CTA */}
      <PreviewSection variant="cta">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Build reading habits together
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

export default ForFamilies;
