import { memo, useState } from 'react';
import { Send, Image as ImageIcon, BookOpen, ChevronLeft, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ImageUpload';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';

interface InputAreaProps {
  input: string;
  isLoading: boolean;
  showImageUpload: boolean;
  createdBookId: string | null;
  isMobile: boolean;
  shouldShowOpenButton: boolean;
  generateCover: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onImageUploadToggle: (show: boolean) => void;
  onImageSelect: (file: File) => void;
  onViewBook: () => void;
  onOpenQAPanel: () => void;
  onGenerateCoverToggle: (value: boolean) => void;
}

export const InputArea = memo(({
  input,
  isLoading,
  showImageUpload,
  createdBookId,
  isMobile,
  shouldShowOpenButton,
  generateCover,
  onInputChange,
  onSend,
  onKeyPress,
  onImageUploadToggle,
  onImageSelect,
  onViewBook,
  onOpenQAPanel,
  onGenerateCoverToggle
}: InputAreaProps) => {
  const { user } = useAuthContext();
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const handleGenerateCoverPrompt = async () => {
    if (!createdBookId || !user?.id) {
      toast.error('No book available to generate cover prompt');
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-book-thumbnail-prompt', {
        body: {
          bookId: createdBookId,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data?.enhancedPrompt) {
        await navigator.clipboard.writeText(data.enhancedPrompt);
        toast.success('Cover image prompt copied to clipboard!');
      } else {
        toast.error('Failed to generate prompt');
      }
    } catch (error) {
      console.error('Error generating cover prompt:', error);
      toast.error('Failed to generate cover prompt');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto flex max-w-4xl gap-2">
        {shouldShowOpenButton && (
          <Button
            onClick={onOpenQAPanel}
            variant="outline"
            className="shrink-0"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Open</span>
          </Button>
        )}
        <Input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Message Gemini..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => onImageUploadToggle(!showImageUpload)}
          disabled={isLoading}
          className={cn(showImageUpload && "bg-primary text-primary-foreground")}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        {!isMobile && createdBookId && (
          <Button
            variant="outline"
            size="icon"
            onClick={onViewBook}
            title="View Book"
          >
            <BookOpen className="h-4 w-4" />
          </Button>
        )}
        <Button
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      {showImageUpload && (
        <div className="mx-auto mt-4 max-w-4xl">
          <ImageUpload
            onImageSelect={onImageSelect}
          />
        </div>
      )}
      
      <div className="mx-auto mt-3 max-w-4xl flex items-center gap-2">
        <Checkbox 
          id="generate-cover"
          checked={generateCover}
          onCheckedChange={onGenerateCoverToggle}
        />
        <Label 
          htmlFor="generate-cover"
          className="text-sm text-muted-foreground cursor-pointer flex-1"
        >
          Generate cover image when creating book (uses additional AI credits)
        </Label>
        {createdBookId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateCoverPrompt}
            disabled={isGeneratingPrompt}
          >
            <Copy className="h-4 w-4 mr-1" />
            {isGeneratingPrompt ? 'Generating...' : 'Copy Prompt'}
          </Button>
        )}
      </div>
    </div>
  );
});

InputArea.displayName = 'InputArea';
