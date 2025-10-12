import { useState } from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { HabitCard, CreateHabitModal } from '@/components/habits';
import { useHabits } from '@/hooks/useHabits';
import { useDeleteHabit } from '@/hooks/useDeleteHabit';
import { LoadingState } from '@/components/ui/loading-state';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function HabitsManage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const { data: habits = [], isLoading, refetch } = useHabits();
  const deleteHabit = useDeleteHabit();
  const { toast } = useToast();

  const handleDelete = (habitId: string) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      deleteHabit.mutate(habitId);
    }
  };

  const handleSeedData = async () => {
    if (habits.length > 0) {
      toast({
        title: 'Already Seeded',
        description: 'You already have habits in the database.',
        variant: 'default',
      });
      return;
    }

    setIsSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-initial-habits');
      
      if (error) throw error;
      
      toast({
        title: 'Success!',
        description: `Seeded ${data.data.habits} habits with ${data.data.assignments} assignments and ${data.data.completions} completions.`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to seed habits',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <StandardPageLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Manage Habits</h1>
            <p className="text-muted-foreground">
              Create and manage daily habits for your kids
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/">Track Today's Habits</Link>
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Habit
            </Button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState text="Loading habits..." />
        ) : habits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No habits created yet. Seed initial data or create your first habit!
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleSeedData} disabled={isSeeding} variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                {isSeeding ? 'Seeding...' : 'Seed Initial Habits'}
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Habit
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <CreateHabitModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
        />
      </div>
    </StandardPageLayout>
  );
}
