import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibraryBooks } from '@/hooks/useLibraryBooks';
import { useSeoMetadata } from '@/hooks/useSeoMetadata';
import { MetaHead } from '@/components/common/MetaHead';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Users, GraduationCap, Download } from 'lucide-react';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsTeacher } from '@/contexts/RoleContext';
import { generateBookPDF } from '@/services/pdfGenerator';
import { useToast } from '@/hooks/use-toast';

export default function Library() {
  const {
    data: libraryItems,
    isLoading,
    error
  } = useLibraryBooks();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          title="Library"
          showQRCode={false}
        />
        <div className="pt-16 text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          title="Library"
          showQRCode={false}
        />
        <div className="pt-16 text-center py-8">
          <p className="text-destructive">Error loading library: {error.message}</p>
        </div>
      </div>
    );
  }

  // Sort all books by publish_date (newest first)
  const allBooks = libraryItems?.sort((a, b) => 
    new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime()
  ) || [];

  return <>
    <MetaHead metadata={{
      title: "Library - Daily ABC Illustrations",
      description: "Explore all queued, active, and past ABC illustration books.",
      type: "website"
    }} />
    
    <div className="min-h-screen bg-background">
      <Header 
        title="Library"
        showQRCode={false}
      />
      <div className="pt-16 container mx-auto px-4 pb-8">
        <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ABC Books Library</h1>
            <p className="text-muted-foreground">
              Explore all published daily ABC illustration books
            </p>
          </div>
        </div>

        {/* Optional Teacher Indicator */}
        {useIsTeacher() && (
          <Alert>
            <GraduationCap className="h-4 w-4" />
            <AlertDescription>
              You're a teacher. You can view all published books. This library is public for everyone.
            </AlertDescription>
          </Alert>
        )}

        {allBooks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No books in library</h3>
              <p className="text-muted-foreground">
                Check back soon for new daily illustrations!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allBooks.map((item) => (
              <LibraryBookCard key={item.id} item={item} />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  </>;
}

interface LibraryBookCardProps {
  item: DailyPublishedWithBook;
}

function LibraryBookCard({ item }: LibraryBookCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  
  const {
    data: seoMetadata
  } = useSeoMetadata(item.id);

  const isTeacher = useIsTeacher();
  
  const handleCardClick = () => {
    if (isTeacher) {
      navigate(`/library/${item.id}/detail`);
    } else {
      navigate(`/library/${item.id}`);
    }
  };

  const handleDownloadPDF = async (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card navigation
    
    if (!item.book_id) {
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
      await generateBookPDF(item.book_id, item.book.book_name || 'ABC Book', {
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
        description: `${item.book.book_name} has been downloaded successfully`,
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'queued':
        return 'secondary';
      case 'expired':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'queued':
        return 'Queued';
      case 'expired':
        return 'Past';
      default:
        return 'Draft';
    }
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer hover:shadow-lg" 
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl line-clamp-2">
            {seoMetadata?.seo_title || item.title}
          </CardTitle>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant={getStatusBadgeVariant(item.status)}>
              {getStatusLabel(item.status)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="gap-1 h-8"
            >
              {isGeneratingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  {pdfProgress > 0 && (
                    <span className="text-xs">{Math.round(pdfProgress)}%</span>
                  )}
                </>
              ) : (
                <>
                  <Download className="h-3 w-3" />
                  <span className="text-xs">PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.description && (
          <CardDescription className="line-clamp-3">
            {item.description}
          </CardDescription>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            26 pages
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(item.publish_date).toLocaleDateString()}
          </div>
        </div>
        
        <div className="aspect-[1200/630] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {seoMetadata?.og_image_url ? (
            <img 
              src={seoMetadata.og_image_url} 
              alt={`Preview of ${item.title}`}
              className="w-full h-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}