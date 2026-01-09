import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePublicBookPrintableImages } from '@/hooks/usePublicBookPrintableImages';
import { MetaHead } from '@/components/common';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Progress } from '@/components/ui/progress';
import { Printer, Download, Loader2, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { generatePDF, PageImageData } from '@/services/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';

export default function PrintableColorBook() {
  const { bookId } = useParams<{ bookId: string }>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bookName, setBookName] = useState<string | null>(null);
  const [bookLoading, setBookLoading] = useState(true);
  
  const { data: printableImages, isLoading: imagesLoading } = usePublicBookPrintableImages(bookId);
  
  // Fetch book name on mount
  useEffect(() => {
    if (bookId) {
      supabase
        .from('books')
        .select('book_name')
        .eq('id', bookId)
        .maybeSingle()
        .then(({ data }) => {
          setBookName(data?.book_name || 'Printable Coloring Book');
          setBookLoading(false);
        });
    }
  }, [bookId]);

  const handleDownloadPDF = async () => {
    if (!printableImages || printableImages.length === 0) return;
    
    setIsGenerating(true);
    setProgress(0);
    
    try {
      // Map to the PageImageData format expected by generatePDF
      const pages: PageImageData[] = printableImages.map(img => ({
        id: img.page_id,
        page_number: img.page_number,
        letter: img.letter,
        title: `Letter ${img.letter}`,
        image_url: img.printable_coloring_image_url
      }));
      
      const pdfBytes = await generatePDF(pages, {
        onProgress: (current, total) => {
          setProgress(Math.round((current / total) * 100));
        }
      });
      
      // Create download - convert to ArrayBuffer for Blob compatibility
      const arrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bookName || 'PrintableColorBook'}-Coloring-Pages.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const isLoading = imagesLoading || bookLoading;

  if (isLoading) {
    return (
      <StandardPageLayout>
        <div className="py-12 space-y-8">
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-2/3 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  if (!printableImages || printableImages.length === 0) {
    return (
      <StandardPageLayout>
        <div className="py-12 text-center">
          <Printer className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">No Printable Pages Available</h1>
          <p className="text-muted-foreground mb-8">
            This book doesn't have printable coloring pages yet.
          </p>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </StandardPageLayout>
    );
  }

  const previewImages = printableImages.slice(0, 6);

  return (
    <>
      <MetaHead 
        metadata={{
          title: `Printable Coloring Book - ${bookName || 'ABC Book'}`,
          description: `Download ${printableImages.length} printable coloring pages from ${bookName || 'this ABC book'}. Black & white with color thumbnail reference!`,
          keywords: ['printable coloring pages', 'coloring book', 'kids activities', 'ABC book'],
        }} 
      />
      
      <StandardPageLayout>
        <div className="py-8 md:py-12 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Printer className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">Printable Coloring Book</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              {bookName && <span className="font-medium">{bookName}</span>}
              {' • '}{printableImages.length} printable pages
            </p>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Each page features a black & white illustration with a small color reference thumbnail in the corner.
            </p>
          </div>

          {/* Download Button */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Download PDF ({printableImages.length} Pages)
                </>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="max-w-md mx-auto space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Processing page {Math.ceil((progress / 100) * printableImages.length)} of {printableImages.length}
              </p>
            </div>
          )}

          {/* Preview Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Preview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previewImages.map((image) => (
                <Card key={image.page_id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <AspectRatio ratio={1} className="bg-white">
                      <OptimizedImage
                        src={image.printable_coloring_image_url}
                        alt={`Printable coloring page for letter ${image.letter}`}
                        className="w-full h-full object-cover"
                      />
                    </AspectRatio>
                    <div className="p-2 text-center">
                      <span className="text-sm font-medium">Letter {image.letter}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {printableImages.length > 6 && (
              <p className="text-center text-muted-foreground">
                +{printableImages.length - 6} more pages in the download
              </p>
            )}
          </div>

          {/* CTA Section */}
          <div className="mt-12 p-8 rounded-lg bg-muted text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-3">
              Want more ABC books?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Explore our library of AI-generated educational books with illustrations and activities.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg">
                <Link to="/auth?mode=signup">Get Started Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/">Explore Books</Link>
              </Button>
            </div>
          </div>
        </div>
      </StandardPageLayout>
    </>
  );
}
