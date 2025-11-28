import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BookFilterBar } from '@/components/filters';
import { useAuthContext } from '@/contexts/AuthContext';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useBooks } from '@/hooks/useBooks';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';
import { useBookSeoMetadata } from '@/hooks/useBookSeoMetadata';
import { BookOpen, Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { LoadingState } from '@/components/ui/loading-state';
import { trackUserBookActivity } from '@/utils/bookViewTracking';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { extractAvailableThemes, filterBooksByThemeAndSearch } from '@/utils/themeFilters';
import { getThemeDisplayName } from '@/types/characterTheme';
import { getBookTypeDisplayName } from '@/types/bookType';
import { useEditorImagePreloader } from '@/hooks/useEditorImagePreloader';
import { useBookEditorImagePreloader } from '@/hooks/useBookEditorImagePreloader';
import { BookImage } from '@/components/ui/book-image';
import { useScheduleBookPublication } from '@/hooks/useScheduleBookPublication';
import { useDeleteDailyPublished } from '@/hooks/useDeleteDailyPublished';
import { useDeleteBook } from '@/hooks/useDeleteBook';
import { useIsMobile } from '@/hooks/use-mobile';
import { BookEditorPanel } from '@/components/chat/BookEditorPanel';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useBookPages } from '@/hooks/useBookPages';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { useBookCoverPage } from '@/hooks/useBookCoverPage';
import { useBookCoverImage } from '@/hooks/useBookCoverImage';
import { useUpdateBookStatus } from '@/hooks/useUpdateBookStatus';
import { usePageImageUrlsSubscription } from '@/hooks/usePageImageUrlsSubscription';
import { useWordMetadata } from '@/hooks/useWordMetadata';
import { useBookSessionData } from '@/hooks/useBookSessionData';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { DailyPublished } from '@/types/dailyPublished';
import { PublicationStatus } from '@/types/shared/status';
import { UserBookCard } from '@/components/books/UserBookCard';

// UserBookCard component extracted to src/components/books/UserBookCard.tsx

