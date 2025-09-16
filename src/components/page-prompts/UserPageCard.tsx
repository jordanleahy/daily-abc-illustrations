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
        
        {/* Content area with letter and concept */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
              {page.letter}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground">
                {page.content.mainConcept}
              </h3>
              {page.content.funFact && (
                <p className="text-sm text-muted-foreground mt-1">
                  {page.content.funFact}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}