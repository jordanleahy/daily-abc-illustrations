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
      // Parse words from title
      const words = parseWordsFromTitle(title);
      
      // Update page content with word metadata
      const updatedContent = {
        ...currentContent,
        words
      };
      
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
      queryClient.invalidateQueries({ queryKey: ['book-pages', variables.bookId] });
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