export default function Books() {
  const { user, loading: authLoading } = useAuthContext();
  const { data: kidProfiles = [] } = useKidProfiles();
  const isMobile = useIsMobile();
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const schedulePublication = useScheduleBookPublication();
  const deletePublication = useDeleteDailyPublished();
  const deleteBook = useDeleteBook();
  
  // Book Editor Panel state
  const [showEditor, setShowEditor] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [currentEditorPage, setCurrentEditorPage] = useState(1);
  const [editorPageImages, setEditorPageImages] = useState<Record<number, string>>({});
  const [editorPagePrompts, setEditorPagePrompts] = useState<Record<number, string>>({});
  const [pageTextOverlays, setPageTextOverlays] = useState<Record<number, string>>({});
  const [replacePageMode, setReplacePageMode] = useState<Record<number, boolean>>({});
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  
  // Track books being deleted to hide them immediately
  const [deletingBookIds, setDeletingBookIds] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const PAGE_SIZE = 24;
  
  // ⚡ PERFORMANCE: Debounced search
  const { rawQuery: searchQuery, activeQuery: debouncedSearchQuery, setSearchQuery, isSearching } = useOptimizedSearch('debounced', 300);
  
  // ⚡ OPTIMIZED: Server-side filtering with pagination
  const { books, totalCount, loading } = useBooks(
    'my-books',
    { page: currentPage, pageSize: PAGE_SIZE },
    debouncedSearchQuery,
    selectedThemes.length > 0 ? selectedThemes : undefined
  );
  
  // Extract available themes from all possible themes (not just current books)
  // This ensures filter options remain stable and don't disappear when filtering
  const availableThemes = useMemo(() => 
    extractAvailableThemes([]), // Returns all themes from enum
    []
  );
  
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  
  // Reset page when searching or filtering
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedThemes]);
  
  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  
  // Fetch session data when book is selected
  const { data: sessionData } = useBookSessionData(selectedBookId);

  // Fetch book pages for navigation
  const { pages: bookPages } = useBookPages(selectedBookId);

  // Fetch book page images from storage
  const { data: bookPageImages } = useBookPageImages(selectedBookId);

  // Fetch cover page and image
  const { data: coverPage } = useBookCoverPage(selectedBookId);
  const { data: coverImageUrl } = useBookCoverImage(selectedBookId);

  // Fetch book status for publish/unpublish toggle
  const { data: selectedBook } = useQuery({
    queryKey: ['book', selectedBookId],
    queryFn: async () => {
      if (!selectedBookId) return null;
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', selectedBookId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBookId,
  });

  // Book status mutation
  const updateBookStatusMutation = useUpdateBookStatus();

  // Fetch deployed prompts from page_system_prompts table (full untruncated content)
  const { data: deployedPrompts } = useQuery({
    queryKey: ['deployed-prompts', selectedBookId, bookPages],
    queryFn: async () => {
      if (!selectedBookId || !bookPages || bookPages.length === 0) return {};
      
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
      
      // Map to page_number for easy lookup
      const promptMap: Record<number, string> = {};
      data?.forEach((prompt) => {
        const page = bookPages.find(p => p.id === prompt.page_id);
        if (page) {
          promptMap[page.page_number] = prompt.content;
        }
      });
      
      return promptMap;
    },
    enabled: !!selectedBookId && !!bookPages && bookPages.length > 0,
  });

  // Effect: Load session data when book is selected
  useEffect(() => {
    if (sessionData) {
      setEditorPagePrompts((sessionData.qa_page_prompts as Record<number, string>) || {});
      setEditorPageImages((sessionData.qa_page_images as Record<number, string>) || {});
      console.log('[Books Editor] Loaded session data:', {
        promptCount: Object.keys(sessionData.qa_page_prompts || {}).length,
        imageCount: Object.keys(sessionData.qa_page_images || {}).length
      });
    }
  }, [sessionData]);

  // Effect: Extract page text overlays from database pages
  useEffect(() => {
    if (bookPages) {
      const overlays = bookPages.reduce((acc, page) => ({
        ...acc,
        [page.page_number]: page.title
      }), {} as Record<number, string>);
      setPageTextOverlays(overlays);
    }
  }, [bookPages]);

  // Effect: Set thumbnail URL from cover image
  useEffect(() => {
    setThumbnailUrl(coverImageUrl || null);
  }, [coverImageUrl]);
  
  // Preload book images for instant display on return visits
  useEditorImagePreloader(books);
  
  // Phase 1: Preload page images when editor data loads for instant display
  useBookEditorImagePreloader(bookPageImages);

  // Invalidate books query when route changes to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
  }, [location.pathname, queryClient]);

  const handleViewBook = async (bookId: string) => {
    // Track the user book activity with kid_id for personalized recommendations
    const kidId = kidProfiles.length > 0 ? kidProfiles[0].id : undefined;
    trackUserBookActivity(bookId, kidId);
    
    // Invalidate query to refresh sort order with new activity
    queryClient.invalidateQueries({ queryKey: ['books', user?.id] });
    
    // Navigate to reading view
    navigate(`/books/${bookId}/read`, { state: { from: 'my-books' } });
  };

  const handleEditBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setShowEditor(true);
    setCurrentEditorPage(1);
  };

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
    if (!selectedBookId || !user) return;
    
    // Get current page ID
    const currentPage = bookPages?.find(p => p.page_number === currentEditorPage);
    if (!currentPage) {
      console.error('Page not found for page number:', currentEditorPage);
      return;
    }
    
    try {
      // Convert base64 to File object
      const base64Response = await fetch(imageDataUrl);
      const blob = await base64Response.blob();
      const file = new File([blob], `page-${currentEditorPage}-${Date.now()}.webp`, { type: blob.type });
      
      // Get next version number
      const { data: versionData } = await supabase.rpc('get_next_page_image_version_number', {
        p_page_id: currentPage.id
      });
      const versionNumber = versionData || 1;
      
      // Create database record first
      const { data: record, error: recordError } = await supabase
        .from('page_image_urls')
        .insert({
          page_id: currentPage.id,
          book_id: selectedBookId,
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
      
      // Upload to storage
      const fileName = `${user.id}/pages/${currentPage.id}/uploaded-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });
      
      if (uploadError) {
        // Clean up the record if upload fails
        await supabase.from('page_image_urls').delete().eq('id', record.id);
        console.error('Error uploading image:', uploadError);
        return;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('page-images')
        .getPublicUrl(fileName);
      
      // Update record with image URL
      const { data: updatedRecord, error: updateError } = await supabase
        .from('page_image_urls')
        .update({ image_url: publicUrlData.publicUrl })
        .eq('id', record.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating image URL:', updateError);
        return;
      }
      
      // Update state with permanent URL
      setEditorPageImages(prev => ({ ...prev, [currentEditorPage]: publicUrlData.publicUrl }));
      setReplacePageMode(prev => ({ ...prev, [currentEditorPage]: false }));
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['page-image-latest', currentPage.id] });
      queryClient.invalidateQueries({ queryKey: ['book-page-images', selectedBookId] });
      
      console.log('✅ Image uploaded successfully:', publicUrlData.publicUrl);
    } catch (error) {
      console.error('Error handling image upload:', error);
    }
  }, [selectedBookId, currentEditorPage, bookPages, user, queryClient]);

  const handleRemoveEditorImage = useCallback(async (pageNumber: number) => {
    setReplacePageMode(prev => ({ ...prev, [pageNumber]: true }));
  }, []);

  const handleUpdatePageText = useCallback(async (pageNumber: number, newText: string) => {
    if (!selectedBookId || !bookPages) return;

    const page = bookPages.find(p => p.page_number === pageNumber);
    if (!page) return;

    const { error } = await supabase
      .from('pages')
      .update({ title: newText })
      .eq('id', page.id);

    if (!error) {
      setPageTextOverlays(prev => ({ ...prev, [pageNumber]: newText }));
      queryClient.invalidateQueries({ queryKey: ['book-pages', selectedBookId] });
    }
  }, [selectedBookId, bookPages, queryClient]);

  const handleToggleBookStatus = useCallback(async () => {
    if (!selectedBookId) return;
    
    const currentStatus = selectedBook?.status || PublicationStatus.DRAFT;
    const newStatus = currentStatus === PublicationStatus.DRAFT 
      ? PublicationStatus.PUBLISHED 
      : PublicationStatus.DRAFT;
    
    updateBookStatusMutation.mutate({
      bookId: selectedBookId,
      status: newStatus,
    });
  }, [selectedBookId, selectedBook?.status, updateBookStatusMutation]);

  const handleThumbnailUpload = useCallback(async (file: File) => {
    if (!selectedBookId || !coverPage) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${coverPage.id}.${fileExt}`;
    const filePath = `${selectedBookId}/${fileName}`;

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
        book_id: selectedBookId,
        user_id: user?.id!,
        image_url: publicUrl,
        source_type: 'user_uploaded',
        is_latest: true,
      });

    if (!dbError) {
      setThumbnailUrl(publicUrl);
      queryClient.invalidateQueries({ queryKey: ['book-cover-image', selectedBookId] });
    }
  }, [selectedBookId, coverPage, user?.id, queryClient]);

  const getCurrentPagePrompt = useCallback((pageNum: number): string | null => {
    // PRIORITY 1: Full deployed prompts from page_system_prompts (no truncation)
    if (deployedPrompts && deployedPrompts[pageNum]) {
      return deployedPrompts[pageNum];
    }

    // PRIORITY 2: Session prompts (may be truncated)
    if (editorPagePrompts[pageNum]) {
      return editorPagePrompts[pageNum];
    }

    // PRIORITY 3: Fallback to page content (likely truncated)
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
    const baseImages = (selectedBookId && bookPageImages) ? bookPageImages : editorPageImages;
    const filtered: Record<number, string> = {};
    Object.entries(baseImages).forEach(([pageNum, imageUrl]) => {
      if (!replacePageMode[Number(pageNum)]) {
        filtered[Number(pageNum)] = imageUrl as string;
      }
    });
    return filtered;
  }, [selectedBookId, bookPageImages, editorPageImages, replacePageMode]);

  const isBookCreated = !!selectedBookId;
  const pageCount = bookPages?.length || 26;
  const coverPageId = coverPage?.id || null;

  const handleCreateNewBook = () => {
    navigate('/google-chat');
  };

  const handlePublish = (bookId: string, title: string, description?: string) => {
    schedulePublication.mutate({ bookId, title, description });
  };

  const handleUnpublish = (dailyPublishedId: string) => {
    deletePublication.mutate(dailyPublishedId);
  };

  const handleDeleteBook = (bookId: string, bookName: string) => {
    // Immediately add to deleting set to hide the card
    setDeletingBookIds(prev => new Set(prev).add(bookId));
    
    // Start the deletion in background
    deleteBook.mutate(bookId, {
      onSettled: () => {
        // Remove from deleting set when done (success or failure)
        setDeletingBookIds(prev => {
          const next = new Set(prev);
          next.delete(bookId);
          return next;
        });
      }
    });
  };

  const pageTitle = "My Books";
  const pageDescription = "Create and manage your ABC books";

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <StandardPageLayout title={pageTitle} containerClassName="py-8">
        <LoadingState />
      </StandardPageLayout>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <StandardPageLayout title={pageTitle} containerClassName="py-8">
        <LoadingState text="Loading your books..." />
      </StandardPageLayout>
    );
  }

  return (
    <>
      <div className="flex w-full">
        {/* Main Content Area - Shrinks automatically when panel opens */}
        <div className="flex-1 min-w-0 transition-all duration-300 ease-out">
          <StandardPageLayout title={pageTitle} containerClassName="py-8">
          <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-muted-foreground">
              {pageDescription}
            </p>
          </div>
          <Button 
            onClick={handleCreateNewBook}
            className="w-full md:w-auto md:shrink-0"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Create New Book
          </Button>
        </div>

        {/* Book Filters */}
        <BookFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedThemes={selectedThemes}
          onThemesChange={setSelectedThemes}
          availableThemes={availableThemes}
          placeholder="Search your books..."
          showSearch={true}
        />

        {/* Books Grid */}
        {books && books.filter(book => !deletingBookIds.has(book.id)).length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books
                .filter(book => !deletingBookIds.has(book.id))
                .map((book, index) => (
                <UserBookCard
                  key={book.id}
                  book={book}
                  index={index}
                  onClick={() => handleViewBook(book.id)}
                  onEditClick={(bookId) => {
                    handleEditBook(bookId);
                  }}
                  publicationStatus={book.daily_published?.[0] ? {
                    id: book.daily_published[0].id,
                    status: book.daily_published[0].status as 'draft' | 'queued' | 'active' | 'expired',
                    publish_date: book.daily_published[0].publish_date
                  } : null}
                  onPublish={handlePublish}
                  onUnpublish={handleUnpublish}
                  onDelete={handleDeleteBook}
                  isPublishing={schedulePublication.isPending && schedulePublication.variables?.bookId === book.id}
                  isUnpublishing={deletePublication.isPending && deletePublication.variables === book.daily_published?.[0]?.id}
                  isDeleting={false}
                  queryClient={queryClient}
                />
              ))}
            </div>

            {/* Pagination Controls - Show when there are more books than page size */}
            {totalCount > PAGE_SIZE && (
              <div className="flex flex-col items-center gap-4 mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={cn(
                          "cursor-pointer",
                          (currentPage === 1 || loading) && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                    
                    {/* First page */}
                    {totalPages > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(1)}
                          isActive={currentPage === 1}
                          className="cursor-pointer"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    {/* Left ellipsis */}
                    {currentPage > 3 && totalPages > 5 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {/* Middle pages */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show pages around current page
                        if (totalPages <= 5) return page > 1 && page < totalPages;
                        if (page === 1 || page === totalPages) return false;
                        return Math.abs(page - currentPage) <= 1;
                      })
                      .map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                    
                    {/* Right ellipsis */}
                    {currentPage < totalPages - 2 && totalPages > 5 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {/* Last page */}
                    {totalPages > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(totalPages)}
                          isActive={currentPage === totalPages}
                          className="cursor-pointer"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={cn(
                          "cursor-pointer",
                          (currentPage === totalPages || loading) && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                
                {/* Page info */}
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} books
                </div>
              </div>
            )}
          </>
        ) : (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-6">
              <div className="rounded-full bg-primary/10 p-6">
                <BookOpen className="h-16 w-16 text-primary" />
              </div>
              
              <div className="space-y-2 max-w-md">
                <h3 className="text-2xl font-bold">Start Your Book Collection</h3>
                <p className="text-muted-foreground text-base">
                  Create personalized ABC books with our AI assistant. Choose themes, customize pages, and bring stories to life.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={handleCreateNewBook} size="lg">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Create Your First Book
                </Button>
                <Button onClick={() => navigate('/library')} variant="outline" size="lg">
                  Browse Library
                </Button>
              </div>

              <div className="pt-6 border-t w-full max-w-md">
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="font-medium text-foreground">How it works:</span>
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">1.</span>
                    <span>Chat with our AI to design your book</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">2.</span>
                    <span>Choose themes, topics, and customize pages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">3.</span>
                    <span>View, edit, and share your creation</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
          </StandardPageLayout>
        </div>

        {/* Desktop: Side Panel - Expands from 0 to 400px */}
        {!isMobile && (
          <div
            className={cn(
              "transition-all duration-300 ease-out overflow-hidden border-l bg-background",
              showEditor ? "w-[400px]" : "w-0"
            )}
          >
            <div className="w-[400px] h-screen overflow-y-auto">
              <BookEditorPanel
                showEditor={true}
                isBookCreated={isBookCreated}
                createdBookId={selectedBookId}
                currentPageNumber={currentEditorPage}
                pageCount={pageCount}
                displayImages={displayImages}
                editorPageImages={editorPageImages}
                editorPagePrompts={editorPagePrompts}
                getCurrentPagePrompt={getCurrentPagePrompt}
                createBookMutation={{ isSuccess: false } as any}
                onClose={() => {
                  setShowEditor(false);
                  setSelectedBookId(null);
                }}
                onNavigate={handleEditorPageNavigation}
                onImageUpload={handleEditorImageUpload}
                onRemoveImage={handleRemoveEditorImage}
                onCreateBook={() => {}}
                coverPageId={coverPageId}
                bookId={selectedBookId}
                onCoverUpload={handleThumbnailUpload}
                thumbnailUrl={thumbnailUrl}
                pageTextOverlays={pageTextOverlays}
                onUpdatePageText={handleUpdatePageText}
                onToggleStatus={handleToggleBookStatus}
                bookStatus={(selectedBook?.status as PublicationStatus) || PublicationStatus.DRAFT}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Bottom Sheet Editor */}
      {isMobile && (
        <Sheet 
          open={showEditor} 
          onOpenChange={(open) => {
            setShowEditor(open);
            if (!open) {
              setSelectedBookId(null);
              setReplacePageMode({});
            }
          }}
        >
          <SheetContent 
            side="bottom" 
            className="w-full max-h-[90vh] p-0 overflow-hidden rounded-t-xl z-[100]"
          >
            <BookEditorPanel
              showEditor={true}
              isBookCreated={isBookCreated}
              createdBookId={selectedBookId}
              currentPageNumber={currentEditorPage}
              pageCount={pageCount}
              displayImages={displayImages}
              editorPageImages={editorPageImages}
              editorPagePrompts={editorPagePrompts}
              getCurrentPagePrompt={getCurrentPagePrompt}
              createBookMutation={{ isSuccess: false } as any}
              onClose={() => {
                setShowEditor(false);
                setSelectedBookId(null);
              }}
              onNavigate={handleEditorPageNavigation}
              onImageUpload={handleEditorImageUpload}
              onRemoveImage={handleRemoveEditorImage}
              onCreateBook={() => {}}
              coverPageId={coverPageId}
              bookId={selectedBookId}
              onCoverUpload={handleThumbnailUpload}
              thumbnailUrl={thumbnailUrl}
              pageTextOverlays={pageTextOverlays}
              onUpdatePageText={handleUpdatePageText}
              onToggleStatus={handleToggleBookStatus}
              bookStatus={(selectedBook?.status as PublicationStatus) || PublicationStatus.DRAFT}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}