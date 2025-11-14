import { useParams, useNavigate } from 'react-router-dom';
import { useLibraryBookById } from '@/hooks/useLibraryBookById';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { useDailyPublishedImagePreloader } from '@/hooks/useDailyPublishedImagePreloader';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useAddBookAsHabit } from '@/hooks/useAddBookAsHabit';
import { useIsBookAddedAsHabit } from '@/hooks/useIsBookAddedAsHabit';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useSubscription } from '@/hooks/useSubscription';
import { useScheduleBookPublication } from '@/hooks/useScheduleBookPublication';
import { useBookPublicationStatus } from '@/hooks/useBookPublicationStatus';
import { useHasRole } from '@/hooks/useUserRole';
import { MetaHead } from '@/components/common';
import { StandardPageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicPageImage } from '@/components/daily-published';
import { Calendar, BookOpen, Download, Plus, CheckCircle, Lock, Loader2 } from 'lucide-react';
import { isValidUUID } from '@/utils/uuid';
import { generateBookPDF } from '@/services/pdfGenerator';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function UserLibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const safeId = id && isValidUUID(id) ? id : undefined;
  
  const { data: dailyContent, isLoading: isLoadingDaily, error: dailyError } = useLibraryBookById(safeId);
  
  // Extract pages and images from single query (no waterfall!)
  const pages = dailyContent?.pages || [];
  const pageImages = pages.reduce((acc, page) => {
    const latestImage = page.page_images?.[0];
    if (latestImage?.image_url) {
      acc[page.page_number] = latestImage.image_url;
    }
    return acc;
  }, {} as Record<number, string>);
  
  const { data: kidProfiles = [] } = useKidProfiles();
  const addBookAsHabit = useAddBookAsHabit();
  const { data: isBookAdded = false } = useIsBookAddedAsHabit(dailyContent?.book_id);
  const { hasHabitsRewards } = useFeatureAccess();
  const { hasActiveSubscription } = useSubscription();
  const schedulePublication = useScheduleBookPublication();
  const { data: publicationStatus } = useBookPublicationStatus(dailyContent?.book_id);
  const isAdmin = useHasRole('admin');
  
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Preload all page images for instant display (using joined data)
  useDailyPublishedImagePreloader(pages, dailyContent?.book_id, pageImages);
  
  const isLoading = isLoadingDaily;

  const handlePageClick = (pageIndex: number) => {
    navigate(`/library/${id}`, { 
      state: { 
        startingPageIndex: pageIndex,
        from: 'user-library-detail' 
      } 
    });
  };

  const handleAddAsHabit = () => {
    if (!dailyContent || kidProfiles.length === 0) {
      toast({
        title: 'No Kids Found',
        description: 'Please create a kid profile first to add habits.',
        variant: 'destructive',
      });
      return;
    }

    // Edge case: Prevent adding books with 0 pages
    const totalPages = (dailyContent as any).book?.total_pages || 0;
    if (totalPages === 0) {
      toast({
        title: 'Cannot Add Book',
        description: 'This book has no pages and cannot be added as a habit.',
        variant: 'destructive',
      });
      return;
    }

    // Auto-select all kids
    const kidIds = kidProfiles.map(k => k.id);
    
    addBookAsHabit.mutate({
      bookTitle: dailyContent.title,
      bookId: dailyContent.book_id,
      kidIds,
      coinAmount: totalPages, // Dynamic: 1 page = 1 coin
    });
  };

  const handleDownloadPDF = async () => {
    if (!hasActiveSubscription) {
      toast({
        title: "Plus Feature",
        description: "Upgrade to Plus to download PDF versions of books.",
        variant: "destructive",
      });
      return;
    }

    if (!dailyContent?.book_id || !pages.length) return;
    
    setIsDownloading(true);
    try {
      // Use the generateBookPDF function which properly fetches images
      await generateBookPDF(dailyContent.book_id, dailyContent.title, {
        onProgress: (current, total, currentPage) => {
          console.log(`Processing page ${currentPage}: ${current} of ${total}`);
        },
        onError: (error, pageId) => {
          console.error(`Error processing page ${pageId}:`, error);
        }
      });

      toast({
        title: "Success",
        description: "PDF downloaded successfully!",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <StandardPageLayout title="Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading book details...</p>
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  if (dailyError || !dailyContent) {
    return (
      <StandardPageLayout title="Book Not Found">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Calendar className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Book Not Found</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              This book could not be found in your library.
            </p>
          </div>
          <Button onClick={() => navigate('/library')} variant="outline">
            Back to Library
          </Button>
        </div>
      </StandardPageLayout>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <StandardPageLayout title={dailyContent.title}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">No Pages Available</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              This book doesn't have any pages to display yet.
            </p>
          </div>
          <Button onClick={() => navigate('/library')} variant="outline">
            Back to Library
          </Button>
        </div>
      </StandardPageLayout>
    );
  }

  // Generate basic metadata for browser tab/bookmarks (no expensive OpenGraph needed for library pages)
  const basicMetadata = dailyContent ? {
    title: `${dailyContent.title} | Library`,
    description: dailyContent.description || undefined,
  } : undefined;

  return (
    <>
      {basicMetadata && <MetaHead metadata={basicMetadata} />}
      
      <StandardPageLayout>
        {/* Header Section */}
        <div className="space-y-6 mb-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight mb-2">{dailyContent.title}</h1>
                {dailyContent.description && (
                  <p className="text-muted-foreground">{dailyContent.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Publication status badge */}
                {publicationStatus && (
                  <Badge
                    variant={
                      publicationStatus.status === 'active'
                        ? 'default'
                        : publicationStatus.status === 'queued'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="px-3 py-1"
                  >
                    {publicationStatus.status === 'active' && '🟢 Active'}
                    {publicationStatus.status === 'queued' && `📅 ${new Date(publicationStatus.publish_date).toLocaleDateString()}`}
                    {publicationStatus.status === 'expired' && '⏱️ Expired'}
                  </Badge>
                )}

                {/* Schedule for publication button */}
                {isAdmin && !publicationStatus && dailyContent && (
                  <Button
                    onClick={() => {
                      schedulePublication.mutate({
                        bookId: dailyContent.book_id,
                        title: dailyContent.title,
                        description: dailyContent.description || undefined,
                      });
                    }}
                    disabled={schedulePublication.isPending}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    title="Schedule for publication"
                  >
                    {schedulePublication.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Calendar className="h-5 w-5" />
                    )}
                    <span className="sr-only">Schedule for publication</span>
                  </Button>
                )}
                
                {/* Conditional Habit Button - Only show for Plus tier users */}
                {hasHabitsRewards ? (
                  <Button
                    onClick={handleAddAsHabit}
                    disabled={isBookAdded || addBookAsHabit.isPending || kidProfiles.length === 0}
                    variant={isBookAdded ? "default" : "secondary"}
                    size="icon"
                    className="shrink-0"
                    title={isBookAdded ? "Already added to today's reading list" : "Add as reading habit"}
                  >
                    {isBookAdded ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Plus className={`h-5 w-5 ${addBookAsHabit.isPending ? 'animate-pulse' : ''}`} />
                    )}
                    <span className="sr-only">{isBookAdded ? 'Added to habits' : 'Add as habit'}</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/pricing', { state: { upgrade: 'habits_rewards' } })}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    title="Upgrade to Plus to add as habit"
                  >
                    <Lock className="h-4 w-4" />
                    <span className="sr-only">Upgrade for Habits</span>
                  </Button>
                )}
                
                {hasActiveSubscription ? (
                  <Button
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    variant="outline"
                    size="icon"
                    className={`shrink-0 ${isDownloading ? 'opacity-75 cursor-wait' : ''}`}
                    title={isDownloading ? "Generating PDF..." : "Download as PDF"}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5" />
                    )}
                    <span className="sr-only">
                      {isDownloading ? 'Generating PDF...' : 'Download as PDF'}
                    </span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/pricing', { state: { upgrade: 'pdf_download' } })}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    title="Upgrade to Plus to download PDFs"
                  >
                    <Lock className="h-4 w-4" />
                    <span className="sr-only">Upgrade for PDF Downloads</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pages.map((page, index) => (
              <Card
                key={page.id}
                className="group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] hover:border-primary/20"
                onClick={() => handlePageClick(index)}
              >
                <CardContent className="p-4">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <PublicPageImage
                      pageId={page.id}
                      bookId={dailyContent.book_id}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      showUploadButton={false}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </StandardPageLayout>
    </>
  );
}
