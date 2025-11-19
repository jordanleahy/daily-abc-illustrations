import { BookOpen, Target, Gift, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const FeatureGrid = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: 'Read',
      subtitle: 'Know what your child reads',
      description: 'See every finished book in one timeline. Track streaks, minutes, and pages per session. Spot which book types your child returns to again and again.',
      link: '/preview/tracking'
    },
    {
      icon: Target,
      title: 'Habits',
      subtitle: 'Make reading a daily routine',
      description: 'Set simple reading habits that match your family\'s schedule. Mark habits done from any device in a few taps. Turn streaks into coins so kids feel proud of progress.',
      link: '/preview/habits'
    },
    {
      icon: Gift,
      title: 'Rewards',
      subtitle: 'Turn effort into rewards',
      description: 'Create a rewards store that fits your family rules. Let kids trade coins for treats, trips, or time with you. Keep all rewards and redemptions in one place.',
      link: '/preview/habits'
    },
    {
      icon: Users,
      title: 'Family',
      subtitle: 'Stay aligned as a family',
      description: 'Add multiple kids with separate profiles. Share one view of progress with partners or caregivers. Keep everyone aligned on habits, rewards, and screen-time tradeoffs.',
      link: '/preview/for-families'
    }
  ];

  return (
    <div className="py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything you need, all in one app
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Set up kid profiles, pick reading habits, and let Chairlift do the heavy lifting behind the scenes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="p-8 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow"
              >
                <Icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-lg font-medium text-muted-foreground mb-4">
                  {feature.subtitle}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate('/preview/product')}
          >
            Explore all features
          </Button>
        </div>
      </div>
    </div>
  );
};
