import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, Target, MountainSnow, User, MessageCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function About() {
  const navigate = useNavigate();

  const missionVisionGoal = [
    {
      icon: Heart,
      title: 'My Mission',
      description: 'Give parents who are trying to survive an affordable way to build healthy habits with their children. Habits like reading. Habits rooted in manners. Habits built on responsibility and accountability. Delivered in a format that fits real family life.'
    },
    {
      icon: Eye,
      title: 'My Vision',
      description: 'Provide each family with the equivalent of a PhD-level specialist for every learning subject their child is in. A personal expert built into the system who understands what the child needs, how they learn, and how to guide consistent growth.'
    },
    {
      icon: Target,
      title: 'Our Goal',
      description: 'Help parents focus on the process of building habits instead of only thinking about the outcome. Habits are the foundation of success. When children practice small actions each day, progress becomes steady and natural.'
    }
  ];

  return (
    <PreviewPageLayout>
      <Helmet>
        <title>About Us | Chairlift Habits</title>
        <meta name="description" content="Helping toddlers grow one habit at a time. Learn how Chairlift Habits was built by a parent who needed a better way to teach daily habits through personalized stories." />
      </Helmet>

      {/* Hero Section */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
            About Us
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            Helping toddlers grow one habit at a time
          </p>
        </div>
      </PreviewSection>

      {/* Our Story Section */}
      <PreviewSection variant="default">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Our Story
          </h2>
          <div className="prose prose-lg max-w-none space-y-4">
            <p className="text-lg text-muted-foreground">
              I built Chairlift Habits as a parent of two trying to keep up with daily life. I wanted to teach my toddler meaningful habits, but I had no time to search for books, read reviews, buy them, and wait. The few books I found stopped working within days. They did not match her interests, her struggles, or the world she saw each day.
            </p>
            <p className="text-lg text-muted-foreground">
              I needed a new approach. Stories shaped around her. Stories with the characters she loved. Stories tied to the habits she needed in that moment. Stories created in minutes. If a story stayed relevant for fourteen days, that was enough.
            </p>
            <p className="text-lg text-muted-foreground">
              After many trials, I created daily ABC illustrations. One new story each morning. She focused. She practiced reading. She followed the habits she saw modeled. It worked.
            </p>
          </div>
        </div>
      </PreviewSection>

      {/* The Name Section */}
      <PreviewSection variant="feature">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <MountainSnow className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              The Name
            </h2>
          </div>
          <div className="prose prose-lg max-w-none space-y-4">
            <p className="text-lg text-muted-foreground">
              The name Chairlift Habits comes from the more than four hundred times I have taken my daughter snowboarding. Each ride up the chairlift gives us a quiet moment without distractions. It became the perfect time to practice one idea together.
            </p>
            <p className="text-lg text-muted-foreground">
              Often it was the foundations of reading. One word. One sound. One habit. That rhythm shaped everything that followed.
            </p>
          </div>
        </div>
      </PreviewSection>

      {/* Mission, Vision, Goal Section */}
      <PreviewSection variant="explainer">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {missionVisionGoal.map((item, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </PreviewSection>

      {/* Why We Exist Section */}
      <PreviewSection variant="default">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Why We Exist
          </h2>
          <div className="prose prose-lg max-w-none space-y-4">
            <p className="text-lg text-muted-foreground">
              Parents need support that fits the pace and pressure of real life. Toddlers learn best when stories feel familiar and simple. When these two truths align, habits start to grow.
            </p>
            <p className="text-lg text-muted-foreground font-medium text-foreground">
              Chairlift Habits gives families a clear path to early learning. One story. One moment. One habit each day.
            </p>
          </div>
        </div>
      </PreviewSection>

      {/* About Me Section */}
      <PreviewSection variant="feature">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              About Me
            </h2>
          </div>
          <div className="prose prose-lg max-w-none space-y-4">
            <p className="text-lg text-muted-foreground">
              I have spent my career as a healthcare product designer with a focus on clinical AI. My work centers on turning complex problems into clear, usable systems that help clinicians. I learned the value of simplicity, structure, and daily improvement in that environment.
            </p>
            <p className="text-lg text-muted-foreground">
              Chairlift Habits grew out of that same mindset. As a parent, I needed a practical way to build healthy habits with my children without adding more stress. I built the tool I needed, then shaped it into something other families could use.
            </p>
          </div>
        </div>
      </PreviewSection>

      {/* Get Involved Section */}
      <PreviewSection variant="cta">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Get Involved
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Chairlift Habits is not a VC-backed company. It is a small-business passion project built in real time by a parent who cares about early learning. Your voice matters. If you have an idea or see a way to make this better for your family, tell me. I will work to find the best path forward and build what brings value to you.
          </p>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => window.location.href = 'mailto:support@chairlifthabits.com'}
            className="text-lg px-8"
          >
            Contact Me
          </Button>
        </div>
      </PreviewSection>

      {/* Final CTA Section */}
      <PreviewSection variant="cta">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Start Building Habits Today
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join families who are building daily reading habits with personalized stories.
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
