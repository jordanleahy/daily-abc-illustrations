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
import { useUpdateBookStatus } from '@/hooks/useUpdateBookStatus';
import { usePageImageUrlsSubscription } from '@/hooks/usePageImageUrlsSubscription';
import { useWordMetadata } from '@/hooks/useWordMetadata';
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
  
  const isAllBooksView = location.pathname === '/all-books';
  
  // Pagination state for all-books view
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const PAGE_SIZE = 18; // 3 rows of 6 books on large screens
  
  // ⚡ OPTIMIZED: Server-side filtering with theme filter
  const { books, totalCount, loading } = useBooks(
    isAllBooksView ? 'all-books' : 'my-books',
    isAllBooksView ? { page: currentPage, pageSize: PAGE_SIZE } : undefined,
    searchQuery,
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
  
  // Mobile editor state
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedBookPublication, setSelectedBookPublication] = useState<Pick<DailyPublished, 'id' | 'status' | 'publish_date'> | null>(null);
  
  // Book Editor Panel state
  const [currentEditorPage, setCurrentEditorPage] = useState(1);
  const [editorPageImages] = useState<Record<number, string>>({});
  const [editorPagePrompts] = useState<Record<number, string>>({});
  const [pageTextOverlays, setPageTextOverlays] = useState<Record<number, string>>({});
  const [coverPageId, setCoverPageId] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [replacePageMode, setReplacePageMode] = useState<Record<number, boolean>>({});
  
  // Hooks for Book Editor Panel
  const { pages: dbPages } = useBookPages(selectedBookId || undefined);
  const { data: displayImages = {} } = useBookPageImages(selectedBookId);
  const updateBookStatusMutation = useUpdateBookStatus();
  const { generateMetadata } = useWordMetadata();
  
  // Subscribe to real-time image updates
  usePageImageUrlsSubscription(selectedBookId);
  
  // Fetch book status
  const { data: bookData } = useQuery({
    queryKey: ['book', selectedBookId],
    queryFn: async () => {
      if (!selectedBookId) return null;
      const { data, error } = await supabase
        .from('books')
        .select('status')
        .eq('id', selectedBookId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBookId,
  });
  
  // Convert string status to enum safely
  const bookStatus = useMemo(() => {
    if (!bookData?.status) return PublicationStatus.DRAFT;
    
    const statusMap: Record<string, PublicationStatus> = {
      'draft': PublicationStatus.DRAFT,
      'published': PublicationStatus.PUBLISHED,
      'archived': PublicationStatus.ARCHIVED,
    };
    
    return statusMap[bookData.status] || PublicationStatus.DRAFT;
  }, [bookData?.status]);
  
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

  const handleEditBook = (bookId: string, book: any, publicationStatus?: Pick<DailyPublished, 'id' | 'status' | 'publish_date'> | null) => {
    setSelectedBookId(bookId);
    setSelectedBook(book);
    setSelectedBookPublication(publicationStatus || null);
    setCurrentEditorPage(1); // Reset to cover page
    setMobileEditorOpen(true);
  };

  // Load cover page ID when book is selected
  useEffect(() => {
    if (!selectedBookId) {
      setCoverPageId(null);
      return;
    }
    
    const fetchCoverPage = async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('id')
        .eq('book_id', selectedBookId)
        .eq('page_type', 'cover')
        .single();
      if (!error && data) setCoverPageId(data.id);
    };
    fetchCoverPage();
  }, [selectedBookId]);

  // Load thumbnail URL from cover page when book is selected
  useEffect(() => {
    if (!selectedBookId) {
      setThumbnailUrl(null);
      return;
    }
    
    const fetchCoverImage = async () => {
      const { data, error } = await supabase
        .from('page_image_urls')
        .select(`
          image_url,
          pages!inner(page_type)
        `)
        .eq('book_id', selectedBookId)
        .eq('pages.page_type', 'cover')
        .eq('is_latest', true)
        .maybeSingle();
      
      if (!error && data?.image_url) {
        setThumbnailUrl(data.image_url);
      }
    };
    fetchCoverImage();
  }, [selectedBookId]);

  // Load page text overlays from database pages (using title as single source)
  useEffect(() => {
    if (!dbPages) return;
    
    const overlays: Record<number, string> = {};
    dbPages.forEach(page => {
      if (page.title) {
        overlays[page.page_number] = page.title;
      }
    });
    setPageTextOverlays(overlays);
  }, [dbPages]);

  // Editor Panel Handlers
  const handleEditorPageNavigation = useCallback((direction: 'next' | 'prev') => {
    if (!dbPages || dbPages.length === 0) return;
    
    const sortedPages = [...dbPages].sort((a, b) => a.page_number - b.page_number);
    const currentIndex = sortedPages.findIndex(p => p.page_number === currentEditorPage);
    
    if (direction === 'next' && currentIndex < sortedPages.length - 1) {
      setCurrentEditorPage(sortedPages[currentIndex + 1].page_number);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentEditorPage(sortedPages[currentIndex - 1].page_number);
    }
  }, [dbPages, currentEditorPage]);

  const handleEditorImageUpload = useCallback(async (imageDataUrl: string) => {
    if (!selectedBookId || !dbPages) return;
    
    const currentPage = dbPages.find(p => p.page_number === currentEditorPage);
    if (!currentPage) {
      console.error('Page not found');
      return;
    }

    try {
      console.log('Uploading image...');
      
      // Convert base64 to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], `page-${currentEditorPage}-${Date.now()}.png`, { type: 'image/png' });
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(`${user?.id}/${selectedBookId}/page-${currentEditorPage}-${Date.now()}.png`, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('page-images')
        .getPublicUrl(uploadData.path);
      
      // Get next version number
      const { data: existingImages } = await supabase
        .from('page_image_urls')
        .select('version_number')
        .eq('page_id', currentPage.id)
        .order('version_number', { ascending: false })
        .limit(1);
      
      const nextVersion = (existingImages?.[0]?.version_number || 0) + 1;
      
      // Mark all previous versions as not latest
      await supabase
        .from('page_image_urls')
        .update({ is_latest: false })
        .eq('page_id', currentPage.id);
      
      // Insert new image record
      const { error: insertError } = await supabase
        .from('page_image_urls')
        .insert({
          page_id: currentPage.id,
          book_id: selectedBookId,
          user_id: user?.id,
          version_number: nextVersion,
          image_url: publicUrl,
          source_type: 'user_uploaded',
          is_latest: true,
        });
      
      if (insertError) throw insertError;
      
      // Invalidate queries to refetch images
      await queryClient.invalidateQueries({ queryKey: ['book-page-images', selectedBookId] });
      
      // If this is the cover page, also invalidate cover-specific queries
      if (currentPage.page_type === 'cover' || currentEditorPage === 1) {
        await queryClient.invalidateQueries({ queryKey: ['book-cover-image', selectedBookId] });
        await queryClient.invalidateQueries({ queryKey: ['book-cover-page', selectedBookId] });
      }
      
      // Clear replace mode for this page
      setReplacePageMode(prev => {
        const updated = { ...prev };
        delete updated[currentEditorPage];
        return updated;
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
    }
  }, [selectedBookId, dbPages, currentEditorPage, user, queryClient]);

  const handleRemoveEditorImage = useCallback(async (pageNumber: number) => {
    // Enable replace mode to show upload UI
    setReplacePageMode(prev => ({ ...prev, [pageNumber]: true }));
  }, []);

  const handleUpdatePageText = useCallback(async (pageNumber: number, newText: string) => {
    if (!selectedBookId || !dbPages) {
      console.error('Book not ready');
      return;
    }

    const page = dbPages.find(p => p.page_number === pageNumber);
    if (!page) {
      console.error('Page not found:', pageNumber);
      return;
    }
    
    console.log('Updating page:', page.id, 'with text:', newText);
    
    try {
      // Update the page title (single source of truth)
      const { error } = await supabase
        .from('pages')
        .update({ 
          title: newText,
          updated_at: new Date().toISOString()
        })
        .eq('id', page.id);
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Text saved successfully');
      
      // Regenerate word metadata from new title
      try {
        await generateMetadata({
          pageId: page.id,
          bookId: selectedBookId,
          title: newText,
          currentContent: page.content || {}
        });
        console.log('✅ Word metadata regenerated');
      } catch (metadataError) {
        console.error('Failed to regenerate word metadata:', metadataError);
      }
      
      // Invalidate queries to refresh
      await queryClient.invalidateQueries({ queryKey: ['book-pages', selectedBookId] });
    } catch (error) {
      console.error('Error updating text:', error);
    }
  }, [selectedBookId, dbPages, queryClient, generateMetadata]);

  const handleThumbnailUpload = useCallback(async (file: File) => {
    if (!selectedBookId) {
      console.error('Book not created yet');
      return;
    }
    
    try {
      console.log('Uploading cover image...');
      
      // 1. Ensure cover page exists
      const { data: existingPage } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', selectedBookId)
        .eq('page_type', 'cover')
        .maybeSingle();
      
      let coverPageId: string;
      
      if (!existingPage) {
        // Create cover page if it doesn't exist
        const { data: newPage, error: createError } = await supabase
          .from('pages')
          .insert({
            book_id: selectedBookId,
            page_number: 0,
            letter: 'Cover',
            title: 'Cover',
            page_type: 'cover',
            content: {}
          })
          .select()
          .single();
        
        if (createError || !newPage) throw createError || new Error('Failed to create cover page');
        coverPageId = newPage.id;
      } else {
        coverPageId = existingPage.id;
      }
      
      // 2. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(`${user?.id}/${selectedBookId}/cover-${Date.now()}.png`, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('page-images')
        .getPublicUrl(uploadData.path);
      
      // 4. Get next version number
      const { data: existingImages } = await supabase
        .from('page_image_urls')
        .select('version_number')
        .eq('page_id', coverPageId)
        .order('version_number', { ascending: false })
        .limit(1);
      
      const nextVersion = (existingImages?.[0]?.version_number || 0) + 1;
      
      // 5. Mark all previous versions as not latest
      await supabase
        .from('page_image_urls')
        .update({ is_latest: false })
        .eq('page_id', coverPageId);
      
      // 6. Insert new image record
      const { error: insertError } = await supabase
        .from('page_image_urls')
        .insert({
          page_id: coverPageId,
          book_id: selectedBookId,
          user_id: user?.id,
          version_number: nextVersion,
          image_url: publicUrl,
          source_type: 'user_uploaded',
          is_latest: true,
        });
      
      if (insertError) throw insertError;
      
      // 7. Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['book-cover-image', selectedBookId] });
      await queryClient.invalidateQueries({ queryKey: ['book-cover-page', selectedBookId] });
      await queryClient.invalidateQueries({ queryKey: ['book-page-images', selectedBookId] });
      await queryClient.invalidateQueries({ queryKey: ['books', user?.id] });
      
      setThumbnailUrl(publicUrl);
      
      console.log('Cover image uploaded successfully!');
    } catch (error: any) {
      console.error('Cover upload error:', error);
    }
  }, [selectedBookId, user, queryClient]);

  const handleToggleBookStatus = useCallback(async () => {
    if (!selectedBookId) {
      console.error('Book not ready');
      return;
    }
    
    const currentStatus = bookStatus;
    const newStatus = currentStatus === PublicationStatus.DRAFT 
      ? PublicationStatus.PUBLISHED 
      : PublicationStatus.DRAFT;
    
    updateBookStatusMutation.mutate({
      bookId: selectedBookId,
      status: newStatus,
    });
  }, [selectedBookId, bookStatus, updateBookStatusMutation]);

  const getCurrentPagePrompt = useCallback((pageNum: number): string | null => {
    // Not used in Books.tsx context - return null
    return null;
  }, []);

  const handleCreateNewBook = () => {
    navigate('/google-chat'); // Redirect to GoogleChat page for book creation
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
      {/* Book Editor Panel for Mobile (Bottom Sheet) and Desktop (Side Panel) */}
      {isMobile ? (
        <Sheet 
          open={mobileEditorOpen} 
          onOpenChange={setMobileEditorOpen}
        >
          <SheetContent 
            side="bottom" 
            className="w-full max-h-[90vh] p-0 overflow-hidden rounded-t-xl z-[100]"
          >
            <BookEditorPanel
              showEditor={true}
              isBookCreated={true}
              createdBookId={selectedBookId}
              currentPageNumber={currentEditorPage}
              pageCount={dbPages?.length || 0}
              displayImages={displayImages}
              editorPageImages={editorPageImages}
              editorPagePrompts={editorPagePrompts}
              getCurrentPagePrompt={getCurrentPagePrompt}
              createBookMutation={{ isSuccess: true }}
              onClose={() => setMobileEditorOpen(false)}
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
              bookStatus={bookStatus}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <div
          className={cn(
            "fixed right-0 top-[3.5rem] bottom-0 w-[400px] bg-background border-l shadow-lg z-[100]",
            "transition-transform duration-300 ease-out",
            mobileEditorOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <BookEditorPanel
            showEditor={true}
            isBookCreated={true}
            createdBookId={selectedBookId}
            currentPageNumber={currentEditorPage}
            pageCount={dbPages?.length || 0}
            displayImages={displayImages}
            editorPageImages={editorPageImages}
            editorPagePrompts={editorPagePrompts}
            getCurrentPagePrompt={getCurrentPagePrompt}
            createBookMutation={{ isSuccess: true }}
            onClose={() => setMobileEditorOpen(false)}
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
            bookStatus={bookStatus}
          />
        </div>
      )}
      
      <div 
        className={cn(
          "transition-all duration-300 ease-out",
          mobileEditorOpen && !isMobile && "mr-[400px]"
        )}
      >
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
                    const publicationStatus = book.daily_published?.[0] ? {
                      id: book.daily_published[0].id,
                      status: book.daily_published[0].status as 'draft' | 'queued' | 'active' | 'expired',
                      publish_date: book.daily_published[0].publish_date
                    } : null;
                    handleEditBook(bookId, book, publicationStatus);
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No books yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first ABC book to get started
              </p>
              <Button onClick={handleCreateNewBook}>
                <BookOpen className="mr-2 h-4 w-4" />
                Create Your First Book
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </StandardPageLayout>
      </div>
    </>
  );
}