import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Loader2 } from 'lucide-react';
import { generatePageVideo, downloadBlob } from '@/services/pageVideoGenerator';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VideoExportButtonProps {
  imageUrl: string;
  text: string;
  pageLetter: string;
  pageTitle?: string;
  bookId?: string;
}

type AspectRatio = 'portrait' | 'landscape' | 'square';

const ASPECT_RATIO_LABELS: Record<AspectRatio, string> = {
  portrait: '9:16 (TikTok/Reels)',
  landscape: '16:9 (YouTube)',
  square: '1:1 (Instagram)',
};

export function VideoExportButton({
  imageUrl,
  text,
  pageLetter,
  pageTitle,
  bookId,
}: VideoExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('portrait');

  const handleExport = async () => {
    if (!imageUrl) {
      toast.error('No image available for this page');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const result = await generatePageVideo({
        imageUrl,
        text,
        aspectRatio,
        onProgress: setProgress,
      });

      const extension = result.format === 'mp4' ? 'mp4' : 'webm';
      const filename = pageTitle
        ? `${pageLetter}-is-for-${pageTitle.toLowerCase().replace(/\s+/g, '-')}.${extension}`
        : `${pageLetter}-page.${extension}`;

      await downloadBlob(result.blob, filename, bookId);
      toast.success(`Video saved to cloud!`);
    } catch (error) {
      console.error('Video export failed:', error);
      toast.error('Failed to generate video. Your browser may not support video recording.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={aspectRatio}
        onValueChange={(value) => setAspectRatio(value as AspectRatio)}
        disabled={isGenerating}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(ASPECT_RATIO_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        onClick={handleExport}
        disabled={isGenerating || !imageUrl}
        variant="outline"
        className="gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{progress}%</span>
          </>
        ) : (
          <>
            <Video className="h-4 w-4" />
            <span>Export Video</span>
          </>
        )}
      </Button>
    </div>
  );
}
