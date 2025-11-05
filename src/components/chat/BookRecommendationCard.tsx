import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface BookRecommendationCardProps {
  title: string;
  description: string;
}

export const BookRecommendationCard = memo(({ title, description }: BookRecommendationCardProps) => {
  return (
    <Card className="animate-fade-in hover-scale border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm leading-relaxed text-foreground/80">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
});

BookRecommendationCard.displayName = 'BookRecommendationCard';
