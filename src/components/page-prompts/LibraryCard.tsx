import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { FileText, Copy, Download, Plus, X, Check, BookOpen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { usePageSystemPrompt } from '@/hooks/usePageSystemPrompt';
import { PageImageSection } from '@/components/PageImageSection';
import { useToast } from '@/hooks/use-toast';
import { usePageImageUrls } from '@/hooks/usePageImageUrls';
import { useWordAssessment } from '@/hooks/useWordAssessment';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { extractWords } from '@/utils/wordExtractor';
import { cn } from '@/lib/utils';
import { toast as sonnerToast } from 'sonner';
import type { Page } from '@/types/book';
import type { ExtractedWord } from '@/types/wordAssessment';

interface LibraryCardProps {
  page: Page;
  bookId: string;
}

export function LibraryCard({ page, bookId }: LibraryCardProps) {
  const { currentPrompt } = usePageSystemPrompt(page.id);
  const { toast } = useToast();
  const { currentImage } = usePageImageUrls(page.id);
  const [showPrompt, setShowPrompt] = useState(false);
  
  // Word learning mode state
  const [wordLearningMode, setWordLearningMode] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordSize, setWordSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [words, setWords] = useState<ExtractedWord[]>([]);
  const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
  
  const assessWord = useWordAssessment();
  const { data: kidProfiles } = useKidProfiles();

  // Extract words from text overlay when image changes
  useEffect(() => {
    if (currentImage?.text_overlay_config?.text) {
      const extracted = extractWords(currentImage.text_overlay_config.text);
      setWords(extracted);
      setCurrentWordIndex(0);
    } else {
      setWords([]);
    }
  }, [currentImage?.text_overlay_config]);

  const handleCopyJsonPrompt = async () => {
    if (!currentPrompt?.content) {
      toast({
        title: "No JSON Prompt",
        description: "No JSON prompt available",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(currentPrompt.content);
      toast({
        title: "Copied!",
        description: "JSON prompt copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying JSON prompt to clipboard:', error);
      toast({
        title: "Error", 
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyFullPrompt = async () => {
    if (!currentImage?.prompt_used) {
      toast({
        title: "No Full Prompt",
        description: "No full prompt available",
        variant: "destructive",
      });
      return;
    }

    // Skip if it's just an upload message
    if (currentImage.prompt_used.startsWith('User uploaded:')) {
      toast({
        title: "No AI Prompt",
        description: "This image was uploaded, no AI prompt available",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(currentImage.prompt_used);
      toast({
        title: "Copied!",
        description: "Full prompt copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying full prompt to clipboard:', error);
      toast({
        title: "Error", 
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadImage = async () => {
    if (!currentImage?.image_url) {
      toast({
        title: "No Image",
        description: "No image available to download",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(currentImage.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${page.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Downloaded",
        description: "Image downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const handlePlusClick = () => {
    setWordSize(prev => {
      if (prev === 'small') return 'medium';
      if (prev === 'medium') return 'large';
      return 'small';
    });
  };

  const handleKnowsWord = async (knowsWord: boolean) => {
    if (!selectedKidId || words.length === 0 || !currentImage) return;
    
    const currentWord = words[currentWordIndex];
    
    try {
      await assessWord.mutateAsync({
        kidProfileId: selectedKidId,
        bookId: bookId,
        pageId: page.id,
        word: currentWord.word,
        wordIndex: currentWord.index,
        knowsWord
      });
      
      // Auto-advance to next word
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        // Completed all words
        sonnerToast.success('All words completed!');
        setWordLearningMode(false);
        setCurrentWordIndex(0);
      }
    } catch (error) {
      console.error('Failed to save word assessment:', error);
    }
  };

  const handleStartWordLearning = () => {
    if (!kidProfiles || kidProfiles.length === 0) {
      sonnerToast.error('Please create a kid profile first');
      return;
    }
    
    if (words.length === 0) {
      sonnerToast.error('No words available on this page');
      return;
    }
    
    // Auto-select first kid (can be enhanced with kid selector)
    setSelectedKidId(kidProfiles[0].id);
    setWordLearningMode(true);
  };

  const handleExitWordLearning = () => {
    setWordLearningMode(false);
    setCurrentWordIndex(0);
    setWordSize('medium');
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              {page.letter}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={handleDownloadImage}
              disabled={!currentImage?.image_url}
              title="Download page image as PNG"
              aria-label="Download page image as PNG"
            >
              <Download className="w-3 h-3" />
            </Button>
            {currentPrompt && (
              <Toggle
                size="sm"
                className="w-6 h-6"
                pressed={showPrompt}
                onPressedChange={setShowPrompt}
                title="Toggle between image and prompt view"
                aria-label="Toggle between image and prompt view"
              >
                <FileText className="w-3 h-3" />
              </Toggle>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentPrompt && (
              <Badge variant="secondary" className="text-xs">
                Version {currentPrompt.version_number}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page.page_number}
            </span>
          </div>
        </div>
        <CardTitle className="text-lg line-clamp-2">
          {page.title}
        </CardTitle>
        {page.description && (
          <CardDescription className="line-clamp-2">
            {page.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {wordLearningMode && words.length > 0 ? (
          <div className="w-full aspect-square bg-background rounded-lg flex flex-col items-center justify-center p-8 relative border">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleExitWordLearning}
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 flex items-center justify-center">
              <h1 className={cn(
                "font-bold text-center transition-all duration-300 select-none",
                wordSize === 'small' && "text-4xl",
                wordSize === 'medium' && "text-6xl md:text-7xl",
                wordSize === 'large' && "text-7xl md:text-8xl lg:text-9xl"
              )}>
                {words[currentWordIndex]?.word}
              </h1>
            </div>
            
            <div className="flex items-center gap-8 mt-8">
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
            </div>
          </div>
        ) : showPrompt && currentPrompt ? (
          <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between text-sm font-medium text-foreground p-3 pb-2 border-b border-border/50">
              <span>System Prompt:</span>
              <div className="flex gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6"
                      disabled={!currentPrompt?.content && !currentImage?.prompt_used}
                      title="Copy prompt options"
                      aria-label="Copy prompt options"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="text-xs">Copy Prompt</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleCopyJsonPrompt}
                      disabled={!currentPrompt?.content}
                      className="text-sm"
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Copy JSON
                      {currentPrompt?.content && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          Structured
                        </span>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleCopyFullPrompt}
                      disabled={
                        !currentImage?.prompt_used || 
                        currentImage?.prompt_used?.startsWith('User uploaded:')
                      }
                      className="text-sm"
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Copy Full Prompt
                      {currentImage?.prompt_used && !currentImage.prompt_used.startsWith('User uploaded:') && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          Enhanced
                        </span>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex-1 p-3 overflow-y-auto">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {currentPrompt.content}
              </div>
            </div>
          </div>
        ) : (
          <PageImageSection
            pageId={page.id}
            bookId={bookId}
            showUpload={false}
          />
        )}
        
        {!wordLearningMode && currentImage?.text_overlay_config?.text && (
          <Button 
            onClick={handleStartWordLearning}
            variant="secondary"
            size="sm"
            className="w-full"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Practice Words
          </Button>
        )}
      </CardContent>
    </Card>
  );
}