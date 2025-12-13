import { Card } from '@/components/ui/card';
import { BookOpen, TrendingUp, CheckCircle, RotateCcw } from 'lucide-react';
import { KidReadingActivity } from '@/hooks/useKidActivityAnalytics';

interface KidActivitySummaryCardsProps {
  activities: KidReadingActivity[];
}

export const KidActivitySummaryCards = ({ activities }: KidActivitySummaryCardsProps) => {
  const totalBooks = activities.length;
  const totalSessions = activities.reduce((sum, a) => sum + a.view_count, 0);
  const completedBooks = activities.filter(a => a.reading_completed).length;
  const totalCompletions = activities.reduce((sum, a) => sum + (a.completion_count || 0), 0);
  
  const cards = [
    {
      title: 'Books Read',
      value: totalBooks,
      icon: BookOpen,
      description: 'Unique books accessed',
    },
    {
      title: 'Reading Sessions',
      value: totalSessions,
      icon: TrendingUp,
      description: 'Total reading sessions',
    },
    {
      title: 'Completed',
      value: completedBooks,
      icon: CheckCircle,
      description: `${totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0}% completion rate`,
    },
    {
      title: 'Total Completions',
      value: totalCompletions,
      icon: RotateCcw,
      description: 'Times finished books (re-reads included)',
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
              {card.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </Card>
        );
      })}
    </div>
  );
};
