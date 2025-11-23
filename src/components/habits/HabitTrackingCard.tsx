import { HabitCompletionWithDetails } from '@/types/habit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Shimmer } from '@/components/ui/shimmer';
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
import { X, Coins, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useMarkHabitComplete } from '@/hooks/useMarkHabitComplete';
import { useDeleteHabitCompletion } from '@/hooks/useDeleteHabitCompletion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface HabitTrackingCardProps {
  completion: HabitCompletionWithDetails;
}

export function HabitTrackingCard({ completion }: HabitTrackingCardProps) {
  const navigate = useNavigate();
  const markComplete = useMarkHabitComplete();
  const deleteHabitCompletion = useDeleteHabitCompletion();
  const { toast } = useToast();
  const [isResolving, setIsResolving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const habit = completion.habit_assignments.habits;
  const kid = completion.habit_assignments.kid_profiles;

  const formatDeadlineTime = (time: string | null) => {
    if (!time) return null;
    try {
      return format(parseISO(`2000-01-01T${time}`), 'h:mm a');
    } catch {
      return time;
    }
  };

  const formatMarkedTime = (timestamp: string | null) => {
    if (!timestamp) return null;
    try {
      return format(parseISO(timestamp), 'h:mm a');
    } catch {
      return timestamp;
    }
  };

  const handleMarkComplete = (isComplete: boolean) => {
    markComplete.mutate({
      completionId: completion.id,
      isComplete,
      coinsAmount: completion.coins_deposited,
      kidId: completion.kid_profile_id,
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteHabitCompletion.mutate(completion.id);
    setShowDeleteDialog(false);
  };

  const handleStartReading = async () => {
    setIsResolving(true);
    try {
      let dailyPublishedId: string | null = null;

      // Try using book_id first if it exists
      if (habit.book_id) {
        const { data } = await supabase
          .from('daily_published')
          .select('id')
          .eq('book_id', habit.book_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) {
          dailyPublishedId = data.id;
        }
      }

      // If no book_id or not found, try to infer from title
      if (!dailyPublishedId) {
        const bookTitle = habit.title.replace(/^Read:\s*/i, '').trim();
        
        if (bookTitle) {
          const { data } = await supabase
            .from('daily_published')
            .select('id, title')
            .ilike('title', `%${bookTitle}%`)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (data) {
            dailyPublishedId = data.id;
          }
        }
      }

      if (dailyPublishedId) {
        navigate(`/library/${dailyPublishedId}`);
      } else {
        toast({
          title: 'Book not found',
          description: "Couldn't find this book in your library",
          variant: 'destructive',
        });
        navigate('/library');
      }
    } catch (error) {
      console.error('Error resolving book:', error);
      toast({
        title: 'Error',
        description: 'Failed to open the book',
        variant: 'destructive',
      });
    } finally {
      setIsResolving(false);
    }
  };

  const isPending = completion.status === 'pending';
  const isCompleted = completion.status === 'completed';
  const isDeclined = completion.status === 'declined';
  const isProcessing = markComplete.isPending || deleteHabitCompletion.isPending;

  return (
    <>
      <Shimmer 
        isShimmering={isProcessing}
        className="rounded-lg"
      >
      <Card className={`h-full flex flex-col ${
        isCompleted ? 'border-green-500 bg-green-50/50' :
        isDeclined ? 'border-red-500 bg-red-50/50' :
        ''
      }`}>
      <CardHeader>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Coins className="h-5 w-5 text-amber-500" />
            <span className="font-semibold text-lg">{habit.coin_amount} coins</span>
          </div>
          
          {isPending && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDeleteClick}
              disabled={deleteHabitCompletion.isPending}
              title="Remove from today's list"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{habit.title}</CardTitle>
              {completion.instance_number > 1 && (
                <Badge variant="outline" className="text-xs">
                  #{completion.instance_number}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {kid.first_name} {kid.last_name}
            </p>
          </div>
          
          {habit.deadline_time && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Due: {formatDeadlineTime(habit.deadline_time)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 flex flex-col">
        <div className="space-y-3">
          {habit.photo_url && (
            <AspectRatio ratio={16/9} className="rounded-lg overflow-hidden">
              <img 
                src={habit.photo_url} 
                alt={habit.title}
                className="w-full h-full object-cover"
              />
            </AspectRatio>
          )}

          {habit.description && (
            <p className="text-sm text-muted-foreground">{habit.description}</p>
          )}
        </div>

        <div className="mt-auto pt-3">
          {isPending ? (
            (habit.book_id || habit.title.toLowerCase().includes('read')) ? (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleStartReading}
                  disabled={isResolving}
                  className="w-full"
                  variant="default"
                >
                  {isResolving ? 'Loading...' : 'Start Reading'}
                </Button>
                
                <Button
                  onClick={() => handleMarkComplete(false)}
                  disabled={markComplete.isPending}
                  className="w-full"
                  variant="destructive"
                >
                  Wrong
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleMarkComplete(true)}
                  disabled={markComplete.isPending}
                  className="w-full"
                  variant="success"
                >
                  Right
                </Button>
                
                <Button
                  onClick={() => handleMarkComplete(false)}
                  disabled={markComplete.isPending}
                  className="w-full"
                  variant="destructive"
                >
                  Wrong
                </Button>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <Badge variant={isCompleted ? 'default' : 'destructive'} className="w-full justify-center py-2">
                {isCompleted ? '✓ Completed' : '✗ Not Done'}
              </Badge>
              {completion.marked_at && (
                <p className="text-xs text-center text-muted-foreground">
                  Marked at {formatMarkedTime(completion.marked_at)}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      </Card>
      </Shimmer>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove task from today's list?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Remove <span className="font-semibold text-foreground">"{habit.title}"</span> from today's checklist?</p>
              <p className="text-muted-foreground">The habit will remain active and appear again tomorrow.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
