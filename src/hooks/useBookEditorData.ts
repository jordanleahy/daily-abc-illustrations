import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Consolidated hook for fetching all book editor data in a single query
 * Replaces: useBookSessionData, useBookPages, useBookPageImages, useBookCoverPage, useBookCoverImage, book query, deployedPrompts query
 */
export function useBookEditorData(bookId: string | null | undefined) {
  return useQuery({
    queryKey: ['book-editor-data', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      // Fetch all data in parallel (including deployed prompts)
      const [bookResult, pagesResult, imagesResult, promptsResult] = await Promise.all([
        // Book with chat session data
        supabase
          .from('books')
          .select('*, gemini_chat_sessions(qa_page_prompts, qa_page_images)')
          .eq('id', bookId)
          .single(),
        
        // All pages for this book
        supabase
          .from('pages')
          .select('id, page_number, title, description, content, page_type, letter')
          .eq('book_id', bookId)
          .order('page_number', { ascending: true }),
        
        // All latest images (including coloring and text images)
        supabase
          .from('page_image_urls')
          .select(`
            id, image_url, coloring_image_url, text_image_url, page_id, generation_cost_cents, color_generation_cost_cents,
            pages!inner(page_number, page_type)
          `)
          .eq('book_id', bookId)
          .eq('is_latest', true),
        
        // Deployed prompts with page number via join (parallel fetch!)
        supabase
          .from('page_system_prompts')
          .select('content, pages!inner(page_number)')
          .eq('pages.book_id', bookId)
          .eq('is_deployed', true)
      ]);

      if (bookResult.error) throw bookResult.error;

      const book = bookResult.data;
      const pages = pagesResult.data || [];
      const images = imagesResult.data || [];
      const promptsData = promptsResult.data || [];

      // Build deployed prompts map from parallel query
      const deployedPrompts: Record<number, string> = {};
      promptsData.forEach((prompt: any) => {
        if (prompt.pages?.page_number !== undefined) {
          deployedPrompts[prompt.pages.page_number] = prompt.content;
        }
      });

      // Build image maps (color, coloring/B&W, text images, and costs)
      const pageImages: Record<number, string> = {};
      const pageColoringImages: Record<number, string> = {};
      const pageTextImages: Record<number, string> = {};
      const pageBwCosts: Record<number, number> = {};
      const pageColorCosts: Record<number, number> = {};
      images.forEach((item: any) => {
        if (item.pages?.page_number !== undefined) {
          if (item.image_url) {
            pageImages[item.pages.page_number] = item.image_url;
            if (item.color_generation_cost_cents) {
              pageColorCosts[item.pages.page_number] = item.color_generation_cost_cents;
            }
          }
          if (item.coloring_image_url) {
            pageColoringImages[item.pages.page_number] = item.coloring_image_url;
            if (item.color_generation_cost_cents) {
              pageBwCosts[item.pages.page_number] = item.color_generation_cost_cents;
            }
          }
          if (item.text_image_url) {
            pageTextImages[item.pages.page_number] = item.text_image_url;
          }
        }
      });

      // Find cover page and image
      const coverPage = pages.find(p => p.page_type === 'cover') || pages.find(p => p.page_number === 1);
      const coverImageUrl = coverPage ? pageImages[coverPage.page_number] : null;

      // Build text overlays
      const pageTextOverlays: Record<number, string> = {};
      pages.forEach(p => {
        pageTextOverlays[p.page_number] = p.title;
      });

      // Get session data
      const sessionData = book.gemini_chat_sessions;
      const sessionPrompts = (sessionData?.qa_page_prompts as Record<number, string>) || {};
      const sessionImages = (sessionData?.qa_page_images as Record<number, string>) || {};

      return {
        book,
        pages,
        pageImages,
        pageColoringImages,
        pageTextImages,
        pageBwCosts,
        pageColorCosts,
        coverPage,
        coverImageUrl,
        pageTextOverlays,
        sessionPrompts,
        sessionImages,
        deployedPrompts,
        pageCount: pages.length || 26,
      };
    },
    enabled: !!bookId,
    staleTime: 30 * 1000, // 30 seconds
  });
}
