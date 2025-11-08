import { useState } from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { HabitCard, CreateHabitModal, EditHabitModal } from '@/components/habits';
import { useHabits } from '@/hooks/useHabits';
import { useDeleteHabit } from '@/hooks/useDeleteHabit';
import { useHabitSchedule } from '@/hooks/useHabitSchedule';
import { useToggleHabitSchedule } from '@/hooks/useToggleHabitSchedule';
import { useAddHabitToday } from '@/hooks/useAddHabitToday';
import { useTodayHabits } from '@/hooks/useTodayHabits';
import { useToggleAutoSchedule } from '@/hooks/useToggleAutoSchedule';
import { LoadingState } from '@/components/ui/loading-state';
import { Link } from 'react-router-dom';
import { addDays } from 'date-fns';
import { Habit } from '@/types/habit';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const { data: habits = [], isLoading } = useHabits();
  const deleteHabit = useDeleteHabit();
  
  const tomorrow = addDays(new Date(), 1);
  const { data: scheduledHabits = new Set() } = useHabitSchedule(tomorrow);
  const { data: todayCompletions = [] } = useTodayHabits();
  const toggleSchedule = useToggleHabitSchedule();
  const addToday = useAddHabitToday();
  const toggleAutoSchedule = useToggleAutoSchedule();

  // Count how many times each habit has been added today
  const todayHabitsCount = todayCompletions.reduce((acc, completion) => {
    const habitId = completion.habit_assignments?.habits?.id;
    if (habitId) {
      acc.set(habitId, (acc.get(habitId) || 0) + 1);
    }
    return acc;
  }, new Map<string, number>());

  const handleEditClick = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      setEditingHabit(habit);
      setShowEditModal(true);
    }
  };

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

  const handleAddToday = (habitId: string) => {
    addToday.mutate(habitId);
  };

  const handleToggleAutoSchedule = (habitId: string, isCurrentlyAuto: boolean) => {
    toggleAutoSchedule.mutate({ habitId, isAutoSchedule: !isCurrentlyAuto });
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
            <p className="text-sm text-primary mt-1 font-medium">
              💡 Use "Add Today" to add habits to today's checklist, or "Schedule for Tomorrow" to queue them for tomorrow
            </p>
          </div>
          
          <div className="flex gap-2">
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
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                isScheduled={scheduledHabits.has(habit.id)}
                onScheduleToggle={handleScheduleToggle}
                onAddToday={handleAddToday}
                timesAddedToday={todayHabitsCount.get(habit.id) || 0}
                onToggleAutoSchedule={handleToggleAutoSchedule}
              />
            ))}
          </div>
        )}

        <CreateHabitModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
        />

        <EditHabitModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          habit={editingHabit}
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
