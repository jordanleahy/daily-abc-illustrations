import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookPages } from '@/hooks/useBookPages';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { useBookCoverPage } from '@/hooks/useBookCoverPage';
import { useBookCoverImage } from '@/hooks/useBookCoverImage';
import { useUpdateBookStatus } from '@/hooks/useUpdateBookStatus';
import { useBookSessionData } from '@/hooks/useBookSessionData';
import { useBookEditorImagePreloader } from '@/hooks/useBookEditorImagePreloader';
import { BookEditorPanel } from '@/components/chat/BookEditorPanel';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { PublicationStatus } from '@/types/shared/status';
import { cn } from '@/lib/utils';

interface BookEditorContainerProps {
  bookId: string;
  isMobile: boolean;
  onClose: () => void;
}

/**
 * BookEditorContainer - Lazy-loaded container for book editor
 * 
 * This component encapsulates all editor-related hooks and state,
 * preventing them from loading until a book is actually selected for editing.
 * This significantly improves initial page load performance.
 */
export function BookEditorContainer({ bookId, isMobile, onClose }: BookEditorContainerProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Editor state - only initialized when this component mounts
  const [currentEditorPage, setCurrentEditorPage] = useState(1);
  const [editorPageImages, setEditorPageImages] = useState<Record<number, string>>({});
  const [editorPagePrompts, setEditorPagePrompts] = useState<Record<number, string>>({});
  const [pageTextOverlays, setPageTextOverlays] = useState<Record<number, string>>({});
  const [replacePageMode, setReplacePageMode] = useState<Record<number, boolean>>({});
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // All editor-related hooks - only run when component is mounted
  const { data: sessionData } = useBookSessionData(bookId);
  const { pages: bookPages } = useBookPages(bookId);
  const { data: bookPageImages } = useBookPageImages(bookId);
  const { data: coverPage } = useBookCoverPage(bookId);
  const { data: coverImageUrl } = useBookCoverImage(bookId);

  // Fetch book for status
  const { data: selectedBook } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookId,
  });

  const updateBookStatusMutation = useUpdateBookStatus();

  // Fetch deployed prompts
  const { data: deployedPrompts } = useQuery({
    queryKey: ['deployed-prompts', bookId, bookPages],
    queryFn: async () => {
      if (!bookPages || bookPages.length === 0) return {};
      
      const pageIds = bookPages.map(p => p.id);
      const { data, error } = await supabase
        .from('page_system_prompts')
        .select('page_id, content')
        .in('page_id', pageIds)
        .eq('is_deployed', true);
      
      if (error) {
        console.error('Error fetching deployed prompts:', error);
        return {};
      }
      
      const promptMap: Record<number, string> = {};
      data?.forEach((prompt) => {
        const page = bookPages.find(p => p.id === prompt.page_id);
        if (page) {
          promptMap[page.page_number] = prompt.content;
        }
      });
      
      return promptMap;
    },
    enabled: !!bookPages && bookPages.length > 0,
  });

  // Preload images for instant display
  useBookEditorImagePreloader(bookPageImages);

  // Load session data
  useEffect(() => {
    if (sessionData) {
      setEditorPagePrompts((sessionData.qa_page_prompts as Record<number, string>) || {});
      setEditorPageImages((sessionData.qa_page_images as Record<number, string>) || {});
    }
  }, [sessionData]);

  // Extract page text overlays
  useEffect(() => {
    if (bookPages) {
      const overlays = bookPages.reduce((acc, page) => ({
        ...acc,
        [page.page_number]: page.title
      }), {} as Record<number, string>);
      setPageTextOverlays(overlays);
    }
  }, [bookPages]);

  // Set thumbnail from cover image
  useEffect(() => {
    setThumbnailUrl(coverImageUrl || null);
  }, [coverImageUrl]);

  const handleEditorPageNavigation = useCallback((direction: 'next' | 'prev') => {
    if (bookPages && bookPages.length > 0) {
      const sortedPages = [...bookPages].sort((a, b) => a.page_number - b.page_number);
      const currentIndex = sortedPages.findIndex(p => p.page_number === currentEditorPage);
      
      if (direction === 'next' && currentIndex < sortedPages.length - 1) {
        setCurrentEditorPage(sortedPages[currentIndex + 1].page_number);
      } else if (direction === 'prev' && currentIndex > 0) {
        setCurrentEditorPage(sortedPages[currentIndex - 1].page_number);
      }
    }
  }, [bookPages, currentEditorPage]);

  const handleEditorImageUpload = useCallback(async (imageDataUrl: string) => {
    if (!user) return;
    
    const currentPage = bookPages?.find(p => p.page_number === currentEditorPage);
    if (!currentPage) {
      console.error('Page not found for page number:', currentEditorPage);
      return;
    }
    
    try {
      const base64Response = await fetch(imageDataUrl);
      const blob = await base64Response.blob();
      const file = new File([blob], `page-${currentEditorPage}-${Date.now()}.webp`, { type: blob.type });
      
      const { data: versionData } = await supabase.rpc('get_next_page_image_version_number', {
        p_page_id: currentPage.id
      });
      const versionNumber = versionData || 1;
      
      const { data: record, error: recordError } = await supabase
        .from('page_image_urls')
        .insert({
          page_id: currentPage.id,
          book_id: bookId,
          user_id: user.id,
          version_number: versionNumber,
          prompt_used: `User uploaded via editor: ${file.name}`,
          source_type: 'user_uploaded'
        })
        .select()
        .single();
      
      if (recordError) {
        console.error('Error creating image record:', recordError);
        return;
      }
      
      const fileName = `${user.id}/pages/${currentPage.id}/uploaded-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });
      
      if (uploadError) {
        await supabase.from('page_image_urls').delete().eq('id', record.id);
        console.error('Error uploading image:', uploadError);
        return;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('page-images')
        .getPublicUrl(fileName);
      
      const { error: updateError } = await supabase
        .from('page_image_urls')
        .update({ image_url: publicUrlData.publicUrl })
        .eq('id', record.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating image URL:', updateError);
        return;
      }
      
      setEditorPageImages(prev => ({ ...prev, [currentEditorPage]: publicUrlData.publicUrl }));
      setReplacePageMode(prev => ({ ...prev, [currentEditorPage]: false }));
      
      queryClient.invalidateQueries({ queryKey: ['page-image-latest', currentPage.id] });
      queryClient.invalidateQueries({ queryKey: ['book-page-images', bookId] });
    } catch (error) {
      console.error('Error handling image upload:', error);
    }
  }, [bookId, currentEditorPage, bookPages, user, queryClient]);

  const handleRemoveEditorImage = useCallback(async (pageNumber: number) => {
    setReplacePageMode(prev => ({ ...prev, [pageNumber]: true }));
  }, []);

  const handleUpdatePageText = useCallback(async (pageNumber: number, newText: string) => {
    if (!bookPages) return;

    const page = bookPages.find(p => p.page_number === pageNumber);
    if (!page) return;

    const { error } = await supabase
      .from('pages')
      .update({ title: newText })
      .eq('id', page.id);

    if (!error) {
      setPageTextOverlays(prev => ({ ...prev, [pageNumber]: newText }));
      queryClient.invalidateQueries({ queryKey: ['book-pages', bookId] });
    }
  }, [bookId, bookPages, queryClient]);

  const handleToggleBookStatus = useCallback(async () => {
    const currentStatus = selectedBook?.status || PublicationStatus.DRAFT;
    const newStatus = currentStatus === PublicationStatus.DRAFT 
      ? PublicationStatus.PUBLISHED 
      : PublicationStatus.DRAFT;
    
    updateBookStatusMutation.mutate({
      bookId: bookId,
      status: newStatus,
    });
  }, [bookId, selectedBook?.status, updateBookStatusMutation]);

  const handleThumbnailUpload = useCallback(async (file: File) => {
    if (!coverPage || !user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${coverPage.id}.${fileExt}`;
    const filePath = `${bookId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('page-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('page-images')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('page_image_urls')
      .upsert({
        page_id: coverPage.id,
        book_id: bookId,
        user_id: user.id,
        image_url: publicUrl,
        source_type: 'user_uploaded',
        is_latest: true,
      });

    if (!dbError) {
      setThumbnailUrl(publicUrl);
      queryClient.invalidateQueries({ queryKey: ['book-cover-image', bookId] });
    }
  }, [bookId, coverPage, user, queryClient]);

  const getCurrentPagePrompt = useCallback((pageNum: number): string | null => {
    if (deployedPrompts && deployedPrompts[pageNum]) {
      return deployedPrompts[pageNum];
    }

    if (editorPagePrompts[pageNum]) {
      return editorPagePrompts[pageNum];
    }

    if (bookPages && bookPages.length > 0) {
      const page = bookPages.find(p => p.page_number === pageNum);
      if (!page) return null;
      
      const fullPrompt = (page.content as any)?.imagePrompt;
      if (fullPrompt) return fullPrompt;
      if (page.description) return page.description;
    }
    
    return null;
  }, [deployedPrompts, editorPagePrompts, bookPages]);

  const displayImages = useMemo(() => {
    const baseImages = bookPageImages || editorPageImages;
    const filtered: Record<number, string> = {};
    Object.entries(baseImages).forEach(([pageNum, imageUrl]) => {
      if (!replacePageMode[Number(pageNum)]) {
        filtered[Number(pageNum)] = imageUrl as string;
      }
    });
    return filtered;
  }, [bookPageImages, editorPageImages, replacePageMode]);

  const pageCount = bookPages?.length || 26;
  const coverPageId = coverPage?.id || null;

  const editorPanel = (
    <BookEditorPanel
      showEditor={true}
      isBookCreated={true}
      createdBookId={bookId}
      currentPageNumber={currentEditorPage}
      pageCount={pageCount}
      displayImages={displayImages}
      editorPageImages={editorPageImages}
      editorPagePrompts={editorPagePrompts}
      getCurrentPagePrompt={getCurrentPagePrompt}
      createBookMutation={{ isSuccess: false } as any}
      onClose={onClose}
      onNavigate={handleEditorPageNavigation}
      onImageUpload={handleEditorImageUpload}
      onRemoveImage={handleRemoveEditorImage}
      onCreateBook={() => {}}
      coverPageId={coverPageId}
      bookId={bookId}
      onCoverUpload={handleThumbnailUpload}
      thumbnailUrl={thumbnailUrl}
      pageTextOverlays={pageTextOverlays}
      onUpdatePageText={handleUpdatePageText}
      onToggleStatus={handleToggleBookStatus}
      bookStatus={(selectedBook?.status as PublicationStatus) || PublicationStatus.DRAFT}
    />
  );

  // Desktop: Side panel
  if (!isMobile) {
    return (
      <div
        className={cn(
          "transition-all duration-300 ease-out overflow-hidden border-l bg-background",
          "w-[400px]"
        )}
      >
        <div className="w-[400px] h-screen overflow-y-auto">
          {editorPanel}
        </div>
      </div>
    );
  }

  // Mobile: Bottom sheet
  return (
    <Sheet 
      open={true} 
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent 
        side="bottom" 
        className="w-full max-h-[90vh] p-0 overflow-hidden rounded-t-xl z-[100]"
      >
        {editorPanel}
      </SheetContent>
    </Sheet>
  );
}
