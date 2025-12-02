import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BookFilterBar } from '@/components/filters';
import { useAuthContext } from '@/contexts/AuthContext';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useBooks } from '@/hooks/useBooks';
import { useOptimizedSearch } from '@/hooks/useOptimizedSearch';

import { BookOpen, Calendar, Trash2 } from 'lucide-react';
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
import { extractAvailableThemes } from '@/utils/themeFilters';
import { getThemeDisplayName } from '@/types/characterTheme';
import { getBookTypeDisplayName } from '@/types/bookType';
import { useEditorImagePreloader } from '@/hooks/useEditorImagePreloader';
import { BookImage } from '@/components/ui/book-image';
import { useScheduleBookPublication } from '@/hooks/useScheduleBookPublication';
import { useDeleteDailyPublished } from '@/hooks/useDeleteDailyPublished';
import { useDeleteBook } from '@/hooks/useDeleteBook';
import { useIsMobile } from '@/hooks/use-mobile';
import { BookEditorContainer } from '@/components/books/BookEditorContainer';
import { supabase } from '@/integrations/supabase/client';
import { AdminOnly } from '@/components/AdminOnly';
import { cn } from '@/lib/utils';
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
import type { DailyPublished } from '@/types/dailyPublished';

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
  queryClient: ReturnType<typeof useQueryClient>;
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
  isDeleting,
  queryClient
}: UserBookCardProps) {
  const coverImageUrl = book.coverImageUrl;
  
  const { ref, inView } = useIntersectionObserver({
    rootMargin: '200px',
    triggerOnce: true,
  });
  
  const shouldLoadImmediately = index < 6;
  const shouldRender = shouldLoadImmediately || inView;

  const handleEditHover = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['book-page-images', book.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('page_image_urls')
          .select(`id, image_url, pages!inner(page_number)`)
          .eq('book_id', book.id)
          .eq('is_latest', true)
          .not('image_url', 'is', null)
          .order('pages(page_number)', { ascending: true });

        if (error) throw error;

        const imageMap: Record<number, string> = {};
        data?.forEach((item: any) => {
          if (item.image_url && item.pages?.page_number !== undefined) {
            imageMap[item.pages.page_number] = item.image_url;
          }
        });
        return imageMap;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [book.id, queryClient]);

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
        
        <div className="flex flex-wrap gap-2">
          {book.metadata?.bookType && (
            <Badge variant="secondary" className="capitalize">
              {getBookTypeDisplayName(book.metadata.bookType)}
            </Badge>
          )}
          {book.metadata?.characterTheme && (
            <Badge variant="default">
              {getThemeDisplayName(book.metadata.characterTheme)}
            </Badge>
          )}
          {book.metadata?.pageCount && (
            <Badge variant="outline">
              {book.metadata.pageCount} pages
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumbnail:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="text-white flex flex-col items-center gap-2">
              <BookOpen className="h-8 w-8" />
              <span className="text-sm font-medium">Read Book</span>
            </div>
          </div>
        </AspectRatio>

        <Button 
          variant="outline" 
          className="w-full"
          onMouseEnter={handleEditHover}
          onClick={(e) => {
            e.stopPropagation();
            if (onEditClick) onEditClick(book.id);
          }}
        >
          Edit
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => e.stopPropagation()}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : <><Trash2 className="mr-2 h-4 w-4" />Delete Book</>}
            </Button>
          </AlertDialogTrigger>
          
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{book.book_name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all pages, images, and content.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete) onDelete(book.id, book.book_name);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AdminOnly fallback={null}>
          <div className="space-y-2 pt-3 mt-3 border-t border-border/50">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Admin Actions</div>
            <Button 
              variant={publicationStatus ? "destructive" : "default"}
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                if (publicationStatus) {
                  onUnpublish?.(publicationStatus.id);
                } else {
                  onPublish?.(book.id, book.book_name, book.book_description);
                }
              }}
              disabled={isPublishing || isUnpublishing}
            >
              {publicationStatus ? 'Remove from Library' : 'Add to Library'}
            </Button>
          </div>
        </AdminOnly>
      </CardContent>
    </Card>
  );
}

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
  
  // ⚡ PERFORMANCE: Only track editor open state - hooks load lazily in BookEditorContainer
  const [showEditor, setShowEditor] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const PAGE_SIZE = 24;
  
  const { rawQuery: searchQuery, activeQuery: debouncedSearchQuery, setSearchQuery } = useOptimizedSearch('debounced', 300);
  
  const { books, totalCount, loading } = useBooks(
    'my-books',
    { page: currentPage, pageSize: PAGE_SIZE },
    debouncedSearchQuery,
    selectedThemes.length > 0 ? selectedThemes : undefined
  );
  
  const availableThemes = useMemo(() => extractAvailableThemes([]), []);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedThemes]);
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  
  useEditorImagePreloader(books);

  const handleViewBook = async (bookId: string) => {
    const kidId = kidProfiles.length > 0 ? kidProfiles[0].id : undefined;
    trackUserBookActivity(bookId, kidId);
    queryClient.invalidateQueries({ queryKey: ['books', user?.id] });
    navigate(`/books/${bookId}/read`, { state: { from: 'my-books' } });
  };

  const handleEditBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedBookId(null);
  };

  const pageTitle = "My Books";
  const pageDescription = "Create and manage your ABC books";

  if (authLoading) {
    return <StandardPageLayout title={pageTitle} containerClassName="py-8"><LoadingState /></StandardPageLayout>;
  }

  if (!user) return null;

  if (loading) {
    return <StandardPageLayout title={pageTitle} containerClassName="py-8"><LoadingState text="Loading your books..." /></StandardPageLayout>;
  }

  return (
    <>
      <div className="flex w-full">
        <div className={cn("flex-1 min-w-0 transition-all duration-300 ease-out", showEditor && !isMobile && "mr-0")}>
          <StandardPageLayout title={pageTitle} containerClassName="py-8">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="text-center md:text-left">
                  <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
                  <p className="text-muted-foreground">{pageDescription}</p>
                </div>
                <Button onClick={() => navigate('/google-chat')} className="w-full md:w-auto md:shrink-0">
                  <BookOpen className="mr-2 h-4 w-4" />Create New Book
                </Button>
              </div>

              <BookFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedThemes={selectedThemes}
                onThemesChange={setSelectedThemes}
                availableThemes={availableThemes}
                placeholder="Search your books..."
                showSearch={true}
              />

              {books && books.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books.map((book, index) => (
                      <UserBookCard
                        key={book.id}
                        book={book}
                        index={index}
                        onClick={() => handleViewBook(book.id)}
                        onEditClick={handleEditBook}
                        publicationStatus={book.daily_published?.[0] ? {
                          id: book.daily_published[0].id,
                          status: book.daily_published[0].status as any,
                          publish_date: book.daily_published[0].publish_date
                        } : null}
                        onPublish={(id, title, desc) => schedulePublication.mutate({ bookId: id, title, description: desc })}
                        onUnpublish={(id) => deletePublication.mutate(id)}
                        onDelete={(id) => deleteBook.mutate(id)}
                        isPublishing={schedulePublication.isPending}
                        isUnpublishing={deletePublication.isPending}
                        isDeleting={deleteBook.isPending}
                        queryClient={queryClient}
                      />
                    ))}
                  </div>

                  {totalCount > PAGE_SIZE && (
                    <div className="flex flex-col items-center gap-4 mt-8">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={cn("cursor-pointer", currentPage === 1 && "pointer-events-none opacity-50")}
                            />
                          </PaginationItem>
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                            <PaginationItem key={page}>
                              <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          {totalPages > 5 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={cn("cursor-pointer", currentPage === totalPages && "pointer-events-none opacity-50")}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
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
                        Create personalized ABC books with our AI assistant.
                      </p>
                    </div>
                    <Button onClick={() => navigate('/google-chat')} size="lg">
                      <BookOpen className="mr-2 h-5 w-5" />Create Your First Book
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </StandardPageLayout>
        </div>

        {/* ⚡ LAZY LOADED: Editor container only mounts when needed */}
        {showEditor && selectedBookId && (
          <BookEditorContainer
            bookId={selectedBookId}
            isMobile={isMobile}
            onClose={handleCloseEditor}
          />
        )}
      </div>
    </>
  );
}
