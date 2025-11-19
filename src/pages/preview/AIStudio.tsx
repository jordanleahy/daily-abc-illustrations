import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const AIStudio = () => {
  const navigate = useNavigate();

  return (
    <PreviewPageLayout>
      {/* Hero */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            AI Book Studio
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create personalized stories with AI agents that understand your child's interests and reading level.
          </p>
        </div>
      </PreviewSection>

      {/* How It Works */}
      <PreviewSection variant="feature">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Stories that feel personal
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Bring a few details about your child, and Chairlift creates a story built just for them.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">AI agents generate new daily books at 7:01 AM Eastern Time</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Parents guide themes, characters, and difficulty through a simple chat</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Books stay in your family library for re-reading and habit tracking</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">AI creation interface</span>
          </div>
        </div>
      </PreviewSection>

      {/* Daily Books */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Daily book preview</span>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Fresh content every day
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Wake up to a new AI-generated book in your library
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">One free daily book for every family</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Plus subscribers see the full daily stream and back catalog</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Each book tagged by type, theme, and difficulty</span>
              </li>
            </ul>
          </div>
        </div>
      </PreviewSection>

      {/* Book Types */}
      <PreviewSection variant="feature">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Multiple book types
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            Choose the learning focus that fits your child's needs
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {['ABC Books', 'Numbers', 'Animals', 'Colors', 'Emotions', 'Shapes', 'Sight Words', 'Rhyming', 'Opposites'].map((type) => (
              <div key={type} className="p-6 rounded-lg border border-border bg-card">
                <h3 className="font-semibold text-foreground">{type}</h3>
              </div>
            ))}
          </div>
        </div>
      </PreviewSection>

      {/* Custom Creation */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Custom book creation
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Guide the AI through a simple chat to create exactly what you need
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Choose themes your child loves</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Set the reading level and vocabulary complexity</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">Add character names and preferences</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg aspect-video flex items-center justify-center">
            <span className="text-muted-foreground">Chat interface</span>
          </div>
        </div>
      </PreviewSection>

      {/* CTA */}
      <PreviewSection variant="cta">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Create your first AI book
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

export default AIStudio;
