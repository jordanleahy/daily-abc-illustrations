import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { InlineEditInput } from '@/components/ui/inline-edit-input';
import { useWordMetadata } from '@/hooks/useWordMetadata';
import { useBookPages } from '@/hooks/useBookPages';
import { toast } from 'sonner';
import { Pencil, X } from 'lucide-react';
import { WordCarousel } from './WordCarousel';
import type { PageType } from '@/types/book';

interface ReadingPageDisplayProps {
  pageId: string;
  bookId: string;
  pageNumber: number;
  pageText: string;
  imageUrl: string;
  onUpdatePageText?: (newText: string) => void;
  imageComponent?: React.ReactNode;
  className?: string;
  mode?: 'read' | 'edit'; // 'read' shows word carousel, 'edit' shows simple text
  pageType?: PageType;
  // Word learning state passed from parent
  currentWordIndex?: number;
  hiddenOverlayPages?: Set<string>;
  onToggleOverlayVisibility?: (pageId: string) => void;
  wordStatuses?: Record<number, 'difficult' | 'understood'>;
  isPreferencesLoading?: boolean;
  showDismissButton?: boolean;
  hideBottomOverlay?: boolean; // Phase 3: Disable old overlay
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
  mode = 'read',
  pageType,
  currentWordIndex = 0,
  hiddenOverlayPages,
  onToggleOverlayVisibility,
  wordStatuses,
  isPreferencesLoading = false,
  showDismissButton = true,
  hideBottomOverlay = false,
}: ReadingPageDisplayProps) {
  const { generateMetadata } = useWordMetadata();
  const { pages } = useBookPages(bookId);
  const [isEditingText, setIsEditingText] = useState(false);

  // Get current page words metadata
  const currentPageWords = useMemo(() => {
    const currentPage = pages?.find(p => p.id === pageId);
    return currentPage?.content?.words;
  }, [pages, pageId]);

  // Auto-generate word metadata if page has text but no words (only in read mode)
  useEffect(() => {
    if (mode === 'edit') return; // Skip word generation in edit mode
    
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
  }, [pageId, pageText, currentPageWords, pages, bookId, generateMetadata, mode]);

  const handleSaveText = async (newText: string) => {
    if (onUpdatePageText) {
      onUpdatePageText(newText);
    }
    setIsEditingText(false);
    
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
        {!hideBottomOverlay && pageText && !isPreferencesLoading && !isOverlayHidden && (
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
            ) : mode === 'read' && currentPageWords && currentPageWords.length > 0 && pageType !== 'cover' && pageType !== 'educational' ? (
              <div 
                className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm group h-[40px] flex items-center"
              >
                <div className="relative h-full w-full flex items-center">
                  <WordCarousel
                    words={currentPageWords}
                    currentWordIndex={currentWordIndex}
                    wordStatuses={wordStatuses}
                  />
                  {onUpdatePageText && (
                    <button
                      onClick={() => setIsEditingText(true)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      title="Edit text"
                    >
                      <Pencil className="h-4 w-4 text-white/60 group-hover:text-white/90 transition-colors" />
                    </button>
                  )}
                  {onToggleOverlayVisibility && showDismissButton && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleOverlayVisibility(pageId);
                      }}
                      className="absolute top-2 left-2 h-6 w-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      title="Hide text overlay"
                    >
                      <X className="h-3.5 w-3.5 text-white/70" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div 
                className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-sm px-4 group overflow-hidden h-[40px]"
              >
                <div className="flex items-center justify-center gap-2 h-full relative">
                  <div 
                    onClick={() => onUpdatePageText && setIsEditingText(true)}
                    className={`flex items-center justify-center gap-2 flex-1 ${onUpdatePageText ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
                    title={onUpdatePageText ? "Click to edit text" : undefined}
                  >
                    <p className={`text-white text-center ${mode === 'edit' ? 'font-normal text-sm' : 'font-semibold text-lg'}`}>
                      {pageText}
                    </p>
                    {onUpdatePageText && (
                      <Pencil className="h-4 w-4 text-white/60 group-hover:text-white/90 transition-colors flex-shrink-0" />
                    )}
                  </div>
                  {onToggleOverlayVisibility && showDismissButton && (
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
