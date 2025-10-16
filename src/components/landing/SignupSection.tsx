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
          Sign up free to access the full library, or upgrade to Plus for Habits & Rewards
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/auth?mode=signup')}
            size="lg"
            variant="secondary"
            className="text-lg px-8"
          >
            Sign Up Free
          </Button>
          <Button 
            onClick={() => navigate('/pricing')}
            size="lg"
            variant="outline"
            className="text-lg px-8 bg-white/10 hover:bg-white/20"
          >
            View Plans
          </Button>
        </div>

        <p className="text-sm mt-6 opacity-75">
          Free library access • No credit card required
        </p>
      </div>
    </section>
  );
};
