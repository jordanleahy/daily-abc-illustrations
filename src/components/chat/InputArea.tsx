import { memo } from 'react';
import { Send, Image as ImageIcon, BookOpen, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ImageUpload';
import { cn } from '@/lib/utils';

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
          className="text-sm text-muted-foreground cursor-pointer"
        >
          Generate cover image when creating book (uses additional AI credits)
        </Label>
      </div>
    </div>
  );
});

InputArea.displayName = 'InputArea';
