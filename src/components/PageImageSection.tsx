import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shimmer } from "@/components/ui/shimmer";
import { usePageImageUrls } from "@/hooks/usePageImageUrls";
import { usePageSystemPrompt } from "@/hooks/usePageSystemPrompt";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ProcessStatus } from "@/types/process";
import { useState, useEffect } from "react";
import { RefreshCw, Loader2 } from "lucide-react";

interface PageImageSectionProps {
  pageId: string;
  bookId: string;
}

export function PageImageSection({ pageId, bookId }: PageImageSectionProps) {
  const { user } = useAuth();
  const { currentImage, versions, isLoading, createImageRecord, refreshData } = usePageImageUrls(pageId);
  const { currentPrompt } = usePageSystemPrompt(pageId);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isLocalGenerating, setIsLocalGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Check if there's a deployed page system prompt
  const hasDeployedPrompt = currentPrompt?.is_deployed === true;

  // Clear local generating state when backend status updates to complete or error
  useEffect(() => {
    console.log('Image status changed:', currentImage?.generation_status, 'isLocalGenerating:', isLocalGenerating);
    if (currentImage?.generation_status && ['complete', 'error'].includes(currentImage.generation_status) && isLocalGenerating) {
      console.log('Clearing local generating state');
      setIsLocalGenerating(false);
    }
  }, [currentImage?.generation_status, isLocalGenerating]);

  const handleGeneratePrompt = async () => {
    if (!user) return;

    setIsGeneratingPrompt(true);
    try {
      // Generate the image prompt using the page system prompt
      const { data: promptData, error: promptError } = await supabase.functions.invoke('generate-image-prompt', {
        body: {
          pageId,
          userId: user.id
        }
      });

      if (promptError) throw promptError;
      if (!promptData?.success) throw new Error(promptData?.error || 'Failed to generate image prompt');
      
      const prompt = promptData.imagePrompt;
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('No image prompt could be generated. Please ensure a page system prompt is deployed.');
      }

      setGeneratedPrompt(prompt);
      toast.success('Prompt generated successfully!');
    } catch (error: any) {
      console.error('Error generating prompt:', error);
      toast.error(error.message || 'Failed to generate prompt');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!user || !generatedPrompt) return;

    setIsLocalGenerating(true); // Start shimmer immediately
    try {
      // Create image record with the generated prompt
      const record = await createImageRecord(bookId, generatedPrompt);
      if (!record) {
        throw new Error('Failed to create image record');
      }

      // Start image generation
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          recordId: record.id,
          userId: user.id
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate image');

      toast.success('Image generation started!');
      setGeneratedPrompt(null); // Clear the prompt state
      refreshData();
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error(error.message || 'Failed to generate image');
      setIsLocalGenerating(false); // Clear local generating on error
    }
  };

  const handleGenerateImageDirectly = async () => {
    if (!user || !hasDeployedPrompt) return;

    setIsLocalGenerating(true); // Start shimmer immediately
    try {
      // Generate the image prompt using the page system prompt
      const { data: promptData, error: promptError } = await supabase.functions.invoke('generate-image-prompt', {
        body: {
          pageId,
          userId: user.id
        }
      });

      if (promptError) throw promptError;
      if (!promptData?.success) throw new Error(promptData?.error || 'Failed to generate image prompt');
      
      const prompt = promptData.imagePrompt;
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('No image prompt could be generated. Please ensure a page system prompt is deployed.');
      }

      // Create image record with the generated prompt
      const record = await createImageRecord(bookId, prompt);
      if (!record) {
        throw new Error('Failed to create image record');
      }

      // Start image generation
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          recordId: record.id,
          userId: user.id
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate image');

      toast.success('Image generation started!');
      refreshData();
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error(error.message || 'Failed to generate image');
      setIsLocalGenerating(false); // Clear local generating on error
    }
  };

  // Helper function to get stored prompt from page_system_prompts
  const getStoredPrompt = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data: storedPrompt, error } = await supabase
        .from('page_system_prompts')
        .select('content')
        .eq('page_id', pageId)
        .eq('is_latest', true)
        .eq('is_deployed', true)
        .single();

      if (error || !storedPrompt) {
        console.log('No stored prompt found:', error);
        return null;
      }

      return storedPrompt.content;
    } catch (error) {
      console.error('Error fetching stored prompt:', error);
      return null;
    }
  };

  const handleRegenerateImage = async () => {
    if (!user) return;

    setIsRegenerating(true);
    setIsLocalGenerating(true);
    try {
      // First try to use the stored prompt from page_system_prompts
      let prompt = await getStoredPrompt();
      
      if (!prompt) {
        // Fallback to generating a new prompt if no stored prompt exists
        console.log('No stored prompt found, generating new prompt');
        const { data: promptData, error: promptError } = await supabase.functions.invoke('generate-image-prompt', {
          body: {
            pageId,
            userId: user.id
          }
        });

        if (promptError) throw promptError;
        if (!promptData?.success) throw new Error(promptData?.error || 'Failed to generate image prompt');
        
        prompt = promptData.imagePrompt;
      }

      if (!prompt || prompt.trim().length === 0) {
        throw new Error('No image prompt available. Please ensure a page system prompt is deployed.');
      }

      // Create new image record with the prompt
      const record = await createImageRecord(bookId, prompt);
      if (!record) {
        throw new Error('Failed to create image record');
      }

      // Start image generation
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          recordId: record.id,
          userId: user.id
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate image');

      toast.success('Image regeneration started!');
      refreshData();
    } catch (error: any) {
      console.error('Error regenerating image:', error);
      toast.error(error.message || 'Failed to regenerate image');
      setIsLocalGenerating(false);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
        <Shimmer className="w-full h-full" />
      </div>
    );
  }

  const isGenerating = currentImage?.generation_status === 'in_progress' || isLocalGenerating;
  const hasImage = currentImage?.generation_status === 'complete' && currentImage?.image_url;
  const hasError = currentImage?.generation_status === 'error';

  return (
    <div className="w-full aspect-square bg-muted rounded-lg overflow-hidden relative">
      {hasImage && currentImage?.image_url ? (
        // Show clean generated image
        <img 
          src={currentImage.image_url} 
          alt="Generated page image"
          className="w-full h-full object-cover"
        />
      ) : isGenerating ? (
        // Show generating state
        <div className="flex flex-col items-center justify-center h-full space-y-3">
          <Shimmer className="w-16 h-16" />
          <p className="text-sm text-muted-foreground">Generating image...</p>
          {currentImage?.generation_started_at && (
            <p className="text-xs text-muted-foreground">
              Started {new Date(currentImage.generation_started_at).toLocaleTimeString()}
            </p>
          )}
        </div>
      ) : hasError ? (
        // Show error state
        <div className="flex flex-col items-center justify-center h-full space-y-2 p-4 text-center">
          <p className="text-sm text-destructive font-medium">Generation Failed</p>
          <p className="text-xs text-muted-foreground">
            {currentImage?.error_message || 'Unknown error occurred'}
          </p>
          <Button 
            onClick={() => {
              setGeneratedPrompt(null);
              if (hasDeployedPrompt) {
                handleGenerateImageDirectly();
              } else {
                handleGeneratePrompt();
              }
            }}
            size="sm"
            variant="outline"
            disabled={isGeneratingPrompt || isGenerating}
          >
            Try Again
          </Button>
        </div>
      ) : generatedPrompt ? (
        // Show prompt preview with generate image button
        <div className="flex flex-col h-full p-4 space-y-3">
          <div className="flex-1 overflow-auto">
            <p className="text-xs text-muted-foreground mb-2">Generated Prompt:</p>
            <p className="text-sm leading-relaxed">{generatedPrompt}</p>
          </div>
          <Button 
            onClick={handleGenerateImage}
            size="sm"
            className="w-full"
            disabled={isGenerating || !generatedPrompt}
          >
            Generate Image
          </Button>
        </div>
      ) : isGeneratingPrompt ? (
        // Show prompt generation state
        <div className="flex flex-col items-center justify-center h-full space-y-3">
          <Shimmer className="w-16 h-16" />
          <p className="text-sm text-muted-foreground">Generating prompt...</p>
        </div>
      ) : (
        // Show initial state - check if we have a deployed prompt
        <div className="flex flex-col items-center justify-center h-full space-y-3 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Click to generate page image
          </p>
          <Button 
            onClick={hasDeployedPrompt ? handleGenerateImageDirectly : handleGeneratePrompt}
            size="sm"
            className="w-full"
            disabled={isGeneratingPrompt || isGenerating}
          >
            {hasDeployedPrompt ? 'Generate Image' : 'Generate Prompt'}
          </Button>
        </div>
      )}

    </div>
  );
}