import { useCallback, memo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BookOpen, Trash2 } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { getThemeDisplayName } from '@/types/characterTheme';
import { getBookTypeDisplayName } from '@/types/bookType';
import { BookImage } from '@/components/ui/book-image';
import { supabase } from '@/integrations/supabase/client';
import { AdminOnly } from '@/components/AdminOnly';
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
  queryClient: ReturnType<typeof useQueryClient>;
}

function UserBookCardComponent({ 
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

  // Phase 2: Hover-based prefetching for instant editor loading
  const handleEditHover = useCallback(() => {
    // Prefetch editor data on hover (500ms before click)
    queryClient.prefetchQuery({
      queryKey: ['book-page-images', book.id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('page_image_urls')
          .select(`
            id,
            image_url,
            pages!inner(
              page_number
            )
          `)
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
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
          onMouseEnter={handleEditHover}
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

// Memoize to prevent unnecessary re-renders
export const UserBookCard = memo(UserBookCardComponent);
