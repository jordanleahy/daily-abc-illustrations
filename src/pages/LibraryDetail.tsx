import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { StandardPageLayout } from '@/components/layout';
import { useLibraryBookById } from '@/hooks/useLibraryBookById';
import { useDailyPublishedPages } from '@/hooks/useDailyPublishedPages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, Calendar, Users, Plus, X, Check } from 'lucide-react';
import { MetaHead } from '@/components/common/MetaHead';
import { LibraryCard } from '@/components/page-prompts/LibraryCard';
import { trackBookViewForCache, trackBookView } from '@/utils/bookViewTracking';
import { useLibraryDetailImagePreloader } from '@/hooks/useLibraryDetailImagePreloader';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeoMetadata, useSeoMetadataByBook } from '@/hooks/useSeoMetadata';
import { useWordAssessment } from '@/hooks/useWordAssessment';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { usePageImageUrls } from '@/hooks/usePageImageUrls';
import { extractWords } from '@/utils/wordExtractor';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ExtractedWord } from '@/types/wordAssessment';

export default function LibraryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Word learning mode state
  const [wordLearningMode, setWordLearningMode] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordSize, setWordSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [words, setWords] = useState<ExtractedWord[]>([]);
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  
  const { data: book, isLoading: bookLoading, error: bookError } = useLibraryBookById(id);
  const { data: pages = [], isLoading: pagesLoading } = useDailyPublishedPages(id);
  const { data: seoMetadata } = useSeoMetadata(id);
  const { data: bookSeoMetadata } = useSeoMetadataByBook(book?.book_id || undefined);
  const { data: kidProfiles } = useKidProfiles();
  const { currentImage } = usePageImageUrls(pages[currentPageIndex]?.id);
  const assessWord = useWordAssessment();
  
  // Progressive image preloading - priority images load first
  const { priorityCount, totalCount } = useLibraryDetailImagePreloader(book?.book_id);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Track book view for cache management and database
  useEffect(() => {
    if (id) {
      trackBookViewForCache(id);
      trackBookView(id); // Update database for Recently Viewed
    }
  }, [id]);

  // Extract words from text overlay when page changes
  useEffect(() => {
    if (currentImage?.text_overlay_config?.text) {
      const extracted = extractWords(currentImage.text_overlay_config.text);
      setWords(extracted);
      setCurrentWordIndex(0);
    } else {
      setWords([]);
    }
  }, [currentImage?.text_overlay_config, currentPageIndex]);

  const handleBack = () => {
    navigate('/library');
  };

  const handlePlusClick = () => {
    setWordSize(prev => {
      if (prev === 'small') return 'medium';
      if (prev === 'medium') return 'large';
      return 'small';
    });
  };

  const handleKnowsWord = async (knowsWord: boolean) => {
    if (!selectedKidId || words.length === 0 || !pages[currentPageIndex]) return;
    
    const currentWord = words[currentWordIndex];
    
    try {
      await assessWord.mutateAsync({
        kidProfileId: selectedKidId,
        bookId: book?.book_id || book?.id || '',
        pageId: pages[currentPageIndex].id,
        word: currentWord.word,
        wordIndex: currentWord.index,
        knowsWord
      });
      
      // Auto-advance to next word
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        // Completed all words
        toast.success('All words completed!');
        setWordLearningMode(false);
        setCurrentWordIndex(0);
      }
    } catch (error) {
      console.error('Failed to save word assessment:', error);
    }
  };

  const handleStartWordLearning = () => {
    if (!kidProfiles || kidProfiles.length === 0) {
      toast.error('Please create a kid profile first');
      return;
    }
    
    if (words.length === 0) {
      toast.error('No words available on this page');
      return;
    }
    
    // Auto-select first kid
    setSelectedKidId(kidProfiles[0].id);
    setWordLearningMode(true);
  };

  const handleExitWordLearning = () => {
    setWordLearningMode(false);
    setCurrentWordIndex(0);
    setWordSize('medium');
  };

  // Only show full loading skeleton on first load with no data
  const isInitialLoading = (bookLoading || pagesLoading) && !book && pages.length === 0;

  const pageTitle = seoMetadata?.seo_title || bookSeoMetadata?.seo_title || book?.title || 'ABC Cards Library';
  const pageDescription =
    seoMetadata?.seo_description ||
    bookSeoMetadata?.seo_description ||
    book?.description ||
    (book?.title ? `Explore the ABC book "${book.title}" in our educational library.` : undefined);
  const ogImageUrl = seoMetadata?.og_image_url || bookSeoMetadata?.og_image_url;


  if (!user) {
    return (
      <StandardPageLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Please sign in to view library content.</p>
        </div>
      </StandardPageLayout>
    );
  }

  if (isInitialLoading) {
    return (
      <StandardPageLayout>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </StandardPageLayout>
    );
  }

  if (bookError || !book) {
    return (
      <StandardPageLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Book Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The book you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <>
      <MetaHead metadata={{
        title: pageTitle,
        description: pageDescription,
        type: "article",
        image: ogImageUrl ? { url: ogImageUrl } : undefined
      }} />
      
      <StandardPageLayout>
        <div className="space-y-6">
          {/* Navigation Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Library
            </Button>
          </div>

          {/* Book Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-2xl md:text-3xl">
                    {pageTitle}
                  </CardTitle>
                  {pageDescription && (
                    <p className="text-muted-foreground text-lg">
                      {pageDescription}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="w-fit">
                  {book.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Published {new Date(book.publish_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  General
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {pages.length} pages
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls / Word Learning Mode */}
          {pages.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                {wordLearningMode && words.length > 0 ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex-1 flex items-center justify-center min-h-[200px]">
                      <h1 className={cn(
                        "font-bold text-center transition-all duration-300 select-none",
                        wordSize === 'small' && "text-4xl",
                        wordSize === 'medium' && "text-6xl md:text-7xl",
                        wordSize === 'large' && "text-7xl md:text-8xl lg:text-9xl"
                      )}>
                        {words[currentWordIndex]?.word}
                      </h1>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="lg" 
                          variant="outline"
                          onClick={handlePlusClick}
                          className="w-14 h-14"
                          title="Change word size"
                        >
                          <Plus className="w-6 h-6" />
                        </Button>
                        <Button 
                          size="lg" 
                          className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white"
                          onClick={() => handleKnowsWord(false)}
                          disabled={assessWord.isPending}
                          title="Don't know this word"
                        >
                          <X className="w-6 h-6" />
                        </Button>
                        <Button 
                          size="lg" 
                          className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => handleKnowsWord(true)}
                          disabled={assessWord.isPending}
                          title="Know this word"
                        >
                          <Check className="w-6 h-6" />
                        </Button>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={handleExitWordLearning}
                      >
                        Exit Practice
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                        disabled={currentPageIndex === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground px-3">
                        Page {currentPageIndex + 1} of {pages.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                        disabled={currentPageIndex === pages.length - 1}
                      >
                        Next
                      </Button>
                    </div>
                    {words.length > 0 && (
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={handleStartWordLearning}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Practice Words
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Current Page Display */}
          {pages.length > 0 && pages[currentPageIndex] && (
            <LibraryCard
              page={pages[currentPageIndex]}
              bookId={book.book_id || book.id}
            />
          )}

          {/* All Pages Grid - Progressive Loading */}
          {pages.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>All Pages</CardTitle>
                {pagesLoading && (
                  <p className="text-sm text-muted-foreground">
                    Loading pages...
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pages.map((page, index) => (
                    <div
                      key={page.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        currentPageIndex === index 
                          ? 'ring-2 ring-primary shadow-lg' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setCurrentPageIndex(index)}
                    >
                      <LibraryCard
                        page={page}
                        bookId={book.book_id || book.id}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {pages.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pages Available</h3>
                <p className="text-muted-foreground">
                  This book doesn't have any pages to display yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </StandardPageLayout>
    </>
  );
}