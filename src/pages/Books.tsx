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
import { useBooks } from '@/hooks/useBooks';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';
import { useBookSeoMetadata } from '@/hooks/useBookSeoMetadata';
import { BookOpen, Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';
import { trackUserBookActivity } from '@/utils/bookViewTracking';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { extractAvailableThemes, filterBooksByThemeAndSearch } from '@/utils/themeFilters';
import { getThemeDisplayName } from '@/types/characterTheme';
import { getBookTypeDisplayName } from '@/types/bookType';
import { useEditorImagePreloader } from '@/hooks/useEditorImagePreloader';
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
import { AdminOnly } from '@/components/AdminOnly';
import { cn } from '@/lib/utils';
import { BookMetadataEditor } from '@/components/book';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import type { DailyPublished } from '@/types/dailyPublished';
import { PublicationStatus } from '@/types/shared/status';

/**
 * UserBookCard - Displays a book authored by the current user in "My Books" section
 * 
 * @description Shows user-created books with edit capabilities, status badges,
 * and metadata including book type, character themes, and page counts.
 * Used exclusively in the user's personal book management interface.
 * 
 * @data-source useBooks() - Fetches from books table filtered by user_id
 * @navigation Routes to /books/:id for detailed editing view
 * @user-context Book authors managing their own created content
 * @features Status badge, metadata badges (book type, pages, themes), edit access,
 * thumbnail display with fallback, viewport-based lazy loading
 */

interface UserBookCardProps {
  book: any;
  onClick: () => void;
  index: number;
  onEditClick?: (bookId: string) => void;
  publicationStatus?: Pick<DailyPublished, 'id' | 'status' | 'publish_date'> | null;
  onPublish?: (bookId: string, title: string, description?: string) => void;
  onUnpublish?: (dailyPublishedId: string) => void;
  onDelete?: (bookId: string, bookName: string) => void;
  isPublishing?: boolean;
  isUnpublishing?: boolean;
  isDeleting?: boolean;
}

function UserBookCard({ 
  book, 
  onClick, 
  index, 
  onEditClick,
  publicationStatus,
  onPublish,
  onUnpublish,
  onDelete,
  isPublishing,
  isUnpublishing,
  isDeleting
}: UserBookCardProps) {
  const { data: seoMetadata } = useBookSeoMetadata(book.id);
  // Use coverImageUrl from book object (already fetched by useBooks hook)
  const coverImageUrl = book.coverImageUrl;
  
  // Viewport-based lazy loading
  const { ref, inView } = useIntersectionObserver({
    rootMargin: '200px',
    triggerOnce: true,
  });
  
  // Priority loading for first 6 cards
  const shouldLoadImmediately = index < 6;
  const shouldRender = shouldLoadImmediately || inView;

  return (
    <Card 
      ref={ref}
      className="cursor-pointer hover:shadow-lg transition-shadow group overflow-hidden"
      onClick={onClick}
    >
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg group-hover:text-primary transition-colors">
          {book.book_name}
        </CardTitle>
        
        {/* Book Metadata Badges */}
        <div className="flex flex-wrap gap-2">
          {book.metadata?.bookType && (
            <Badge variant="secondary" className="capitalize">
              {book.metadata.bookType.replace(/-/g, ' ')}
            </Badge>
          )}
          {book.metadata?.pageCount && (
            <Badge variant="outline">
              {book.metadata.pageCount} pages
            </Badge>
          )}
          {book.metadata?.numberRange && (
            <Badge variant="outline">
              Numbers {book.metadata.numberRange}
            </Badge>
          )}
          {book.metadata?.bookType && (
            <Badge variant="secondary">
              {getBookTypeDisplayName(book.metadata.bookType)}
            </Badge>
          )}
          {book.metadata?.characterTheme && (
            <Badge variant="default">
              {getThemeDisplayName(book.metadata.characterTheme)}
            </Badge>
          )}
          {book.metadata?.letterCase && (
            <Badge variant="outline" className="capitalize">
              {book.metadata.letterCase} letters
            </Badge>
          )}
          {book.metadata?.targetAge && (
            <Badge variant="secondary" className="capitalize">
              {book.metadata.targetAge.replace(/-/g, ' ')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Admin-Only Metadata Editor - Inline */}
        <AdminOnly>
          <BookMetadataEditor 
            bookId={book.id}
            currentMetadata={book.metadata || {}}
            className="mb-4"
          />
        </AdminOnly>
        
        {/* Book Cover - Shows cover page type image or placeholder */}
        <AspectRatio ratio={1} className="bg-muted rounded-lg overflow-hidden relative group/thumbnail shadow-md hover:shadow-xl transition-shadow duration-300">
          {shouldRender ? (
            coverImageUrl ? (
              <BookImage
                src={coverImageUrl}
                alt={book.book_name}
                priority={index < 6}
                className="w-full h-full object-cover object-center"
                enableMobileSave={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
            )
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          {/* Hover overlay to indicate clickability */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumbnail:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="text-white flex flex-col items-center gap-2">
              <BookOpen className="h-8 w-8" />
              <span className="text-sm font-medium">Read Book</span>
            </div>
          </div>
        </AspectRatio>

        {/* Edit Button */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            if (onEditClick) {
              onEditClick(book.id);
            }
          }}
        >
          Edit
        </Button>

        {/* Delete Book Button - Visible to All Users */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => e.stopPropagation()}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>Deleting...</>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Book
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{book.book_name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All {book.total_pages || 0} pages</li>
                  <li>All page images and content</li>
                  <li>AI prompts and system configurations</li>
                  <li>Publication records and QR codes</li>
                  <li>SEO metadata and analytics</li>
                </ul>
                {publicationStatus && (
                  <p className="mt-3 font-medium text-destructive">
                    ⚠️ This book is currently {publicationStatus.status === 'active' ? 'live in' : 'scheduled for'} the library!
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete) {
                    onDelete(book.id, book.book_name);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Admin-Only Actions Section */}
        <AdminOnly fallback={null}>
          <div className="space-y-2 pt-3 mt-3 border-t border-border/50">
            {/* Section Label */}
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Admin Actions
            </div>
            
            {/* Publish/Unpublish Button */}
            <Button 
              variant={publicationStatus ? "destructive" : "default"}
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                if (publicationStatus && onUnpublish) {
                  onUnpublish(publicationStatus.id);
                } else if (onPublish) {
                  onPublish(book.id, book.book_name, book.book_description);
                }
              }}
              disabled={isPublishing || isUnpublishing}
            >
              {isPublishing || isUnpublishing ? (
                <>Loading...</>
              ) : publicationStatus ? (
                <>Unpublish from Library</>
              ) : (
                <>Publish to Daily Library</>
              )}
            </Button>

            {/* Publication Status Badge */}
            {publicationStatus && (
              <div className="text-xs text-center text-muted-foreground">
                {publicationStatus.status === 'active' && (
                  <span className="text-green-600 font-medium">🟢 Live in Library</span>
                )}
                {publicationStatus.status === 'queued' && (
                  <span className="text-blue-600 font-medium">
                    📅 Scheduled for {new Date(publicationStatus.publish_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                )}
                {publicationStatus.status === 'expired' && (
                  <span className="text-gray-600 font-medium">⏸️ Expired</span>
                )}
              </div>
            )}
            
            {/* Future: Additional admin buttons will go here */}
          </div>
        </AdminOnly>

      </CardContent>
    </Card>
  );
}

export default function Books() {
  const { user, loading: authLoading } = useAuthContext();
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
  
  const isAllBooksView = location.pathname === '/all-books';
  
  // Pagination state for all-books view
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const PAGE_SIZE = 18; // 3 rows of 6 books on large screens
  
  // ⚡ PERFORMANCE: Debounced search to prevent reload on every keystroke
  const { rawQuery: searchQuery, activeQuery: debouncedSearchQuery, setSearchQuery, isSearching } = useOptimizedSearch('debounced', 300);
  
  // ⚡ OPTIMIZED: Server-side filtering with theme filter
  const { books, totalCount, loading } = useBooks(
    isAllBooksView ? 'all-books' : 'my-books',
    isAllBooksView ? { page: currentPage, pageSize: PAGE_SIZE } : undefined,
    debouncedSearchQuery, // Use debounced query for database calls
    selectedThemes.length > 0 ? selectedThemes : undefined // Pass theme filter to backend
  );
  
  // Extract available themes from all possible themes (not just current books)
  // This ensures filter options remain stable and don't disappear when filtering
  const availableThemes = useMemo(() => 
    extractAvailableThemes([]), // Returns all themes from enum
    []
  );
  
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1; // At least 1 page
  
  // Reset page when switching between views or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [isAllBooksView, searchQuery, selectedThemes]);
  
  // Reset to page 1 if current page exceeds total pages (e.g., after deletion)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  
  // Fetch session data (prompts & images) when book is selected
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

  // Invalidate books query when route changes to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['books'] });
  }, [location.pathname, queryClient]);

  const handleViewBook = async (bookId: string) => {
    // Track the user book activity (writes to user_book_activity table with book_id)
    trackUserBookActivity(bookId);
    
    // Invalidate query to refresh sort order with new activity
    queryClient.invalidateQueries({ queryKey: ['books', user?.id] });
    
    // Navigate based on context
    if (isAllBooksView) {
      navigate(`/all-books/${bookId}`); // Admin editor
    } else {
      navigate(`/books/${bookId}/read`, { state: { from: 'my-books' } }); // Reading view with back navigation
    }
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
    if (!selectedBookId) return;
    
    setEditorPageImages(prev => ({ ...prev, [currentEditorPage]: imageDataUrl }));
    setReplacePageMode(prev => ({ ...prev, [currentEditorPage]: false }));
  }, [selectedBookId, currentEditorPage]);

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
    deleteBook.mutate(bookId);
  };

  const pageTitle = isAllBooksView ? "All Books" : "My Books";
  const pageDescription = isAllBooksView 
    ? "View and manage all ABC books in the system" 
    : "Create and manage your ABC books";

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
      
      <div className="transition-all duration-300 ease-out">
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
          placeholder={isAllBooksView ? "Search all books..." : "Search your books..."}
          showSearch={isAllBooksView}
        />

        {/* Books Grid */}
        {books && books.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book, index) => (
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
                  isPublishing={schedulePublication.isPending}
                  isUnpublishing={deletePublication.isPending}
                  isDeleting={deleteBook.isPending}
                />
              ))}
            </div>

            {/* Pagination Controls - Only show for all-books view */}
            {isAllBooksView && totalCount > PAGE_SIZE && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({totalCount} total books)
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || loading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
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

      {/* Desktop: Sliding Side Panel Editor */}
      {!isMobile && (
        <div
          className={cn(
            "fixed right-0 top-[3.5rem] bottom-0 w-[400px] bg-background border-l shadow-lg z-[100]",
            "transition-transform duration-300 ease-out",
            showEditor ? "translate-x-0" : "translate-x-full"
          )}
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
        </div>
      )}
      </div>
    </>
  );
}