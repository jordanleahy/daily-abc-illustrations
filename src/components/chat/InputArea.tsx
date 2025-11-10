import { memo } from 'react';
import { Send, Image as ImageIcon, BookOpen, Book } from 'lucide-react';
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
  shouldShowReviewButton: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onImageUploadToggle: (show: boolean) => void;
  onImageSelect: (file: File) => void;
  onViewBook: () => void;
  onOpenReview: () => void;
}

export const InputArea = memo(({
  input,
  isLoading,
  showImageUpload,
  createdBookId,
  isMobile,
  shouldShowReviewButton,
  onInputChange,
  onSend,
  onKeyPress,
  onImageUploadToggle,
  onImageSelect,
  onViewBook,
  onOpenReview
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
        {shouldShowReviewButton && !createdBookId && (
          <Button
            onClick={onOpenReview}
            variant="outline"
            className="shrink-0"
            size={isMobile ? "sm" : "default"}
            title="View Outline"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">View Outline</span>
          </Button>
        )}
        {shouldShowReviewButton && createdBookId && (
          <>
            <Button
              onClick={onViewBook}
              variant="outline"
              className="shrink-0"
              size={isMobile ? "sm" : "default"}
              title="Read Book"
            >
              <Book className={cn("h-4 w-4", !isMobile && "mr-1")} />
              <span className="hidden sm:inline">Read Book</span>
            </Button>
            <Button
              onClick={onOpenReview}
              variant="outline"
              className="shrink-0"
              size={isMobile ? "sm" : "default"}
              title="View Outline"
            >
              <BookOpen className={cn("h-4 w-4", !isMobile && "mr-1")} />
              <span className="hidden sm:inline">View Outline</span>
            </Button>
          </>
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
