import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shimmer } from "@/components/ui/shimmer";
import { usePageImageUrls } from "@/hooks/usePageImageUrls";
import { usePageSystemPrompt } from "@/hooks/usePageSystemPrompt";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ProcessStatus } from "@/types/process";
import { useState, useEffect } from "react";
import { Loader2, Upload, Sparkles } from "lucide-react";
import { ImageUpload } from "./ImageUpload";

interface PageImageSectionProps {
  pageId: string;
  bookId: string;
  showUpload?: boolean;
  onCloseUpload?: () => void;
}

export function PageImageSection({ pageId, bookId, showUpload: externalShowUpload, onCloseUpload }: PageImageSectionProps) {
  const { user } = useAuthContext();
  const { currentImage, versions, isLoading, createImageRecord, uploadImage, refreshData } = usePageImageUrls(pageId);
  const { currentPrompt } = usePageSystemPrompt(pageId);
  const [isLocalGenerating, setIsLocalGenerating] = useState(false);
  
  const [internalShowUpload, setInternalShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Use external upload state if provided, otherwise use internal state
  const showUpload = externalShowUpload !== undefined ? externalShowUpload : internalShowUpload;
  const setShowUpload = onCloseUpload ? onCloseUpload : setInternalShowUpload;

  // Check if there's a deployed page system prompt
  const hasDeployedPrompt = currentPrompt?.is_deployed === true;

  // Helper function to detect navigation/cancellation errors
  const isNavigationError = (error: any): boolean => {
    return error?.name === 'AbortError' || 
           error?.message?.includes('cancelled') ||
           error?.message?.includes('aborted') ||
           error?.code === 'ABORT_ERR';
  };

  // Enhanced state recovery on component mount
  useEffect(() => {
    // Check if there's an ongoing generation when component mounts
    if (currentImage?.generation_status === 'in_progress' && !isLocalGenerating) {
      console.log('🔄 Recovering generation state on mount');
      setIsLocalGenerating(true);
    }
  }, [currentImage?.id, currentImage?.generation_status]); // Only run when image or status changes

  // Clear local generating state when backend status updates to complete or error
  useEffect(() => {
    console.log('🔄 Image state update:', {
      imageId: currentImage?.id,
      status: currentImage?.generation_status,
      hasImageUrl: !!currentImage?.image_url,
      isLocalGenerating,
      timestamp: new Date().toISOString()
    });
    
    // Only clear local generating if we have a definitive completion state
    if (currentImage && isLocalGenerating) {
      if (currentImage.generation_status === 'complete' && currentImage.image_url) {
        console.log('✅ Image generation complete, clearing local state');
        setIsLocalGenerating(false);
      } else if (currentImage.generation_status === 'error') {
        console.log('❌ Image generation failed, clearing local state');
        setIsLocalGenerating(false);
      }
    }
  }, [currentImage?.id, currentImage?.generation_status, currentImage?.image_url, isLocalGenerating]);

  const handleGenerateImageDirectly = async () => {
    if (!user || !hasDeployedPrompt) return;

    setIsLocalGenerating(true);
    try {
      // Use stored prompt first, then fallback to generating new one
      let prompt = await getStoredPrompt();
      
      if (!prompt) {
        const { data: promptData, error: promptError } = await supabase.functions.invoke('generate-image-prompt', {
          body: { pageId, userId: user.id }
        });

        if (promptError) throw promptError;
        if (!promptData?.success) throw new Error(promptData?.error || 'Failed to generate image prompt');
        
        prompt = promptData.imagePrompt;
      }

      if (!prompt || prompt.trim().length === 0) {
        throw new Error('No image prompt available. Please ensure a page system prompt is deployed.');
      }

      const record = await createImageRecord(bookId, prompt);
      if (!record) {
        throw new Error('Failed to create image record');
      }

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { recordId: record.id, userId: user.id }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate image');

      toast.success('Image generation started!');
      refreshData();
    } catch (error: any) {
      console.error('Error generating image:', error);
      
      // Only clear local generating state and show error for real errors, not navigation cancellations
      if (!isNavigationError(error)) {
        toast.error(error.message || 'Failed to generate image');
        setIsLocalGenerating(false);
      } else {
        console.log('🚫 Direct image generation request cancelled due to navigation');
        // Don't clear isLocalGenerating for navigation cancellations
      }
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


  const handleImageUpload = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    try {
      await uploadImage(file, bookId);
      toast.success('Image uploaded successfully!');
      if (onCloseUpload) {
        onCloseUpload();
      } else {
        setInternalShowUpload(false);
      }
      refreshData();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (!user || isUploading || isGenerating) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    // Find the first image in clipboard
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          await handleImageUpload(file);
          return;
        }
      }
    }

    toast.error('No image found in clipboard');
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
  const isUserUploaded = currentImage?.source_type === 'user_uploaded';
  
  console.log('🎨 Render state:', {
    hasImage,
    isGenerating,
    hasError,
    imageUrl: currentImage?.image_url ? 'present' : 'missing',
    status: currentImage?.generation_status,
    isLocalGenerating,
    currentImageId: currentImage?.id
  });

  return (
    <div 
      className="w-full aspect-square bg-muted rounded-lg overflow-hidden relative"
      onPaste={showUpload ? undefined : handlePaste}
      tabIndex={showUpload ? undefined : 0}
    >
      {showUpload ? (
        // Show upload interface
        <div className="relative w-full h-full">
          <ImageUpload 
            onImageSelect={handleImageUpload}
            disabled={isUploading}
            className="w-full h-full"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            </div>
          )}
          <Button
            onClick={() => {
              if (onCloseUpload) {
                onCloseUpload();
              } else {
                setInternalShowUpload(false);
              }
            }}
            variant="outline"
            size="sm"
            className="absolute top-2 right-2"
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      ) : hasImage && currentImage?.image_url ? (
        // Show image with source indicator
        <div className="relative w-full h-full">
          <img 
            src={currentImage.image_url} 
            alt={isUserUploaded ? "Uploaded page image" : "Generated page image"}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onLoad={() => console.log('🖼️ Image loaded successfully:', currentImage.image_url)}
            onError={() => console.error('🚫 Image failed to load:', currentImage.image_url)}
          />
          {/* Source indicator - only show for AI generated */}
          {!isUserUploaded && (
            <div className="absolute top-2 left-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </div>
            </div>
          )}
        </div>
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
        </div>
      ) : (
        // Show initial state with paste-first design
        <div 
          className="flex flex-col items-center justify-center h-full space-y-4 p-4 text-center cursor-pointer border-2 border-dashed border-muted-foreground/20 rounded-lg"
          onClick={() => {
            if (onCloseUpload) {
              return;
            }
            setInternalShowUpload(true);
          }}
        >
          <Upload className="w-12 h-12 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">
              Tap to paste image
            </p>
            <p className="text-xs text-muted-foreground">
              or click to upload from device
            </p>
          </div>
          
          {hasDeployedPrompt && (
            <div className="w-full pt-2 border-t border-border">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateImageDirectly();
                }}
                size="sm"
                variant="outline"
                className="w-full"
                disabled={isGenerating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AI
              </Button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}