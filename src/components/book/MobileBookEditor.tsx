import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { PageImageSection } from '@/components/PageImageSection';
import { useBookPages } from '@/hooks/useBookPages';
import { useBook } from '@/hooks/useBook';
import { useScheduleBookPublication } from '@/hooks/useScheduleBookPublication';
import { useDeleteDailyPublished } from '@/hooks/useDeleteDailyPublished';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  FileImage,
  FileX
} from 'lucide-react';
import type { DailyPublished } from '@/types/dailyPublished';

interface MobileBookEditorProps {
  bookId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicationStatus?: Pick<DailyPublished, 'id' | 'status' | 'publish_date'> | null;
}

export function MobileBookEditor({ 
  bookId, 
  open, 
  onOpenChange,
  publicationStatus 
}: MobileBookEditorProps) {
  const navigate = useNavigate();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const { data: book } = useBook(bookId || undefined);
  const { pages } = useBookPages(bookId || undefined);
  const schedulePublication = useScheduleBookPublication();
  const deletePublication = useDeleteDailyPublished();

  const currentPage = pages[currentPageIndex];
  const isPublished = publicationStatus?.status === 'active' || publicationStatus?.status === 'queued';

  const handleNext = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleReadBook = () => {
    if (bookId) {
      navigate(`/books/${bookId}/read`);
      onOpenChange(false);
    }
  };

  const handleImageGenerator = () => {
    if (bookId && currentPage) {
      navigate(`/books/${bookId}`, { state: { focusedPageId: currentPage.id } });
      onOpenChange(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!book) return;

    if (isPublished && publicationStatus?.id) {
      await deletePublication.mutateAsync(publicationStatus.id);
    } else {
      await schedulePublication.mutateAsync({
        bookId: book.id,
        title: book.book_name,
        description: book.book_description || undefined
      });
    }
  };

  if (!bookId || !book || !currentPage) {
    return null;
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh] flex flex-col">
        <DrawerHeader className="relative border-b pb-4">
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
          
          <DrawerTitle className="text-left pr-12">
            Page {currentPage.page_number}: {currentPage.title}
          </DrawerTitle>
          <DrawerDescription className="text-left">
            {book.book_name}
          </DrawerDescription>
        </DrawerHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Page Image */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Page Image
            </h3>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border">
              <PageImageSection 
                pageId={currentPage.id}
                bookId={bookId}
              />
            </div>
          </div>

          {/* Page Description */}
          {currentPage.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Description
              </h3>
              <p className="text-sm text-foreground">
                {currentPage.description}
              </p>
            </div>
          )}
        </div>

        {/* Fixed Footer Actions */}
        <div className="border-t bg-background p-4 space-y-3">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-3">
            {isPublished ? (
              <Button 
                variant="outline" 
                onClick={handlePublishToggle}
                disabled={deletePublication.isPending}
              >
                <FileX className="mr-2 h-4 w-4" />
                Unpublish Book
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={handlePublishToggle}
                disabled={schedulePublication.isPending}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Publish Book
              </Button>
            )}
            <Button onClick={handleReadBook}>
              <BookOpen className="mr-2 h-4 w-4" />
              Read Book
            </Button>
          </div>

          {/* Navigation */}
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentPageIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              variant="outline" 
              onClick={handleImageGenerator}
            >
              <FileImage className="mr-2 h-4 w-4" />
              Images
            </Button>
            <Button 
              onClick={handleNext}
              disabled={currentPageIndex === pages.length - 1}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Page Counter */}
          <div className="text-center text-sm text-muted-foreground">
            Page {currentPageIndex + 1} of {pages.length}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
