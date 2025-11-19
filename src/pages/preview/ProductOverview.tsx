import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Target, Sparkles, LayoutDashboard, Users } from 'lucide-react';

const ProductOverview = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      title: 'Habits & Rewards',
      description: 'Set simple reading habits and let kids earn coins. Trade coins for rewards you approve.',
      link: '/preview/habits'
    },
    {
      icon: BookOpen,
      title: 'Reading & Library',
      description: 'Track every book, session, and word your child encounters. See progress over time with beautiful charts.',
      link: '/preview/tracking'
    },
    {
      icon: Sparkles,
      title: 'AI Book Studio',
      description: 'Create personalized stories with AI agents. New daily books appear at 7:01 AM Eastern Time.',
      link: '/preview/ai-studio'
    },
    {
      icon: LayoutDashboard,
      title: 'Parent Dashboard',
      description: 'Customize your view with widgets for streaks, coins, minutes, and reading trends.',
      link: '/preview/dashboard'
    },
    {
      icon: Users,
      title: 'Family Collaboration',
      description: 'Multiple kids and caregivers. One shared view of progress, habits, and rewards.',
      link: '/preview/for-families'
    }
  ];

  return (
    <PreviewPageLayout>
      {/* Hero */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Product
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            One app for books, habits, and rewards
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Chairlift Education replaces scattered apps, loose charts, and guesswork. View reading, habits, and rewards from one dashboard, built for busy parents.
          </p>
        </div>
      </PreviewSection>

      {/* Feature Sections */}
      <PreviewSection variant="default">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="p-8 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow"
                >
                  <Icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(feature.link)}
                  >
                    Learn more
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </PreviewSection>

      {/* Device Support */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            On every device, always in sync
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Chairlift works seamlessly across web, iOS, and Android—so you can check in on reading anytime, anywhere. Whether you're planning on a laptop or reviewing progress on the go, your data is always in sync and ready when you are.
          </p>
        </div>
      </PreviewSection>

      {/* CTA */}
      <PreviewSection variant="cta">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Ready to get started?
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

export default ProductOverview;
