import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Award, BarChart3, Heart, Sparkles } from 'lucide-react';
import { PreviewNav } from '@/components/preview/layout/PreviewNav';
import { PreviewFooter } from '@/components/preview/layout/PreviewFooter';

export default function PreviewFamily() {
  const navigate = useNavigate();

  const features = [
    {
      icon: UserPlus,
      title: 'Add Multiple Kids',
      description: 'Create individual profiles for each child with their own avatar, age, and preferences.'
    },
    {
      icon: Award,
      title: 'Individual Progress',
      description: 'Track habits, reading, and rewards separately for each child in your family.'
    },
    {
      icon: BarChart3,
      title: 'Family Dashboard',
      description: 'See everyone\'s progress at a glance from your parent dashboard.'
    },
    {
      icon: Heart,
      title: 'Personalized Experience',
      description: 'Age-appropriate content and goals tailored to each child\'s development stage.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PreviewNav />
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Users className="h-4 w-4" />
              Multi-Kid Support
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              One App, Your Whole Family
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Manage all your children from a single account. Each kid gets their own profile with personalized habits, rewards, and progress tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')}>
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/preview/dashboard')}>
                See Parent Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for Growing Families
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you have one child or five, Chairlift Habits scales with your family.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How Family Profiles Work
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Profiles</h3>
              <p className="text-muted-foreground">
                Add each child with their name, birthday, and photo. We'll use their age to personalize content.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Assign Habits & Rewards</h3>
              <p className="text-muted-foreground">
                Set up different habits for each child based on their age and what they're working on.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor each child's habits, coins earned, and reading progress from your parent dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Get Your Family Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Add unlimited kid profiles and start building habits together.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            Create Your Family Account
          </Button>
        </div>
      </section>

      <PreviewFooter />
    </div>
  );
}
