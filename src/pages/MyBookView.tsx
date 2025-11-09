import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBook } from '@/hooks/useBook';
import { useBookPages } from '@/hooks/useBookPages';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ReadingHeader } from '@/components/layout/ReadingHeader';
import { Card } from '@/components/ui/card';
import { BottomSlideNavigation } from '@/components/ui/bottom-slide-navigation';
import { isValidUUID } from '@/utils/uuid';
import { OptimizedImage } from '@/components/ui/optimized-image';

export default function MyBookView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const safeId = id && isValidUUID(id) ? id : undefined;
  
  const { data: book, isLoading: isLoadingBook } = useBook(safeId);
  const { pages = [], loading: isLoadingPages } = useBookPages(safeId);
  const { data: pageImages = {} } = useBookPageImages(safeId);
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  const isLoading = isLoadingBook || isLoadingPages;
  const isLastPage = currentPageIndex === pages.length - 1;

  // Ensure user owns this book
  useEffect(() => {
    if (book && user && book.user_id !== user.id) {
      toast.error('You do not have permission to view this book');
      navigate('/books');
    }
  }, [book, user, navigate]);

  const handleBack = () => {
    navigate('/books');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading book...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
        <Card className="max-w-md w-full">
          <div className="p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold">Book Not Found</h2>
            <p className="text-sm text-muted-foreground">
              This book could not be found.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (book.status !== 'published') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
        <Card className="max-w-md w-full">
          <div className="p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold">Book Not Published</h2>
            <p className="text-sm text-muted-foreground">
              This book needs to be published before you can view it.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <ReadingHeader title={book.book_name} onBack={handleBack} showQRCode={false} />
        <Card className="max-w-md w-full mt-20">
          <div className="p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold">{book.book_name}</h2>
            <p className="text-sm text-muted-foreground">
              This book doesn't have any pages to display.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];
  const currentImageUrl = currentPage ? pageImages[currentPage.page_number] : null;

  const handleNext = () => {
    if (isLastPage) {
      toast.success('You finished the book! 🎉');
      navigate('/books');
    } else {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const handleHeaderPrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const handleHeaderNext = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col h-screen" style={{ touchAction: 'none' }}>
        <ReadingHeader 
          title={book.book_name}
          subtitle={`${currentPageIndex + 1} of ${pages.length}`}
          bookId={book.id}
          onBack={handleBack}
          onPrevious={handleHeaderPrevious}
          onNext={handleHeaderNext}
          hasPrevious={currentPageIndex > 0}
          hasNext={currentPageIndex < pages.length - 1}
          showQRCode={false}
        />
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col pb-4 pt-20">
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm mx-auto shadow-lg relative">
              {currentImageUrl ? (
                <OptimizedImage
                  src={currentImageUrl}
                  alt={`${currentPage.letter} - ${currentPage.title}`}
                  className="w-full h-auto rounded-lg"
                  loading="eager"
                />
              ) : (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">No image available</p>
                </div>
              )}
            </Card>
          </div>
          
          {/* Navigation */}
          <BottomSlideNavigation 
            onSlide={handleNext}
            variant="compact"
            slideText={isLastPage ? "Finish Book" : undefined}
          />
        </div>
      </div>
    </div>
  );
}
