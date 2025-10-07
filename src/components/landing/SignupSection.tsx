import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const SignupSection = () => {
  const navigate = useNavigate();

  return (
    <section className="w-full py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Start Your Daily Story Tradition
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Join today and get your first week of books delivered daily at 7:01 AM Eastern Time
        </p>
        
        <Button 
          onClick={() => navigate('/pricing')}
          size="lg"
          variant="secondary"
          className="text-lg px-8"
        >
          Subscribe Now
        </Button>

        <p className="text-sm mt-6 opacity-75">
          No credit card required • Cancel anytime • New book every day
        </p>
      </div>
    </section>
  );
};
