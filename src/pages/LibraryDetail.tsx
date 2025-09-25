import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Calendar, BookOpen, Download, Image as ImageIcon } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useLibraryBookById } from '@/hooks/useLibraryBookById';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { LibraryCard } from '@/components/page-prompts';
import { MetaHead } from '@/components/common/MetaHead';
import { generateBookPDF } from '@/services/pdfGenerator';
import { useToast } from '@/hooks/use-toast';
import { DailyPublished } from '@/types/dailyPublished';

export default function LibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: dailyPublished, isLoading: bookLoading } = useLibraryBookById(id);
  const { data: pages = [], isLoading: pagesLoading } = useDailyPublishedPages(dailyPublished?.book_id);
  const { data: seoMetadata } = useSeoMetadata(id);

  const handleBack = () => {
    navigate('/library');
  };

  const handleReadingView = () => {
    navigate(`/library/${id}`);
  };

  if (bookLoading || pagesLoading) {
    return (
      <PageLayout>
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (!dailyPublished) {
    return (
      <PageLayout>
        <Container>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Book not found</p>
            <Button onClick={handleBack} className="mt-4">
              Back to Library
            </Button>
          </div>
        </Container>
      </PageLayout>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'queued':
        return 'Queued';
      case 'expired':
        return 'Expired';
      default:
        return 'Draft';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default' as const;
      case 'queued':
        return 'secondary' as const;
      case 'expired':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  interface DownloadButtonProps {
    dailyPublished: DailyPublished;
  }

  function DownloadButton({ dailyPublished }: DownloadButtonProps) {
    const { toast } = useToast();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfProgress, setPdfProgress] = useState(0);

    const handleDownloadPDF = async () => {
      if (!dailyPublished.book_id) {
        toast({
          title: "Error",
          description: "Book information not available",
          variant: "destructive"
        });
        return;
      }

      setIsGeneratingPdf(true);
      setPdfProgress(0);

      try {
        await generateBookPDF(dailyPublished.book_id, dailyPublished.title || 'ABC Book', {
          onProgress: (progress) => {
            setPdfProgress(progress);
          },
          onError: (error) => {
            console.error('PDF generation error:', error);
            toast({
              title: "Error generating PDF",
              description: "An error occurred while generating the PDF",
              variant: "destructive"
            });
          }
        });

        toast({
          title: "PDF Downloaded",
          description: `${dailyPublished.title} has been downloaded successfully`,
        });
      } catch (error) {
        console.error('PDF generation failed:', error);
        toast({
          title: "Download Failed",
          description: "Failed to generate PDF. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsGeneratingPdf(false);
        setPdfProgress(0);
      }
    };

    return (
      <Button
        variant="outline"
        onClick={handleDownloadPDF}
        disabled={isGeneratingPdf}
        className="gap-2"
      >
        {isGeneratingPdf ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            {pdfProgress > 0 && (
              <span>{Math.round(pdfProgress)}%</span>
            )}
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            PDF
          </>
        )}
      </Button>
    );
  }

  return (
    <PageLayout>
      <MetaHead 
        metadata={{
          title: `${dailyPublished.title} - Detail View`,
          description: dailyPublished.description || `Detail view of ${dailyPublished.title}`,
          type: 'website'
        }}
      />
      
      <Container>
        <div className="space-y-6">

          {/* Book Info */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-6">
                {/* OG Thumbnail */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted">
                    {seoMetadata?.og_image_url ? (
                      <AspectRatio ratio={1} className="w-full h-full">
                        <img
                          src={seoMetadata.og_image_url}
                          alt={`${dailyPublished.title} thumbnail`}
                          className="w-full h-full object-cover"
                        />
                      </AspectRatio>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-2xl mb-2">{seoMetadata?.seo_title || dailyPublished.title}</CardTitle>
                      {dailyPublished.description && (
                        <p className="text-muted-foreground mb-4">{dailyPublished.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Published {new Date(dailyPublished.publish_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {pages.length} pages
                        </div>
                        <Badge variant={getStatusBadgeVariant(dailyPublished.status)}>
                          {getStatusLabel(dailyPublished.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        onClick={handleReadingView}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Reading View
                      </Button>
                      <DownloadButton dailyPublished={dailyPublished} />
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Content moved to CardHeader */}
            </CardContent>
          </Card>

          {/* Pages Grid */}
          {pages.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Book Pages</h2>
                <span className="text-sm text-muted-foreground">
                  {pages.length} pages
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map((page) => (
                  <LibraryCard
                    key={page.id}
                    page={page}
                    bookId={dailyPublished.book_id}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32 space-y-4">
                <BookOpen className="w-12 h-12 text-muted-foreground" />
                <p className="text-muted-foreground">No pages available yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>
    </PageLayout>
  );
}