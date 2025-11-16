import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseWordsFromTitle, WordMetadata } from "@/utils/wordParser";

interface GenerateWordMetadataParams {
  pageId: string;
  bookId: string;
  title: string;
  currentContent: any;
}

export function useWordMetadata() {
  const queryClient = useQueryClient();

  const generateMetadata = useMutation({
    mutationFn: async ({ pageId, title, currentContent }: GenerateWordMetadataParams) => {
      // Step 1: Fetch fresh page content from database to avoid race conditions
      const { data: freshPage, error: fetchError } = await supabase
        .from('pages')
        .select('content')
        .eq('id', pageId)
        .single();

      if (fetchError) throw fetchError;

      // Step 2: Parse fresh content and determine source text for word generation
      // Priority: textOverlay.text (if enabled) > title (fallback)
      const baseContent = (freshPage?.content && typeof freshPage.content === 'object') 
        ? freshPage.content 
        : {};
      
      const hasTextOverlay = (baseContent as any).textOverlay?.enabled && (baseContent as any).textOverlay?.text;
      const sourceText = hasTextOverlay ? (baseContent as any).textOverlay.text : title;
      
      // Step 3: Parse words from the source text
      const words = parseWordsFromTitle(sourceText);
      
      // Step 4: Merge with FRESH content (preserves concurrent updates like textOverlay)
      const updatedContent = {
        ...baseContent,
        words
      } as any;
      
      // Step 4: Update database with merged content
      const { error } = await supabase
        .from('pages')
        .update({ 
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', pageId);

      if (error) throw error;

      return { words, content: updatedContent };
    },
    onSuccess: (_, variables) => {
      // Invalidate all page queries across different views
      queryClient.invalidateQueries({ queryKey: ['book-pages', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['library-book-pages-decoupled', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-pages', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['page', variables.pageId] });
    },
    onError: (error) => {
      console.error('Error generating word metadata:', error);
      toast.error('Failed to generate word metadata');
    }
  });

  return {
    generateMetadata: generateMetadata.mutateAsync,
    isGenerating: generateMetadata.isPending
  };
}
