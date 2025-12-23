import { Button } from "@/components/ui/button";
import { Sparkles, Info, Wand2 } from "lucide-react";

interface TextModeUploadSectionProps {
  hasColorImage: boolean;
  onGenerate: () => void;
  onGenerateAll: () => void;
  isGenerating: boolean;
  isGeneratingAll?: boolean;
}

export function TextModeUploadSection({
  hasColorImage,
  onGenerate,
  onGenerateAll,
  isGenerating,
  isGeneratingAll = false,
}: TextModeUploadSectionProps) {
  if (!hasColorImage) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Info className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-base font-semibold mb-2">Upload a Color Image First</p>
        <p className="text-xs text-muted-foreground">
          Switch to Color mode to upload an image, then return here to add text overlay
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={onGenerate}
          size="lg"
          className="gap-2 w-full"
          disabled={isGenerating || isGeneratingAll}
        >
          <Sparkles className="h-5 w-5" />
          {isGenerating ? 'Generating...' : 'Generate This Page'}
        </Button>
        
        <Button
          onClick={onGenerateAll}
          variant="outline"
          size="lg"
          className="gap-2 w-full"
          disabled={isGenerating || isGeneratingAll}
        >
          <Wand2 className="h-5 w-5" />
          Generate All Text Images
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Adds text overlay to color images
      </p>
    </div>
  );
}
