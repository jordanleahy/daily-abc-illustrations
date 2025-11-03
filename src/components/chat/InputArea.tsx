import { memo } from 'react';
import { Send, Image as ImageIcon, BookOpen, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ImageUpload';
import { cn } from '@/lib/utils';

interface InputAreaProps {
  input: string;
  isLoading: boolean;
  showImageUpload: boolean;
  createdBookId: string | null;
  isMobile: boolean;
  shouldShowOpenButton: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onImageUploadToggle: (show: boolean) => void;
  onImageSelect: (file: File) => void;
  onViewBook: () => void;
  onOpenQAPanel: () => void;
}

export const InputArea = memo(({
  input,
  isLoading,
  showImageUpload,
  createdBookId,
  isMobile,
  shouldShowOpenButton,
  onInputChange,
  onSend,
  onKeyPress,
  onImageUploadToggle,
  onImageSelect,
  onViewBook,
  onOpenQAPanel
}: InputAreaProps) => {

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if the pasted item is an image
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          onImageSelect(file);
          // Auto-show the image upload section when image is pasted
          onImageUploadToggle(true);
        }
        break;
      }
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
          onPaste={handlePaste}
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
    </div>
  );
});

InputArea.displayName = 'InputArea';
