import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { BookPageEditor } from '@/components/book/BookPageEditor';
import { useBook } from '@/hooks/useBook';
import { useBookPages } from '@/hooks/useBookPages';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { PublicationStatus } from '@/types/shared/status';
import { useScheduleBookPublication } from '@/hooks/useScheduleBookPublication';
import { useDeleteDailyPublished } from '@/hooks/useDeleteDailyPublished';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { LoadingState } from '@/components/ui/loading-state';
import { Book } from '@/types/book';
import { usePageImageUrlsSubscription } from '@/hooks/usePageImageUrlsSubscription';

interface MobileBookEditorProps {
  bookId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicationStatus?: PublicationStatus;
  book?: Book;
}

export function MobileBookEditor({
  bookId,
  open,
  onOpenChange,
  publicationStatus = PublicationStatus.DRAFT,
  book
}: MobileBookEditorProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const { data: bookData } = useBook(bookId);
  const { pages, loading: isPagesLoading } = useBookPages(bookId);
  const { data: pageImages } = useBookPageImages(bookId);
  const scheduleBook = useScheduleBookPublication();
  const deletePublication = useDeleteDailyPublished();

  // Subscribe to real-time image updates
  usePageImageUrlsSubscription(bookId);

  const effectiveBook = book || bookData;

  // Reset to first page when drawer opens
  useEffect(() => {
    if (open) {
      setCurrentPageIndex(0);
    }
  }, [open]);

  const handlePublishToggle = async () => {
    if (!bookId) return;

    try {
      if (publicationStatus === PublicationStatus.DRAFT) {
        await scheduleBook.mutateAsync({
          bookId,
          title: effectiveBook?.book_name || 'Untitled Book',
          description: effectiveBook?.book_description || ''
        });
        toast({
          title: "Book scheduled",
          description: "Your book has been added to the publication queue"
        });
      } else {
        await deletePublication.mutateAsync(bookId);
        toast({
          title: "Book unpublished",
          description: "Your book has been removed from the publication queue"
        });
      }
    } catch (error) {
      console.error('Error toggling publication status:', error);
      toast({
        title: "Error",
        description: "Failed to update publication status",
        variant: "destructive"
      });
    }
  };

  // Page images are already in the correct format from useBookPageImages
  const displayImages: Record<number, string> = pageImages || {};

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh]">
        {isPagesLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <LoadingState />
          </div>
        ) : (
          <BookPageEditor
            currentPage={currentPageIndex}
            pageCount={pages?.length || 0}
            displayImages={displayImages}
            qaPageImages={{}}
            qaPagePrompts={{}}
            bookId={bookId}
            createdBookId={bookId}
            isBookCreated={true}
            bookStatus={publicationStatus}
            coverPageId={pages?.[0]?.id}
            thumbnailUrl={null}
            onNavigate={(direction) => {
              if (direction === 'prev') {
                setCurrentPageIndex(prev => Math.max(0, prev - 1));
              } else {
                setCurrentPageIndex(prev => Math.min((pages?.length || 1) - 1, prev + 1));
              }
            }}
            onImageUpload={async (base64) => {
              toast({
                title: "Feature coming soon",
                description: "Image upload will be available soon"
              });
            }}
            onRemoveImage={(pageNumber) => {
              toast({
                title: "Feature coming soon",
                description: "Image removal will be available soon"
              });
            }}
            onToggleStatus={handlePublishToggle}
            getCurrentPagePrompt={(pageNum) => {
              return pages?.[pageNum]?.title || null;
            }}
            showCloseButton={false}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
