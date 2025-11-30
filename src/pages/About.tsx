import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Sparkles, Users } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export default function About() {
  const navigate = useNavigate();

  const values = [
    {
      icon: Heart,
      title: 'Built with Love',
      description: 'Created by a parent who wanted better educational tools for their daughter. Every feature is designed with young readers in mind.'
    },
    {
      icon: BookOpen,
      title: 'Learning First',
      description: 'We believe reading is the foundation of learning. Our AI-powered books make alphabet and early literacy engaging and accessible.'
    },
    {
      icon: Sparkles,
      title: 'Powered by AI',
      description: 'Advanced AI agents create personalized educational content daily, adapting to your child\'s age and learning preferences.'
    },
    {
      icon: Users,
      title: 'Family-Focused',
      description: 'Build reading habits together. Track progress, celebrate achievements, and make learning a shared family experience.'
    }
  ];

  return (
    <PreviewPageLayout>
      {/* Hero Section */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
            About Chairlift Habits
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
            {SITE_CONFIG.description}
          </p>
        </div>
      </PreviewSection>

      {/* Story Section */}
      <PreviewSection variant="default">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Our Story
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground mb-4">
              Chairlift Habits started with a simple observation: my daughter loves digital learning. 
              Instead of traditional printed books, she thrived on interactive, engaging content that 
              could be personalized just for her.
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              That's when I decided to build something new—a platform that combines the timeless 
              benefits of reading with the power of AI to create fresh, personalized educational 
              content every day.
            </p>
            <p className="text-lg text-muted-foreground">
              Today, Chairlift Habits helps families build daily reading habits with AI-made picture 
              books, progress tracking, and kid-friendly rewards—all in one place.
            </p>
          </div>
        </div>
      </PreviewSection>

      {/* Values Section */}
      <PreviewSection variant="feature">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            What We Believe
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PreviewSection>

      {/* How It Works */}
      <PreviewSection variant="explainer">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">
            How It Works
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">AI Creates Daily Books</h3>
                <p className="text-muted-foreground">
                  Our specialized AI agents generate new educational books every day at 7:01 AM Eastern Time, 
                  featuring alphabet learning, numbers, colors, and more.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Personalize with Chat</h3>
                <p className="text-muted-foreground">
                  Use our AI Book Studio to create custom books tailored to your child's age, interests, 
                  and favorite characters—all through a simple conversation.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Track Progress & Celebrate</h3>
                <p className="text-muted-foreground">
                  Monitor reading progress, build daily habits with our rewards system, and celebrate 
                  your child's learning milestones as a family.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PreviewSection>

      {/* CTA Section */}
      <PreviewSection variant="cta">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Start Growing Your Young Reader
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join families who are building daily reading habits with personalized, AI-made books.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              Start Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/preview/pricing')} className="text-lg px-8">
              View Pricing
            </Button>
          </div>
        </div>
      </PreviewSection>
    </PreviewPageLayout>
  );
}
