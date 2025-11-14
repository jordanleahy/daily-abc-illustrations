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
import { cn } from '@/lib/utils';
import { PageImageSection } from '@/components/PageImageSection';
import { useBookPages } from '@/hooks/useBookPages';
import { useBook } from '@/hooks/useBook';
import { useScheduleBookPublication } from '@/hooks/useScheduleBookPublication';
import { useDeleteDailyPublished } from '@/hooks/useDeleteDailyPublished';
import { useIsMobile } from '@/hooks/use-mobile';
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
  book?: any; // Pass book data directly for instant display
}

export function MobileBookEditor({ 
  bookId, 
  open, 
  onOpenChange,
  publicationStatus,
  book: bookProp
}: MobileBookEditorProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Use passed book data for instant display, fallback to fetch if not provided
  const { data: fetchedBook } = useBook(bookId || undefined);
  const book = bookProp || fetchedBook;
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
    window.open('https://aistudio.google.com/prompts/new_chat', '_blank');
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

  if (!bookId || !book) {
    return null;
  }

  // Show loading state while pages are loading
  if (!currentPage) {
    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="h-[90vh] flex flex-col">
            <DrawerHeader className="relative border-b pb-4">
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
              <DrawerTitle className="text-left pr-12">{book.book_name}</DrawerTitle>
              <DrawerDescription className="text-left">Loading pages...</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 animate-pulse" />
                <p>Loading book pages...</p>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <div
          className={cn(
            "fixed right-0 top-0 bottom-0 w-[400px]",
            "bg-background border-l shadow-lg z-[100]",
            "transition-transform duration-300 ease-out",
            "overflow-y-auto flex flex-col",
            open ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="relative border-b px-6 py-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold pr-12">{book.book_name}</h2>
            <p className="text-sm text-muted-foreground">Loading pages...</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 animate-pulse" />
              <p>Loading book pages...</p>
            </div>
          </div>
        </div>
      );
  }

  // Mobile: Use Drawer (bottom sheet)
  if (isMobile) {
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
          <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-6">
            {/* Page Image */}
            <div>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border">
                <PageImageSection 
                  pageId={currentPage.id}
                  bookId={bookId}
                />
              </div>
            </div>
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
                  Unpublish
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={handlePublishToggle}
                  disabled={schedulePublication.isPending}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Publish
                </Button>
              )}
              <Button onClick={handleReadBook}>
                <BookOpen className="mr-2 h-4 w-4" />
                Read
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
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use plain div (side panel like Outline)
  return (
    <div
        className={cn(
          "fixed right-0 top-0 bottom-0 w-[400px]",
          "bg-background border-l shadow-lg z-[100]",
          "transition-transform duration-300 ease-out",
          "overflow-y-auto flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="relative border-b px-6 py-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold pr-12">
            Page {currentPage.page_number}: {currentPage.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {book.book_name}
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-6">
          {/* Page Image */}
          <div>
            <div className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border">
              <PageImageSection 
                pageId={currentPage.id}
                bookId={bookId}
              />
            </div>
          </div>
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
                Unpublish
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={handlePublishToggle}
                disabled={schedulePublication.isPending}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Publish
              </Button>
            )}
            <Button onClick={handleReadBook}>
              <BookOpen className="mr-2 h-4 w-4" />
              Read
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
        </div>
      </div>
    );
}
