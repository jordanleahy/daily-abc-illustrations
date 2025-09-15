import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, ExternalLink, Calendar, BookOpen, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { LatestBookSystemPrompt } from '@/hooks/useLatestBookSystemPrompt';

interface BookSystemPromptDisplayProps {
  promptData: LatestBookSystemPrompt | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const BookSystemPromptDisplay = ({ 
  promptData, 
  isLoading, 
  onRefresh 
}: BookSystemPromptDisplayProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!promptData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">
            Graphics Designer System Instructions
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                No system prompts found. Create a book to generate system instructions for the Graphics Designer agent.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          Graphics Designer System Instructions
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Generated from: {promptData.bookName}
              </CardTitle>
              <CardDescription className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(promptData.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
                {promptData.bookCategory && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {promptData.bookCategory}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={promptData.sourceType === 'generated' ? 'default' : 'secondary'}>
                v{promptData.versionNumber}
              </Badge>
              <Badge variant="outline">
                {promptData.sourceType}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                System Instructions Content
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`/books/${promptData.bookId}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Book
              </Button>
            </div>
            
            <div className="bg-muted/50 rounded-md p-4 border">
              <pre className="text-sm whitespace-pre-wrap text-foreground overflow-auto max-h-96">
                {promptData.content}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
        <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
          About Graphics Designer Instructions
        </p>
        <p className="text-blue-700 dark:text-blue-300">
          These instructions are automatically generated by the Illustration Director agent for each book. 
          They define how the Graphics Designer should create image prompts based on your book's style and content.
        </p>
      </div>
    </div>
  );
};