import { Badge } from '@/components/ui/badge';
import { Sparkles, Book, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PagePromptStatusBadgeProps {
  pageId: string;
}

/**
 * Badge component showing whether a page has an AI-generated prompt
 * or is using the generic book-level style guide
 */
export function PagePromptStatusBadge({ pageId }: PagePromptStatusBadgeProps) {
  const { data: pagePrompt } = useQuery({
    queryKey: ['pageSystemPrompt', pageId, 'deployed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_system_prompts')
        .select('*')
        .eq('page_id', pageId)
        .eq('is_deployed', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  if (!pagePrompt) {
    return (
      <Badge variant="outline" className="gap-1 bg-muted">
        <Book className="h-3 w-3" />
        Book Style Guide
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="gap-1 bg-primary">
      <Sparkles className="h-3 w-3" />
      AI Page Prompt
    </Badge>
  );
}
