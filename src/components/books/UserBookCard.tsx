import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BookImage } from '@/components/ui/book-image';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { AdminOnly } from '@/components/AdminOnly';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDuplicateBook } from '@/hooks/useDuplicateBook';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getThemeDisplayName } from '@/types/characterTheme';
import { getBookTypeDisplayName } from '@/types/bookType';
import { supabase } from '@/integrations/supabase/client';
import { copyToClipboard } from '@/utils/clipboardHelpers';
import { SITE_CONFIG } from '@/config/site';
import { BookOpen, Copy, Link2 } from 'lucide-react';
import type { DailyPublished } from '@/types/dailyPublished';

export interface UserBookCardProps {
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

export function UserBookCard({ 
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
}: UserBookCardProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const { mutate: duplicateBook, isPending: isDuplicating } = useDuplicateBook();
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
          className="w-full gap-2"
          onClick={(e) => {
            e.stopPropagation();
            if (user) duplicateBook({ bookId: book.id, userId: user.id });
          }}
          disabled={isDuplicating}
        >
          <Copy className="h-4 w-4" />
          {isDuplicating ? 'Duplicating...' : 'Duplicate'}
        </Button>

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

        <DeleteConfirmDialog
          title={`Delete "${book.book_name}"?`}
          description="This action cannot be undone. This will permanently delete all pages, images, and content."
          onConfirm={() => onDelete?.(book.id, book.book_name)}
          isDeleting={isDeleting}
          trigger={
            <Button 
              variant="outline" 
              size="sm"
              className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => e.stopPropagation()}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Book'}
            </Button>
          }
        />

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
            
            {publicationStatus && (
              <Button 
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={async (e) => {
                  e.stopPropagation();
                  const libraryLink = `${SITE_CONFIG.productionUrl}/library/${book.id}`;
                  try {
                    await copyToClipboard(libraryLink);
                    toast({ title: "Link copied" });
                  } catch (error) {
                    console.error('Failed to copy link:', error);
                  }
                }}
              >
                <Link2 className="h-4 w-4" />
                Copy Link
              </Button>
            )}
          </div>
        </AdminOnly>
      </CardContent>
    </Card>
  );
}
