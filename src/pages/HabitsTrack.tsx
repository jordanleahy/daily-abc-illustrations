import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { useHabits } from '@/hooks/useHabits';
import { LoadingState } from '@/components/ui/loading-state';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HabitsTrack() {
  const { data: habits = [], isLoading } = useHabits();

  // Filter only daily habits (for now all are daily)
  const dailyHabits = habits.filter(habit => habit.frequency === 'daily');

  const formatDeadlineTime = (time: string) => {
    try {
      return format(new Date(`2000-01-01T${time}`), 'h:mm a');
    } catch {
      return time;
    }
  };

  return (
    <StandardPageLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold">Track Today's Habits</h1>
            <p className="text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          
          <Button asChild variant="outline">
            <Link to="/habits/manage">Manage Habits</Link>
          </Button>
        </div>

        {isLoading ? (
          <LoadingState text="Loading today's habits..." />
        ) : dailyHabits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No habits scheduled for today. Create habits in the Manage Habits page to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dailyHabits.map((habit) => (
              <Card key={habit.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{habit.title}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="capitalize">
                          {habit.frequency}
                        </Badge>
                        {habit.deadline_time && (
                          <Badge variant="default">
                            <Clock className="h-3 w-3 mr-1" />
                            Due: {formatDeadlineTime(habit.deadline_time)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {habit.photo_url && (
                    <img 
                      src={habit.photo_url} 
                      alt={habit.title}
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                  
                  {habit.description && (
                    <p className="text-sm text-muted-foreground">{habit.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-amber-500" />
                      <span className="font-semibold">{habit.coin_amount} coins</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Skip
                      </Button>
                      <Button size="sm">
                        Complete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
}
