import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useBook } from '@/hooks/useBook';
import { useBookPages } from '@/hooks/useBookPages';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { useBookEditorImagePreloader } from '@/hooks/useBookEditorImagePreloader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookImage } from '@/components/ui/book-image';
import { UnifiedReadingView } from '@/components/reading';
import { SwipeUpDrawer } from '@/components/ui/swipe-up-drawer';
import { RoleDebugger } from '@/components/RoleDebugger';
import { Calendar } from 'lucide-react';
import { isValidUUID } from '@/utils/uuid';

export default function BookReadingView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const safeId = id && isValidUUID(id) ? id : undefined;
  
  const { data: book, isLoading: isLoadingBook, error: bookError } = useBook(safeId);
  const { pages = [], loading: isLoadingPages } = useBookPages(safeId);
  const { data: pageImages = {} } = useBookPageImages(safeId);
  
  // Get starting page index from location state
  const startingPageIndex = location.state?.startingPageIndex ?? 0;
  
  // Prefetch all page images in the background for instant navigation
  useBookEditorImagePreloader(pageImages);
  
  const isLoading = isLoadingBook || isLoadingPages;

  const handleBack = () => {
    // If user came from Google Chat, navigate back to that specific session
    if (location.state?.from === 'google-chat') {
      const sessionId = location.state?.sessionId;
      if (sessionId) {
        navigate(`/google-chat?session=${sessionId}`);
      } else {
        navigate('/google-chat');
      }
    } else {
      navigate('/library');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (bookError || !book) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-4">
        <Card className="max-w-md w-full mt-20">
          <div className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Book Not Found</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              This book could not be found in your library.
            </p>
            {bookError && (
              <p className="text-sm text-destructive">
                Error: {bookError.message}
              </p>
            )}
          </div>
        </Card>
        <RoleDebugger />
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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

  const entryPoint = location.state?.from === 'library' ? 'library_card' : 'direct_link';
  const backLabel = location.state?.from === 'google-chat' ? 'Chat' : 'Library';

  return (
    <UnifiedReadingView
      contentType="user_book"
      book={{
        id: book.id,
        book_id: book.id,
        book_name: book.book_name,
        book_description: book.book_description,
      }}
      pages={pages}
      startingPageIndex={startingPageIndex}
      onBack={handleBack}
      backLabel={backLabel}
      showUploadButton={true}
      showSwipeDrawer={true}
      entryPoint={entryPoint}
      imageComponent={(page, pageIndex) => {
        const currentImageUrl = pageImages[page.page_number];
        
        if (!currentImageUrl) {
          return (
            <Card className="shadow-lg">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-b from-muted to-muted/60 flex items-center justify-center">
                  <div className="text-center px-6">
                    <p className="text-sm font-semibold">{page?.title || page?.letter || 'Page'}</p>
                    <p className="text-xs text-muted-foreground mt-1">No image yet. Upload one to start reading.</p>
                    <Button className="mt-3" size="sm" variant="secondary">
                      Upload image
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        }
        
        return (
          <BookImage
            src={currentImageUrl}
            alt={page?.content?.mainConcept || page?.title || "Page illustration"}
            priority={true}
            className="w-full h-full object-cover object-top rounded-lg"
          />
        );
      }}
      drawerContent={(page) => (
        <SwipeUpDrawer>
          <div className="space-y-6 pb-6">
            {page?.content && (
              <div className="space-y-4">
                {page.content.mainConcept && (
                  <div>
                    <h3 className="text-lg font-bold mb-2">Main Concept</h3>
                    <p className="text-muted-foreground">{page.content.mainConcept}</p>
                  </div>
                )}
                
                {page.content.funFact && (
                  <div>
                    <h3 className="text-lg font-bold mb-2">Fun Fact</h3>
                    <p className="text-muted-foreground">{page.content.funFact}</p>
                  </div>
                )}
                
                {page.content.activity && (
                  <div>
                    <h3 className="text-lg font-bold mb-2">Activity</h3>
                    <p className="text-muted-foreground">{page.content.activity}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SwipeUpDrawer>
      )}
    />
  );
}
