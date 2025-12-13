import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUpdateBookStatus } from '@/hooks/useUpdateBookStatus';
import { useBookEditorData } from '@/hooks/useBookEditorData';
import { useBookEditorImagePreloader } from '@/hooks/useBookEditorImagePreloader';
import { BookEditorPanel } from '@/components/chat/BookEditorPanel';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { PublicationStatus } from '@/types/shared/status';
import { cn } from '@/lib/utils';
import { compositeTextOnImage } from '@/utils/imageTextCompositor';


interface BookEditorContainerProps {
  bookId: string;
  isMobile: boolean;
  onClose: () => void;
}

/**
 * BookEditorContainer - Lazy-loaded container for book editor
 * Uses consolidated useBookEditorData hook for single-query data fetching
 */
export function BookEditorContainer({ bookId, isMobile, onClose }: BookEditorContainerProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const updateBookStatusMutation = useUpdateBookStatus();

  // Single consolidated data hook
  const { data: editorData, isLoading } = useBookEditorData(bookId);

  // Minimal local state - only for user interactions
  const [currentEditorPage, setCurrentEditorPage] = useState(1);
  const [localImageOverrides, setLocalImageOverrides] = useState<Record<number, string>>({});
  const [replacePageMode, setReplacePageMode] = useState<Record<number, boolean>>({});
  const [thumbnailOverride, setThumbnailOverride] = useState<string | null>(null);
  const [localTextOverrides, setLocalTextOverrides] = useState<Record<number, string>>({});

  // Preload images - use existing prefetched data if available
  useBookEditorImagePreloader(editorData?.pageImages);

  const handleEditorPageNavigation = useCallback((direction: 'next' | 'prev') => {
    const pages = editorData?.pages;
    if (!pages || pages.length === 0) return;

    const sortedPages = [...pages].sort((a, b) => a.page_number - b.page_number);
    const currentIndex = sortedPages.findIndex(p => p.page_number === currentEditorPage);

    if (direction === 'next' && currentIndex < sortedPages.length - 1) {
      setCurrentEditorPage(sortedPages[currentIndex + 1].page_number);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentEditorPage(sortedPages[currentIndex - 1].page_number);
    }
  }, [editorData?.pages, currentEditorPage]);

  const handleEditorImageUpload = useCallback(async (imageDataUrl: string, imageMode: 'color' | 'bw' | 'text' = 'color') => {
    if (!user || !editorData?.pages) return;

    const currentPage = editorData.pages.find(p => p.page_number === currentEditorPage);
    if (!currentPage) return;

    try {
      let finalImageDataUrl = imageDataUrl;
      let finalBlob: Blob;

      // If text mode, composite text onto image first
      if (imageMode === 'text') {
        const pageText = editorData.pageTextOverlays[currentEditorPage] || currentPage.title || '';
        if (pageText) {
          const composited = await compositeTextOnImage(imageDataUrl, pageText);
          finalImageDataUrl = composited.dataUrl;
          finalBlob = composited.blob;
        } else {
          const base64Response = await fetch(imageDataUrl);
          finalBlob = await base64Response.blob();
        }
      } else {
        const base64Response = await fetch(imageDataUrl);
        finalBlob = await base64Response.blob();
      }

      const modePrefix = imageMode === 'bw' ? 'coloring-' : imageMode === 'text' ? 'text-' : '';
      const file = new File([finalBlob], `${modePrefix}page-${currentEditorPage}-${Date.now()}.webp`, { type: finalBlob.type });

      const { data: versionData } = await supabase.rpc('get_next_page_image_version_number', {
        p_page_id: currentPage.id
      });

      // Check if a record already exists for this page
      const { data: existingRecord } = await supabase
        .from('page_image_urls')
        .select('id, image_url, coloring_image_url, text_image_url')
        .eq('page_id', currentPage.id)
        .eq('is_latest', true)
        .single();

      const fileName = `${user.id}/pages/${currentPage.id}/${modePrefix}uploaded-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(fileName, file, { contentType: file.type, upsert: false });

      if (uploadError) return;

      const { data: publicUrlData } = supabase.storage.from('page-images').getPublicUrl(fileName);

      // Prepare update/insert data - each mode updates ONLY its respective column
      let updateData: Record<string, string> = {};
      if (imageMode === 'bw') {
        updateData = { coloring_image_url: publicUrlData.publicUrl };
      } else if (imageMode === 'text') {
        updateData = { text_image_url: publicUrlData.publicUrl };
      } else {
        // Color mode - only update image_url, NOT text_image_url
        updateData = { image_url: publicUrlData.publicUrl };
      }

      if (existingRecord) {
        await supabase
          .from('page_image_urls')
          .update(updateData)
          .eq('id', existingRecord.id);
      } else {
        const insertData = {
          page_id: currentPage.id,
          book_id: bookId,
          user_id: user.id,
          version_number: versionData || 1,
          prompt_used: `User uploaded via editor: ${file.name}`,
          source_type: 'user_uploaded',
          ...updateData
        };

        await supabase
          .from('page_image_urls')
          .insert(insertData);
      }

      if (imageMode === 'color') {
        setLocalImageOverrides(prev => ({ ...prev, [currentEditorPage]: publicUrlData.publicUrl }));
      }
      setReplacePageMode(prev => ({ ...prev, [currentEditorPage]: false }));

      queryClient.invalidateQueries({ queryKey: ['book-editor-data', bookId] });
      queryClient.invalidateQueries({ queryKey: ['book-page-images', bookId] });
    } catch (error) {
      console.error('Error handling image upload:', error);
    }
  }, [bookId, currentEditorPage, editorData?.pages, editorData?.pageTextOverlays, user, queryClient]);

  const handleRemoveEditorImage = useCallback((pageNumber: number) => {
    setReplacePageMode(prev => ({ ...prev, [pageNumber]: true }));
  }, []);

  const handleUpdatePageText = useCallback(async (pageNumber: number, newText: string) => {
    const pages = editorData?.pages;
    if (!pages) return;

    const page = pages.find(p => p.page_number === pageNumber);
    if (!page) return;

    const { error } = await supabase
      .from('pages')
      .update({ title: newText })
      .eq('id', page.id);

    if (!error) {
      setLocalTextOverrides(prev => ({ ...prev, [pageNumber]: newText }));
      queryClient.invalidateQueries({ queryKey: ['book-editor-data', bookId] });
    }
  }, [bookId, editorData?.pages, queryClient]);

  const handleToggleBookStatus = useCallback(() => {
    const currentStatus = editorData?.book?.status || PublicationStatus.DRAFT;
    const newStatus = currentStatus === PublicationStatus.DRAFT
      ? PublicationStatus.PUBLISHED
      : PublicationStatus.DRAFT;

    updateBookStatusMutation.mutate({ bookId, status: newStatus });
  }, [bookId, editorData?.book?.status, updateBookStatusMutation]);

  const handleThumbnailUpload = useCallback(async (file: File) => {
    const coverPage = editorData?.coverPage;
    if (!coverPage || !user) {
      console.error('[Thumbnail Upload] Missing coverPage or user');
      return;
    }

    console.log('[Thumbnail Upload] Starting upload:', file.name, file.size, file.type);

    const fileExt = file.name.split('.').pop() || 'png';
    // Include user.id in path to satisfy RLS policies
    const filePath = `${user.id}/${bookId}/${coverPage.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('page-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('[Thumbnail Upload] Storage upload failed:', uploadError);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('page-images').getPublicUrl(filePath);
    console.log('[Thumbnail Upload] Got public URL:', publicUrl);

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

    if (dbError) {
      console.error('[Thumbnail Upload] DB upsert failed:', dbError);
      return;
    }

    console.log('[Thumbnail Upload] Success, setting thumbnail override');
    setThumbnailOverride(publicUrl);
    queryClient.invalidateQueries({ queryKey: ['book-editor-data', bookId] });
  }, [bookId, editorData?.coverPage, user, queryClient]);

  const getCurrentPagePrompt = useCallback((pageNum: number): string | null => {
    if (!editorData) return null;

    // Priority: deployed > session > page content
    if (editorData.deployedPrompts[pageNum]) return editorData.deployedPrompts[pageNum];
    if (editorData.sessionPrompts[pageNum]) return editorData.sessionPrompts[pageNum];

    const page = editorData.pages.find(p => p.page_number === pageNum);
    if (!page) return null;

    const fullPrompt = (page.content as any)?.imagePrompt;
    if (fullPrompt) return fullPrompt;
    return page.description;
  }, [editorData]);

  // Merge fetched images with local overrides, excluding replaced pages
  const displayImages = useMemo(() => {
    const baseImages = editorData?.pageImages || {};
    const merged = { ...baseImages, ...localImageOverrides };

    const filtered: Record<number, string> = {};
    Object.entries(merged).forEach(([pageNum, imageUrl]) => {
      if (!replacePageMode[Number(pageNum)]) {
        filtered[Number(pageNum)] = imageUrl;
      }
    });
    return filtered;
  }, [editorData?.pageImages, localImageOverrides, replacePageMode]);

  const displayColoringImages = useMemo(() => {
    return editorData?.pageColoringImages || {};
  }, [editorData?.pageColoringImages]);

  const displayTextImages = useMemo(() => {
    return editorData?.pageTextImages || {};
  }, [editorData?.pageTextImages]);

  const pageTextOverlays = useMemo(() => {
    return { ...(editorData?.pageTextOverlays || {}), ...localTextOverrides };
  }, [editorData?.pageTextOverlays, localTextOverrides]);

  if (isLoading || !editorData) {
    return (
      <div className={cn(
        "transition-all duration-300 ease-out border-l bg-background flex items-center justify-center",
        isMobile ? "h-[50vh]" : "w-[400px] h-screen"
      )}>
        <div className="animate-pulse text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  const editorPanel = (
    <BookEditorPanel
      showEditor={true}
      isBookCreated={true}
      createdBookId={bookId}
      currentPageNumber={currentEditorPage}
      pageCount={editorData.pageCount}
      displayImages={displayImages}
      editorPageImages={localImageOverrides}
      editorPagePrompts={editorData.sessionPrompts}
      displayColoringImages={displayColoringImages}
      displayTextImages={displayTextImages}
      getCurrentPagePrompt={getCurrentPagePrompt}
      createBookMutation={{ isSuccess: false } as any}
      onClose={onClose}
      onNavigate={handleEditorPageNavigation}
      onImageUpload={handleEditorImageUpload}
      onRemoveImage={handleRemoveEditorImage}
      onCreateBook={() => {}}
      coverPageId={editorData.coverPage?.id || null}
      bookId={bookId}
      onCoverUpload={handleThumbnailUpload}
      thumbnailUrl={thumbnailOverride || editorData.coverImageUrl}
      pageTextOverlays={pageTextOverlays}
      onUpdatePageText={handleUpdatePageText}
      onToggleStatus={handleToggleBookStatus}
      isPublishing={updateBookStatusMutation.isPending}
      bookStatus={(editorData.book.status as PublicationStatus) || PublicationStatus.DRAFT}
      bookTitle={editorData.book.book_name}
      bookDescription={editorData.book.book_description || undefined}
      characterTheme={(editorData.book.metadata as any)?.characterTheme}
    />
  );

  if (!isMobile) {
    return (
      <div className="transition-all duration-300 ease-out overflow-hidden border-l bg-background w-[400px]">
        <div className="w-[400px] h-screen overflow-y-auto">
          {editorPanel}
        </div>
      </div>
    );
  }

  return (
    <Sheet open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        className="w-full max-h-[90vh] p-0 overflow-hidden rounded-t-xl z-[100]"
      >
        {editorPanel}
      </SheetContent>
    </Sheet>
  );
}
