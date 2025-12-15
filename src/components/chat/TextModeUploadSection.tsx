import { Button } from "@/components/ui/button";
import { Sparkles, Info } from "lucide-react";

interface TextModeUploadSectionProps {
  hasColorImage: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function TextModeUploadSection({
  hasColorImage,
  onGenerate,
  isGenerating,
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
      <Button
        onClick={onGenerate}
        size="lg"
        className="gap-2"
        disabled={isGenerating}
      >
        <Sparkles className="h-5 w-5" />
        {isGenerating ? 'Generating...' : 'Generate Text Image'}
      </Button>
      <p className="text-xs text-muted-foreground mt-3">
        Adds text overlay to your color image
      </p>
    </div>
  );
}
