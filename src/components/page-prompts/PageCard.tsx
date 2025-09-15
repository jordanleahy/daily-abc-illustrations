import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePageSystemPrompt } from '@/hooks/usePageSystemPrompt';
import { PageImageSection } from '@/components/PageImageSection';
import type { Page } from '@/types/book';

interface PageCardProps {
  page: Page;
  bookId: string;
}

export function PageCard({ page, bookId }: PageCardProps) {
  const { currentPrompt } = usePageSystemPrompt(page.id);
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
            {page.letter}
          </Badge>
          <div className="flex items-center gap-2">
            {currentPrompt && (
              <Badge variant="secondary" className="text-xs">
                Version {currentPrompt.version_number}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page.page_number}
            </span>
          </div>
        </div>
        <CardTitle className="text-lg line-clamp-2">
          {page.title}
        </CardTitle>
        {page.description && (
          <CardDescription className="line-clamp-2">
            {page.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <PageImageSection 
          pageId={page.id}
          bookId={bookId}
        />
      </CardContent>
    </Card>
  );
}