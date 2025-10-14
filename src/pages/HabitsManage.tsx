import { useState } from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { HabitCard, CreateHabitModal } from '@/components/habits';
import { useHabits } from '@/hooks/useHabits';
import { useDeleteHabit } from '@/hooks/useDeleteHabit';
import { useHabitSchedule } from '@/hooks/useHabitSchedule';
import { useToggleHabitSchedule } from '@/hooks/useToggleHabitSchedule';
import { LoadingState } from '@/components/ui/loading-state';
import { Link } from 'react-router-dom';
import { addDays } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function HabitsManage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const { data: habits = [], isLoading } = useHabits();
  const deleteHabit = useDeleteHabit();
  
  const tomorrow = addDays(new Date(), 1);
  const { data: scheduledHabits = new Set() } = useHabitSchedule(tomorrow);
  const toggleSchedule = useToggleHabitSchedule();

  const handleDeleteClick = (habitId: string) => {
    setHabitToDelete(habitId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (habitToDelete) {
      deleteHabit.mutate(habitToDelete);
      setDeleteDialogOpen(false);
      setHabitToDelete(null);
    }
  };

  const handleScheduleToggle = (habitId: string) => {
    toggleSchedule.mutate({
      habitId,
      isCurrentlyScheduled: scheduledHabits.has(habitId),
      date: tomorrow,
    });
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
                onDelete={handleDeleteClick}
                isScheduled={scheduledHabits.has(habit.id)}
                onScheduleToggle={handleScheduleToggle}
              />
            ))}
          </div>
        )}

        <CreateHabitModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Habit</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this habit? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </StandardPageLayout>
  );
}
