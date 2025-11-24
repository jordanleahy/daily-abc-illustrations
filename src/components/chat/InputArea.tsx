import { memo } from 'react';
import { Send, Image as ImageIcon, BookOpen, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ImageUpload';
import { KidSelector } from '@/components/chat/KidSelector';
import { cn } from '@/lib/utils';

interface InputAreaProps {
  input: string;
  isLoading: boolean;
  showImageUpload: boolean;
  createdBookId: string | null;
  isMobile: boolean;
  shouldShowReviewButton: boolean;
  selectedKidId: string | null;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onImageUploadToggle: (show: boolean) => void;
  onImageSelect: (file: File) => void;
  onViewBook: () => void;
  onOpenReview: () => void;
  onKidChange: (kidId: string | null) => void;
}

export const InputArea = memo(({
  input,
  isLoading,
  showImageUpload,
  createdBookId,
  isMobile,
  shouldShowReviewButton,
  selectedKidId,
  onInputChange,
  onSend,
  onKeyPress,
  onImageUploadToggle,
  onImageSelect,
  onViewBook,
  onOpenReview,
  onKidChange
}: InputAreaProps) => {
  console.log('[InputArea Debug] Render with:', {
    shouldShowReviewButton,
    createdBookId: createdBookId || 'none',
    isLoading
  });

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
      <div className="mx-auto max-w-4xl mb-3 flex items-center justify-between gap-4">
        <KidSelector selectedKidId={selectedKidId} onKidChange={onKidChange} />
        {shouldShowReviewButton && (
          <div className="grid grid-cols-2 gap-2 flex-1">
            <Button
              onClick={onViewBook}
              variant={createdBookId ? "default" : "outline"}
              disabled={!createdBookId}
              className="w-full"
            >
              <Book className="h-4 w-4 mr-2" />
              Read
            </Button>
            <Button
              onClick={onOpenReview}
              variant="outline"
              className="w-full"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Outline
            </Button>
          </div>
        )}
      </div>
      <div className="mx-auto flex max-w-4xl gap-2">
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
