import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const PreviewHero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
          Chairlift Habits
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Helping toddlers grow one habit at a time. Personalized AI picture books shaped around your child—their interests, their struggles, their world. One story. One moment. One habit each day.
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
          Simple setup. Cancel anytime. 30-day money-back guarantee.
        </p>
      </div>
    </div>
  );
};
