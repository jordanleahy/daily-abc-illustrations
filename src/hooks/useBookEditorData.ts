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

      // Fetch all data in parallel
      const [bookResult, pagesResult, imagesResult] = await Promise.all([
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
        
        // All latest images with deployed prompts (including coloring and text images)
        supabase
          .from('page_image_urls')
          .select(`
            id, image_url, coloring_image_url, text_image_url, page_id, generation_cost_cents,
            pages!inner(page_number, page_type)
          `)
          .eq('book_id', bookId)
          .eq('is_latest', true)
      ]);

      if (bookResult.error) throw bookResult.error;

      const book = bookResult.data;
      const pages = pagesResult.data || [];
      const images = imagesResult.data || [];

      // Build image maps (color, coloring/B&W, text images, and B&W costs)
      const pageImages: Record<number, string> = {};
      const pageColoringImages: Record<number, string> = {};
      const pageTextImages: Record<number, string> = {};
      const pageBwCosts: Record<number, number> = {};
      images.forEach((item: any) => {
        if (item.pages?.page_number !== undefined) {
          if (item.image_url) {
            pageImages[item.pages.page_number] = item.image_url;
          }
          if (item.coloring_image_url) {
            pageColoringImages[item.pages.page_number] = item.coloring_image_url;
            // Store B&W cost if available
            if (item.generation_cost_cents) {
              pageBwCosts[item.pages.page_number] = item.generation_cost_cents;
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

      // Fetch deployed prompts if we have pages
      let deployedPrompts: Record<number, string> = {};
      if (pages.length > 0) {
        const pageIds = pages.map(p => p.id);
        const { data: promptsData } = await supabase
          .from('page_system_prompts')
          .select('page_id, content')
          .in('page_id', pageIds)
          .eq('is_deployed', true);

        promptsData?.forEach((prompt) => {
          const page = pages.find(p => p.id === prompt.page_id);
          if (page) {
            deployedPrompts[page.page_number] = prompt.content;
          }
        });
      }

      return {
        book,
        pages,
        pageImages,
        pageColoringImages,
        pageTextImages,
        pageBwCosts,
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
