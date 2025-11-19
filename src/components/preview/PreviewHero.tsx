import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const PreviewHero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
          The modern way to grow young readers
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Chairlift Habits helps your family build a daily reading habit with AI-made picture books, progress tracking, and kid-friendly rewards in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
          <Button 
            size="lg"
            onClick={() => navigate('/auth')}
            className="text-lg px-8"
          >
            Start free
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate('/library')}
            className="text-lg px-8"
          >
            View a sample book
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          No setup fee. Cancel anytime. 30-day money-back guarantee.
        </p>
      </div>
    </div>
  );
};
