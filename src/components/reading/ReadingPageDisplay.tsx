import { useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { InlineEditInput } from '@/components/ui/inline-edit-input';
import { WordLearningControls } from '@/components/chat/WordLearningControls';
import { useWordMetadata } from '@/hooks/useWordMetadata';
import { useBookPages } from '@/hooks/useBookPages';
import { toast } from 'sonner';
import { Pencil, X } from 'lucide-react';
import { useReadingPageState } from './useReadingPageState';

interface ReadingPageDisplayProps {
  pageId: string;
  bookId: string;
  pageNumber: number;
  pageText: string;
  imageUrl: string;
  onUpdatePageText?: (newText: string) => void;
  imageComponent?: React.ReactNode;
  className?: string;
}

export function ReadingPageDisplay({
  pageId,
  bookId,
  pageNumber,
  pageText,
  imageUrl,
  onUpdatePageText,
  imageComponent,
  className = '',
}: ReadingPageDisplayProps) {
  const { generateMetadata, isGenerating } = useWordMetadata();
  const { pages } = useBookPages(bookId);
  
  const {
    currentWordIndex,
    isWordEnlarged,
    wordStatuses,
    isEditingText,
    hiddenOverlayPages,
    setIsEditingText,
    handleToggleEnlarge,
    handleNavigateWord,
    handleMarkDifficult,
    handleMarkUnderstood,
    resetState,
    toggleOverlayVisibility,
  } = useReadingPageState();

  // Get current page words metadata
  const currentPageWords = useMemo(() => {
    const currentPage = pages?.find(p => p.id === pageId);
    return currentPage?.content?.words;
  }, [pages, pageId]);

  // Auto-generate word metadata if page has text but no words
  useEffect(() => {
    const currentPage = pages?.find(p => p.id === pageId);
    if (currentPage && pageText && !currentPageWords && bookId) {
      generateMetadata({
        pageId: currentPage.id,
        bookId,
        title: pageText,
        currentContent: currentPage.content
      }).catch(error => {
        console.error('Failed to auto-generate word metadata:', error);
      });
    }
  }, [pageId, pageText, currentPageWords, pages, bookId, generateMetadata]);

  // Reset word learning state when page changes
  useEffect(() => {
    resetState();
  }, [pageId, resetState]);

  // Helper function to render text with enlarged current word
  const renderTextWithEnlargedWord = (
    fullText: string, 
    currentWord: string | undefined,
    isEnlarged: boolean
  ) => {
    if (!isEnlarged || !currentWord) {
      return <span className="text-lg font-semibold">{fullText}</span>;
    }

    const lowerText = fullText.toLowerCase();
    const lowerWord = currentWord.toLowerCase();
    const wordIndex = lowerText.indexOf(lowerWord);

    if (wordIndex === -1) {
      return <span className="text-lg font-semibold">{fullText}</span>;
    }

    const before = fullText.slice(0, wordIndex);
    const word = fullText.slice(wordIndex, wordIndex + currentWord.length);
    const after = fullText.slice(wordIndex + currentWord.length);

    return (
      <>
        <span className="text-lg font-semibold">{before}</span>
        <span 
          className="text-lg font-semibold text-yellow-300 inline-block animate-pulse"
          style={{ 
            transform: 'scale(2.5)',
            transformOrigin: 'center center',
            display: 'inline-block',
            margin: '0 1.5rem',
            fontWeight: '800',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {word}
        </span>
        <span className="text-lg font-semibold">{after}</span>
      </>
    );
  };

  const handleSaveText = async (newText: string) => {
    if (onUpdatePageText) {
      onUpdatePageText(newText);
    }
    setIsEditingText(false);
    toast.success('Text updated!');
    
    // Generate word metadata
    const currentPage = pages?.find(p => p.id === pageId);
    if (currentPage && bookId && newText.trim()) {
      try {
        await generateMetadata({
          pageId: currentPage.id,
          bookId,
          title: newText,
          currentContent: currentPage.content
        });
      } catch (error) {
        console.error('Failed to generate word metadata:', error);
      }
    }
  };

  const isOverlayHidden = hiddenOverlayPages.has(pageId);
  const hasWords = currentPageWords && currentPageWords.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Image with Text Overlay */}
      <Card className="overflow-hidden">
        <div className="relative aspect-square">
          {imageComponent || (
            <img 
              src={imageUrl}
              alt={`Page ${pageNumber}`}
              className="w-full h-full object-contain"
            />
          )}
          
          {/* Text Overlay with Editing and Word Learning */}
          {pageText && !isOverlayHidden && (
            <>
              {isEditingText && onUpdatePageText ? (
                <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm px-4 py-3">
                  <InlineEditInput
                    value={pageText}
                    onSave={handleSaveText}
                    className="text-white text-center font-semibold text-lg bg-transparent border-white/30"
                    isEditing={true}
                  />
                </div>
              ) : (
                <div 
                  className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm px-4 py-3 group"
                  style={{ minHeight: '60px' }}
                >
                  <div className="flex items-center justify-center gap-2 h-full relative">
                    <div 
                      onClick={() => onUpdatePageText && setIsEditingText(true)}
                      className={`flex items-center justify-center gap-2 flex-1 ${onUpdatePageText ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
                      title={onUpdatePageText ? "Click to edit text" : undefined}
                    >
                      <p className="text-white text-center flex flex-wrap items-center justify-center gap-1"
                         style={{ lineHeight: '1.2' }}>
                        {renderTextWithEnlargedWord(
                          pageText, 
                          currentPageWords?.[currentWordIndex]?.word,
                          isWordEnlarged
                        )}
                      </p>
                      {onUpdatePageText && (
                        <Pencil className="h-4 w-4 text-white/60 group-hover:text-white/90 transition-colors flex-shrink-0" />
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOverlayVisibility(pageId);
                        toast.success('Text overlay hidden');
                      }}
                      className="h-6 w-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                      title="Hide text overlay"
                    >
                      <X className="h-3.5 w-3.5 text-white/70" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Word Learning Controls */}
      {hasWords && (
        <WordLearningControls
          isEnlarged={isWordEnlarged}
          onToggleEnlarge={handleToggleEnlarge}
          onMarkDifficult={() => handleMarkDifficult(currentPageWords.length)}
          onMarkUnderstood={() => handleMarkUnderstood(currentPageWords.length)}
          currentWordIndex={currentWordIndex}
          totalWords={currentPageWords.length}
          onNavigateWord={(direction) => handleNavigateWord(direction, currentPageWords.length)}
        />
      )}
    </div>
  );
}
