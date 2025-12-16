import { BookOpen, Target, Gift, Users, Snowflake, Palette, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const FeatureGrid = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      title: 'Habits',
      subtitle: 'Build habits that stick',
      description: 'Create daily habits for reading, chores, brushing teeth, or anything else. Mark them done from any device in a few taps. Turn streaks into coins so kids feel proud of their progress.',
      link: '/preview/habits'
    },
    {
      icon: Youtube,
      title: 'Embedded YouTube',
      subtitle: '$1 = 5 minutes, then it stops',
      description: 'YouTube plays right in the app with a countdown timer. Kids earn 1¢ per page read—$1 unlocks 5 minutes of screen time. When time\'s up, they\'re redirected back to books or habits. Customize the rewards to fit your family.',
      link: '/preview/rewards'
    },
    {
      icon: BookOpen,
      title: 'Early Phonics',
      subtitle: 'Know what your child reads',
      description: 'See every finished book in one timeline. Track streaks, minutes, and pages per session. Spot which book types your child returns to again and again.',
      link: '/preview/tracking'
    },
    {
      icon: Palette,
      title: 'Coloring Books',
      subtitle: 'Print each book as a coloring book',
      description: 'Take the joy on the road and print out each book. Keep kids entertained with screen-free activities that reinforce what they learned.',
      link: '/library'
    },
    {
      icon: Snowflake,
      title: 'Snowboard Tricks',
      subtitle: 'Track each attempt',
      description: "Your patience is key to building a confident rider. Track each trick attempt so they can see how far they've come.",
      link: '/my-tricks'
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
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            You are a tired parent. This will help.
          </h2>
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
