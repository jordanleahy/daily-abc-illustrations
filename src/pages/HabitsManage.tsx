import { useState } from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { HabitCard, CreateHabitModal } from '@/components/habits';
import { useHabits } from '@/hooks/useHabits';
import { useDeleteHabit } from '@/hooks/useDeleteHabit';
import { LoadingState } from '@/components/ui/loading-state';
import { Link } from 'react-router-dom';

export default function HabitsManage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: habits = [], isLoading } = useHabits();
  const deleteHabit = useDeleteHabit();

  const handleDelete = (habitId: string) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      deleteHabit.mutate(habitId);
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
              <Link to="/habits/track">Track Today's Habits</Link>
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
              No habits created yet. Create your first habit to get started!
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Habit
            </Button>
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
