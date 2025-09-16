import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageImageSection } from '@/components/PageImageSection';
import type { Page } from '@/types/book';

interface UserPageCardProps {
  page: Page;
  bookId: string;
}

export function UserPageCard({ page, bookId }: UserPageCardProps) {
  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold text-foreground">
            {page.title}
          </CardTitle>
          <div className="text-sm text-muted-foreground font-medium">
            Page {page.page_number}
          </div>
        </div>
        {page.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {page.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Large illustration area */}
        <div className="aspect-square bg-gradient-to-br from-background to-muted/50">
          <PageImageSection 
            pageId={page.id}
            bookId={bookId}
          />
        </div>
      </CardContent>
    </Card>
  );
}