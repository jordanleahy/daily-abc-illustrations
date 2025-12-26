import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { compositeTextOnImage } from '@/utils/imageTextCompositor';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

export interface TextImageProgress {
  current: number;
  total: number;
  status: 'idle' | 'processing' | 'complete' | 'cancelled' | 'error';
  currentPageLetter: string | null;
  failedPages: { pageNumber: number; letter: string; error: string }[];
  completedPages: number[];
}

interface PageToProcess {
  pageId: string;
  pageNumber: number;
  letter: string;
  colorImageUrl: string;
  textOverlay: string;
}

const DELAY_BETWEEN_PAGES_MS = 300;

export function useGenerateAllTextImages(bookId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthContext();
  const cancelledRef = useRef(false);
  
  const [progress, setProgress] = useState<TextImageProgress>({
    current: 0,
    total: 0,
    status: 'idle',
    currentPageLetter: null,
    failedPages: [],
    completedPages: [],
  });

  const reset = useCallback(() => {
    cancelledRef.current = false;
    setProgress({
      current: 0,
      total: 0,
      status: 'idle',
      currentPageLetter: null,
      failedPages: [],
      completedPages: [],
    });
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setProgress(prev => ({ ...prev, status: 'cancelled' }));
  }, []);

  const generateAll = useCallback(async () => {
    if (!bookId) {
      toast({ title: 'No book selected', variant: 'destructive' });
      return;
    }

    if (!user?.id) {
      toast({ title: 'Not authenticated', variant: 'destructive' });
      return;
    }

    cancelledRef.current = false;

    // Fetch all pages with their data
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, page_number, letter, title, page_type')
      .eq('book_id', bookId)
      .order('page_number');

    if (pagesError || !pages) {
      toast({ title: 'Failed to fetch pages', variant: 'destructive' });
      return;
    }

    // Fetch all page images
    const { data: pageImages, error: imagesError } = await supabase
      .from('page_image_urls')
      .select('page_id, image_url, text_image_url')
      .eq('book_id', bookId)
      .eq('is_latest', true);

    if (imagesError) {
      toast({ title: 'Failed to fetch page images', variant: 'destructive' });
      return;
    }

    // Build a map of page_id -> image data
    const imageMap = new Map(pageImages?.map(img => [img.page_id, img]) || []);

    // Filter pages that need text images:
    // - Must have color image
    // - Must NOT already have text image
    // - Must have text overlay (title)
    // - Only content pages (page_type = 'content', page_number >= 3)
    const pagesToProcess: PageToProcess[] = [];

    for (const page of pages) {
      // Skip cover and educational pages
      if (page.page_number < 3 || page.page_type !== 'content') continue;

      const imageData = imageMap.get(page.id);
      
      // Must have color image
      if (!imageData?.image_url) continue;
      
      // Skip if already has text image
      if (imageData.text_image_url) continue;
      
      // Must have title/text
      if (!page.title) continue;

      pagesToProcess.push({
        pageId: page.id,
        pageNumber: page.page_number,
        letter: page.letter,
        colorImageUrl: imageData.image_url,
        textOverlay: page.title,
      });
    }

    if (pagesToProcess.length === 0) {
      toast({ 
        title: 'No pages to process', 
        description: 'All content pages already have text images or are missing color images' 
      });
      return;
    }

    // Initialize progress
    setProgress({
      current: 0,
      total: pagesToProcess.length,
      status: 'processing',
      currentPageLetter: null,
      failedPages: [],
      completedPages: [],
    });

    const failedPages: TextImageProgress['failedPages'] = [];
    const completedPages: number[] = [];

    // Process pages sequentially
    for (let i = 0; i < pagesToProcess.length; i++) {
      // Check for cancellation
      if (cancelledRef.current) {
        setProgress(prev => ({
          ...prev,
          status: 'cancelled',
          current: i,
        }));
        toast({ title: 'Generation cancelled', description: `Completed ${completedPages.length} pages` });
        return;
      }

      const page = pagesToProcess[i];
      
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentPageLetter: page.letter,
      }));

      try {
        // Fetch the color image
        const response = await fetch(page.colorImageUrl);
        if (!response.ok) throw new Error('Failed to fetch image');
        
        const imageBlob = await response.blob();

        // Composite text onto image
        const compositedBlob = await compositeTextOnImage(imageBlob, page.textOverlay);

        // Upload to storage - path must start with user ID for RLS policy
        const fileName = `text-${page.pageId}-${Date.now()}.png`;
        const storagePath = `${user.id}/${bookId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('page-images')
          .upload(storagePath, compositedBlob, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) throw new Error(uploadError.message);

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('page-images')
          .getPublicUrl(storagePath);

        // Update page_image_urls
        const { error: updateError } = await supabase
          .from('page_image_urls')
          .update({ text_image_url: urlData.publicUrl })
          .eq('page_id', page.pageId)
          .eq('is_latest', true);

        if (updateError) throw new Error(updateError.message);

        completedPages.push(page.pageNumber);
        setProgress(prev => ({
          ...prev,
          completedPages: [...prev.completedPages, page.pageNumber],
        }));

        // Progressively invalidate to show images as they're generated
        await queryClient.invalidateQueries({ queryKey: ['book-editor-data', bookId] });

      } catch (error: any) {
        console.error(`Error generating text image for page ${page.letter}:`, error);
        failedPages.push({
          pageNumber: page.pageNumber,
          letter: page.letter,
          error: error.message || 'Unknown error',
        });
        setProgress(prev => ({
          ...prev,
          failedPages: [...prev.failedPages, {
            pageNumber: page.pageNumber,
            letter: page.letter,
            error: error.message || 'Unknown error',
          }],
        }));
      }

      // Add delay between pages
      if (i < pagesToProcess.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PAGES_MS));
      }
    }

    // Complete
    setProgress(prev => ({
      ...prev,
      status: 'complete',
      currentPageLetter: null,
    }));

    // Force refetch to ensure UI is fully up to date
    await queryClient.invalidateQueries({ 
      queryKey: ['book-editor-data', bookId],
      refetchType: 'all' 
    });

    // Show summary toast
    if (failedPages.length === 0) {
      toast({ 
        title: 'All text images generated!', 
        description: `Successfully created ${completedPages.length} text images` 
      });
    } else {
      toast({ 
        title: 'Generation complete with errors', 
        description: `${completedPages.length} succeeded, ${failedPages.length} failed`,
        variant: 'destructive',
      });
    }
  }, [bookId, user, queryClient, toast]);

  const retryFailed = useCallback(async () => {
    if (!bookId || progress.failedPages.length === 0) return;

    // Re-fetch and retry only failed pages
    const failedPageNumbers = progress.failedPages.map(p => p.pageNumber);
    
    // Reset and re-run with just failed pages
    // For simplicity, we'll trigger a full regeneration - the already-completed pages will be skipped
    await generateAll();
  }, [bookId, progress.failedPages, generateAll]);

  return {
    progress,
    generateAll,
    cancel,
    reset,
    retryFailed,
    isProcessing: progress.status === 'processing',
  };
}
