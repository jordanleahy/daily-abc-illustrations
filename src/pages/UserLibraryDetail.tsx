import { useParams, useNavigate } from 'react-router-dom';
import { useLibraryBookById } from '@/hooks/useLibraryBookById';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { useDailyPublishedImagePreloader } from '@/hooks/useDailyPublishedImagePreloader';
import { useDailyPublishedOpenGraph } from '@/hooks/useDailyPublishedOpenGraph';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useAddBookAsHabit } from '@/hooks/useAddBookAsHabit';
import { MetaHead } from '@/components/common';
import { StandardPageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PublicPageImage } from '@/components/daily-published';
import { Calendar, BookOpen, Download, Plus } from 'lucide-react';
import { isValidUUID } from '@/utils/uuid';
import { generateBookPDF } from '@/services/pdfGenerator';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function UserLibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const safeId = id && isValidUUID(id) ? id : undefined;
  
  const { data: dailyContent, isLoading: isLoadingDaily, error: dailyError } = useLibraryBookById(safeId);
  const { data: pages = [], isLoading: isLoadingPages } = useDailyPublishedPages(dailyContent?.book_id);
  const { openGraphMetadata } = useDailyPublishedOpenGraph(safeId, 0);
  const { data: kidProfiles = [] } = useKidProfiles();
  const addBookAsHabit = useAddBookAsHabit();
  
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Preload all page images for instant display
  useDailyPublishedImagePreloader(pages, dailyContent?.book_id);
  
  const isLoading = isLoadingDaily || isLoadingPages;

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

  return (
    <>
      {openGraphMetadata && <MetaHead metadata={openGraphMetadata} />}
      
      <StandardPageLayout>
        {/* Header Section */}
        <div className="space-y-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight mb-2">{dailyContent.title}</h1>
                {dailyContent.description && (
                  <p className="text-muted-foreground">{dailyContent.description}</p>
                )}
              </div>
              <div className="flex gap-2">
              <Button
                onClick={handleAddAsHabit}
                disabled={addBookAsHabit.isPending || kidProfiles.length === 0}
                variant="secondary"
                size="icon"
                className="shrink-0"
                title="Add as reading habit"
              >
                  <Plus className={`h-5 w-5 ${addBookAsHabit.isPending ? 'animate-pulse' : ''}`} />
                  <span className="sr-only">Add as habit</span>
                </Button>
                
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  <Download className={`h-5 w-5 ${isDownloading ? 'animate-pulse' : ''}`} />
                  <span className="sr-only">Download as PDF</span>
                </Button>
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
