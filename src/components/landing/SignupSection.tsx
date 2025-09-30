import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const SignupSection = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    // Navigate to pricing/signup page
    navigate('/pricing');
  };

  return (
    <section className="w-full py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Start Your Daily Story Tradition
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Join today and get your first week of books delivered daily at 7:01 AM Eastern Time
        </p>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-background text-foreground"
            />
            <Button 
              type="submit"
              size="lg"
              variant="secondary"
              className="sm:w-auto w-full"
            >
              Subscribe Now
            </Button>
          </div>
        </form>

        <p className="text-sm mt-6 opacity-75">
          No credit card required • Cancel anytime • New book every day
        </p>
      </div>
    </section>
  );
};
