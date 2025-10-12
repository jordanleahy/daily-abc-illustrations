import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { HabitTrackingCard } from '@/components/habits';
import { useTodayHabits } from '@/hooks/useTodayHabits';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { LoadingState } from '@/components/ui/loading-state';
import { format } from 'date-fns';
import { CoinCounter } from '@/components/ui/coin-counter';
import { getTimeBasedGreeting } from '@/utils/timeUtils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSeeding, setIsSeeding] = useState(false);
  
  // Get the first kid profile
  const { data: kidProfiles = [], isLoading: isLoadingKids } = useKidProfiles();
  const firstKid = kidProfiles[0];
  
  // Fetch today's habits for the first kid
  const { data: completions = [], isLoading: isLoadingHabits } = useTodayHabits(firstKid?.id);
  
  const isLoading = isLoadingKids || isLoadingHabits;
  const timeOfDay = getTimeBasedGreeting();

  const handleSeedHabits = async () => {
    setIsSeeding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('seed_user_habits', {
        p_parent_user_id: user?.id
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string; habits_created?: number };
      
      if (result?.success) {
        toast({
          title: 'Success!',
          description: `${result.habits_created} habits created for your family`,
        });
        queryClient.invalidateQueries({ queryKey: ['habits'] });
        queryClient.invalidateQueries({ queryKey: ['todayHabits'] });
      } else {
        toast({
          title: 'Info',
          description: result?.message || 'Habits already configured',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to set up habits',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  if (isLoading) {
    return (
      <StandardPageLayout>
        <div className="container mx-auto py-8">
          <LoadingState text="Loading your habits..." />
        </div>
      </StandardPageLayout>
    );
  }

  if (!firstKid) {
    return (
      <StandardPageLayout>
        <div className="container mx-auto py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No kid profiles found. Please create a kid profile first.
            </p>
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Child-focused header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-4xl font-bold">
              Good {timeOfDay}, {firstKid.first_name}!
            </h1>
            <CoinCounter coins={firstKid.earned_coins} size="md" />
          </div>
          <p className="text-xl text-muted-foreground">
            Today is {format(new Date(), 'EEEE, MMMM do')}
          </p>
          <p className="text-lg text-muted-foreground">
            Here is your {timeOfDay} to-do list
          </p>
        </div>

        {/* Habits list */}
        {completions.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg space-y-4">
            <p className="text-lg text-muted-foreground">
              No habits for today. Let's set up your daily habits!
            </p>
            <Button onClick={handleSeedHabits} disabled={isSeeding} size="lg">
              {isSeeding ? 'Setting up...' : 'Set Up My Daily Habits'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completions.map((completion) => (
              <HabitTrackingCard
                key={completion.id}
                completion={completion}
              />
            ))}
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
};

export default Index;
