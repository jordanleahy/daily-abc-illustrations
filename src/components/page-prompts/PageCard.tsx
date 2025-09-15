import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { usePageSystemPrompt } from '@/hooks/usePageSystemPrompt';
import { PageImageSection } from '@/components/PageImageSection';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Page } from '@/types/book';

interface PageCardProps {
  page: Page;
  bookId: string;
}

export function PageCard({ page, bookId }: PageCardProps) {
  const { currentPrompt, refreshData } = usePageSystemPrompt(page.id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegeneratePrompt = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to regenerate prompts",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRegenerating(true);
      
      const { error } = await supabase.functions.invoke('generate-image-prompt', {
        body: {
          pageId: page.id,
          userId: user.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Page prompt regenerated successfully",
      });

      // Refresh the prompt data to show the new version
      refreshData();
    } catch (error) {
      console.error('Error regenerating prompt:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate page prompt",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              {page.letter}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={handleRegeneratePrompt}
              disabled={isRegenerating}
              title="Regenerate page prompt"
              aria-label="Regenerate page prompt"
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
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