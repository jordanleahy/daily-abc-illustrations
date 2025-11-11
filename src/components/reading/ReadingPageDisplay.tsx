import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { InlineEditInput } from '@/components/ui/inline-edit-input';
import { useWordMetadata } from '@/hooks/useWordMetadata';
import { useBookPages } from '@/hooks/useBookPages';
import { toast } from 'sonner';
import { Pencil, X } from 'lucide-react';

interface ReadingPageDisplayProps {
  pageId: string;
  bookId: string;
  pageNumber: number;
  pageText: string;
  imageUrl: string;
  onUpdatePageText?: (newText: string) => void;
  imageComponent?: React.ReactNode;
  className?: string;
  // Word learning state passed from parent
  currentWordIndex?: number;
  isWordEnlarged?: boolean;
  hiddenOverlayPages?: Set<string>;
  onToggleOverlayVisibility?: (pageId: string) => void;
  wordStatuses?: Record<number, 'difficult' | 'understood'>;
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
  currentWordIndex = 0,
  isWordEnlarged = false,
  hiddenOverlayPages,
  onToggleOverlayVisibility,
  wordStatuses,
}: ReadingPageDisplayProps) {
  const { generateMetadata } = useWordMetadata();
  const { pages } = useBookPages(bookId);
  const [isEditingText, setIsEditingText] = useState(false);

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


  // Helper function to render text with enlarged current word
  const renderTextWithEnlargedWord = (
    fullText: string, 
    currentWord: string | undefined,
    isEnlarged: boolean,
    wordsArray: Array<{ word: string }> | undefined,
    statuses: Record<number, 'difficult' | 'understood'> | undefined
  ) => {
    if (!isEnlarged || !currentWord) {
      return <span className="text-lg font-semibold">{fullText}</span>;
    }

    // Split text into words, preserving spaces
    const words = fullText.split(/(\s+)/);
    const lowerCurrentWord = currentWord.toLowerCase();

    return (
      <>
        {words.map((word, index) => {
          // Skip empty strings and spaces
          if (!word.trim()) {
            return <span key={index}> </span>;
          }

          // Check if this word matches the current highlighted word
          const isHighlighted = word.toLowerCase() === lowerCurrentWord;
          
          // Find word index in wordsArray to check status
          const wordIndex = wordsArray?.findIndex(
            w => w.word.toLowerCase() === word.toLowerCase()
          );
          const wordStatus = wordIndex !== undefined && wordIndex >= 0 
            ? statuses?.[wordIndex] 
            : undefined;
          const isUnderstood = wordStatus === 'understood';
          const isDifficult = wordStatus === 'difficult';

          if (isHighlighted) {
            return (
              <span
                key={index}
                className={`text-lg font-semibold text-yellow-300 inline-block px-2 py-1 rounded ${
                  isUnderstood ? 'bg-emerald-500/50' : 
                  isDifficult ? 'bg-red-500/50' : ''
                }`}
                style={{ 
                  transform: 'scale(2)',
                  transformOrigin: 'center center',
                  margin: '0 1rem',
                  fontWeight: '800',
                  transition: 'all 0.6s ease-in-out'
                }}
              >
                {word}
              </span>
            );
          }

          return (
            <span
              key={index}
              className={`text-lg font-semibold inline-block px-1.5 py-0.5 rounded ${
                isUnderstood ? 'bg-emerald-500/40' : 
                isDifficult ? 'bg-red-500/40' : ''
              }`}
              style={{ 
                margin: '0 0.5rem',
                transition: 'all 0.6s ease-in-out'
              }}
            >
              {word}
            </span>
          );
        })}
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

  const isOverlayHidden = hiddenOverlayPages?.has(pageId);

  return (
    <Card className={`overflow-hidden ${className}`}>
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
                className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm px-4 py-3 group overflow-hidden"
                style={{ minHeight: '60px' }}
              >
                <div className="flex items-center justify-center gap-2 h-full relative">
                  <div 
                    onClick={() => onUpdatePageText && setIsEditingText(true)}
                    className={`flex items-center justify-center gap-2 flex-1 ${onUpdatePageText ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
                    title={onUpdatePageText ? "Click to edit text" : undefined}
                  >
                    <p className="text-white text-center flex flex-wrap items-center justify-center gap-1 overflow-hidden"
                       style={{ lineHeight: '1.2' }}>
                      {renderTextWithEnlargedWord(
                        pageText, 
                        currentPageWords?.[currentWordIndex]?.word,
                        isWordEnlarged,
                        currentPageWords,
                        wordStatuses
                      )}
                    </p>
                    {onUpdatePageText && (
                      <Pencil className="h-4 w-4 text-white/60 group-hover:text-white/90 transition-colors flex-shrink-0" />
                    )}
                  </div>
                  {onToggleOverlayVisibility && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleOverlayVisibility(pageId);
                      }}
                      className="h-6 w-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                      title="Hide text overlay"
                    >
                      <X className="h-3.5 w-3.5 text-white/70" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
