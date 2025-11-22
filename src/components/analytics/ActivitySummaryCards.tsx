import { Card } from '@/components/ui/card';
import { BookOpen, TrendingUp, CheckCircle, Users } from 'lucide-react';
import { UserReadingActivity } from '@/hooks/useUserActivityAnalytics';

interface ActivitySummaryCardsProps {
  activities: UserReadingActivity[];
}

export const ActivitySummaryCards = ({ activities }: ActivitySummaryCardsProps) => {
  const totalBooks = activities.length;
  const totalSessions = activities.reduce((sum, a) => sum + a.view_count, 0);
  const completedBooks = activities.filter(a => a.reading_completed).length;
  
  // Find most active kid
  const kidActivity = activities.reduce((acc, a) => {
    if (a.kid_id) {
      acc[a.kid_id] = (acc[a.kid_id] || 0) + a.view_count;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const mostActiveKidId = Object.entries(kidActivity).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostActiveKid = activities.find(a => a.kid_id === mostActiveKidId)?.kid_name || 'None';
  
  const cards = [
    {
      title: 'Total Books',
      value: totalBooks,
      icon: BookOpen,
      description: 'Books accessed',
    },
    {
      title: 'Reading Sessions',
      value: totalSessions,
      icon: TrendingUp,
      description: 'Total sessions',
    },
    {
      title: 'Completed',
      value: completedBooks,
      icon: CheckCircle,
      description: `${totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0}% completion rate`,
    },
    {
      title: 'Most Active Kid',
      value: mostActiveKid,
      icon: Users,
      description: 'By session count',
      isText: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {card.isText ? card.value : card.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </Card>
        );
      })}
    </div>
  );
};
