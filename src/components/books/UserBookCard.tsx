import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Checkbox } from '@/components/ui/checkbox';
import { BookImage } from '@/components/ui/book-image';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { AdminOnly } from '@/components/AdminOnly';
import { SocialPostTracker } from '@/components/books/SocialPostTracker';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useDuplicateBook } from '@/hooks/useDuplicateBook';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getThemeDisplayName } from '@/types/characterTheme';
import { getBookTypeDisplayName } from '@/types/bookType';
import { supabase } from '@/integrations/supabase/client';
import { copyToClipboard } from '@/utils/clipboardHelpers';
import { generateDigraphMarketingPost } from '@/utils/marketing/generateDigraphMarketingPost';
import { SITE_CONFIG } from '@/config/site';
import { BookOpen, Copy, Link2, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyPublished } from '@/types/dailyPublished';

export interface UserBookCardProps {
  book: any;
  onClick: () => void;
  index: number;
  onEditClick?: (bookId: string) => void;
  publicationStatus?: Pick<DailyPublished, 'id' | 'status' | 'publish_date' | 'slug'> | null;
  onPublish?: (bookId: string, title: string, description?: string) => void;
  onUnpublish?: (dailyPublishedId: string) => void;
  onDelete?: (bookId: string, bookName: string) => void;
  isPublishing?: boolean;
  isUnpublishing?: boolean;
  isDeleting?: boolean;
  // Selection mode props
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (bookId: string, selected: boolean) => void;
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
  selectionMode = false,
  isSelected = false,
  onSelectionChange,
}: UserBookCardProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const { mutate: duplicateBook, isPending: isDuplicating } = useDuplicateBook();
  const [isCopyingMarketingPost, setIsCopyingMarketingPost] = useState(false);
  const coverImageUrl = book.coverImageUrl;
  
  const { ref, inView } = useIntersectionObserver({
    rootMargin: '200px',
    triggerOnce: true,
  });
  
  const shouldLoadImmediately = index < 6;
  const shouldRender = shouldLoadImmediately || inView;

  const handleCopyMarketingPost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCopyingMarketingPost(true);
    
    try {
      // Create the text Promise immediately in user gesture context (iOS Safari fix)
      const textPromise = async (): Promise<Blob> => {
        // Fetch content pages inside the promise
        const { data: pages, error } = await supabase
          .from('pages')
          .select('title, page_number')
          .eq('book_id', book.id)
          .gte('page_number', 3)
          .order('page_number', { ascending: true });
        
        if (error) throw error;
        
        const pageTitles = pages?.map(p => p.title) || [];
        const marketingUrl = `${SITE_CONFIG.productionUrl}/book/${book.marketing_url}`;
        
        const post = generateDigraphMarketingPost({
          bookName: book.book_name,
          bookDescription: book.book_description,
          characterTheme: book.metadata?.characterTheme || null,
          marketingUrl,
          pageTitles,
        });
        
        return new Blob([post], { type: 'text/plain' });
      };
      
      // Call clipboard API immediately with the Promise (keeps user gesture context)
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/plain': textPromise() })
      ]);
      
      toast({ title: "Marketing post copied!" });
    } catch (error) {
      console.error('Failed to copy marketing post:', error);
      toast({ title: "Failed to copy", variant: "destructive" });
    } finally {
      setIsCopyingMarketingPost(false);
    }
  };

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

  const handleCardClick = () => {
    if (selectionMode) {
      onSelectionChange?.(book.id, !isSelected);
    } else {
      onClick();
    }
  };

  return (
    <Card 
      ref={ref}
      className={cn(
        "cursor-pointer hover:shadow-lg transition-shadow group overflow-hidden",
        selectionMode && isSelected && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start gap-3">
          {selectionMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => {
                onSelectionChange?.(book.id, !!checked);
              }}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
          )}
          <CardTitle className="text-lg group-hover:text-primary transition-colors flex-1">
            {book.book_name}
          </CardTitle>
        </div>
        
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
            
            {/* Duplicate button - Admin only */}
            <Button 
              variant="outline" 
              size="sm"
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

            {/* Marketing Link - Admin only */}
            {book.marketing_url && (
              <Button 
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={async (e) => {
                  e.stopPropagation();
                  const marketingLink = `${SITE_CONFIG.productionUrl}/book/${book.marketing_url}`;
                  try {
                    await copyToClipboard(marketingLink);
                    toast({ title: "Marketing link copied" });
                  } catch (error) {
                    console.error('Failed to copy marketing link:', error);
                  }
                }}
              >
                <Link2 className="h-4 w-4" />
                Landing Page
              </Button>
            )}

            {/* Marketing Post - Digraph books only */}
            {book.metadata?.bookType === 'digraphs' && book.marketing_url && (
              <div className="space-y-2">
                <Button 
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleCopyMarketingPost}
                  disabled={isCopyingMarketingPost}
                >
                  <Share2 className="h-4 w-4" />
                  {isCopyingMarketingPost ? 'Copying...' : 'Social Post'}
                </Button>
                <SocialPostTracker bookId={book.id} />
              </div>
            )}

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
              <>
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
                  Library Link
                </Button>
              </>
            )}
          </div>
        </AdminOnly>
      </CardContent>
    </Card>
  );
}
