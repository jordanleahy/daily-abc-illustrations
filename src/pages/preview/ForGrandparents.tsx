import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ForGrandparents = () => {
  const navigate = useNavigate();

  return (
    <PreviewPageLayout>
      {/* Hero */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            The perfect gift for your grandchildren
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stay connected through reading. Create personalized books, track their progress, and celebrate learning milestones—all from wherever you are.
          </p>
        </div>
      </PreviewSection>

      {/* Create Books */}
      <PreviewSection variant="feature">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Create personalized books they'll treasure
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Make custom ABC books featuring their favorite characters and interests
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Choose themes they love—Paw Patrol, Frozen, dinosaurs, and more</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Age-appropriate content for toddlers through preschool</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Create books together during video calls or surprise them</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Custom book creation</span>
          </div>
        </div>
      </PreviewSection>

      {/* Stay Connected */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Reading progress dashboard</span>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Stay connected through their reading journey
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Watch them grow from anywhere in the world
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">See which books they're reading and how often</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Celebrate milestones with virtual rewards and encouragement</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Share reading moments even when you're far away</span>
              </li>
            </ul>
          </div>
        </div>
      </PreviewSection>

      {/* Meaningful Connection */}
      <PreviewSection variant="feature">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Support their education meaningfully
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Give the gift that keeps on giving—a love of reading
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Contribute to reading habits and learning goals</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Work together with parents on shared literacy goals</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Create lasting memories through personalized stories</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Shared goals</span>
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
                Can I access this from anywhere?
              </h3>
              <p className="text-muted-foreground">
                Yes! Chairlift Habits works on any device with internet access. Create books, check reading progress, and stay connected whether you're across town or across the country.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">
                How do I get access to my grandchildren's account?
              </h3>
              <p className="text-muted-foreground">
                Parents can invite you with a simple email invitation. Once accepted, you'll have full access to create books and view reading progress for all grandchildren in that household.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">
                Is it easy to use for someone not tech-savvy?
              </h3>
              <p className="text-muted-foreground">
                Absolutely. Chairlift Habits is designed to be simple and intuitive. Create custom books with just a few clicks, and viewing reading progress is as easy as checking email.
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-2">
                Can I create books for multiple grandchildren?
              </h3>
              <p className="text-muted-foreground">
                Yes! Create personalized books tailored to each grandchild's age, interests, and favorite characters. Each child gets their own special collection.
              </p>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* CTA */}
      <PreviewSection variant="cta">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Start creating memories today
          </h2>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
          >
            Get started free
          </Button>
        </div>
      </PreviewSection>
    </PreviewPageLayout>
  );
};

export default ForGrandparents;
