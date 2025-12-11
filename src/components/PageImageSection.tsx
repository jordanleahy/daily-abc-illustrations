import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { usePageImageUrls } from "@/hooks/usePageImageUrls";
import { usePageSystemPrompt } from "@/hooks/usePageSystemPrompt";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ProcessStatus } from "@/types/shared";
import { useState, useEffect } from "react";
import { Loader2, Upload, Clipboard, Copy, ArrowLeft, DollarSign, Sparkles } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { compositeTextOnImage } from "@/utils/imageTextCompositor";
import { copyToClipboard } from '@/utils/clipboardHelpers';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface PageImageSectionProps {
  pageId: string;
  bookId: string;
  showUpload?: boolean;
  onCloseUpload?: () => void;
  enableMobileSave?: boolean;
  preloadedImageUrl?: string;
  priority?: boolean;
}

export function PageImageSection({ pageId, bookId, showUpload: externalShowUpload, onCloseUpload, enableMobileSave = false, preloadedImageUrl, priority = false }: PageImageSectionProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const { currentImage, versions, isLoading, createImageRecord, uploadImage, refreshData } = usePageImageUrls(pageId);
  const { currentPrompt } = usePageSystemPrompt(pageId);
  
  const [internalShowUpload, setInternalShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPromptViewer, setShowPromptViewer] = useState(false);

  // Use external upload state if provided, otherwise use internal state
  const showUpload = externalShowUpload !== undefined ? externalShowUpload : internalShowUpload;
  const setShowUpload = onCloseUpload ? onCloseUpload : setInternalShowUpload;

  // Check if there's a deployed page system prompt
  const hasDeployedPrompt = currentPrompt?.is_deployed === true;

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
      console.log('Image uploaded successfully!');
      if (onCloseUpload) {
        onCloseUpload();
      } else {
        setInternalShowUpload(false);
      }
      refreshData();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      console.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (!user || isUploading) return;

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

    console.error('No image found in clipboard');
  };

  // Handle paste from clipboard button (mobile-friendly)
  const handlePasteFromClipboard = async () => {
    if (!user || isUploading) return;

    try {
      // Check if Clipboard API is supported
      if (!navigator.clipboard || !navigator.clipboard.read) {
        console.error('Clipboard access not supported on this browser');
        return;
      }

      // Request clipboard permission and read contents
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        // Find image types
        const imageType = clipboardItem.types.find(type => type.startsWith('image/'));
        
        if (imageType) {
          const blob = await clipboardItem.getType(imageType);
          const file = new File([blob], 'pasted-image.png', { type: imageType });
          await handleImageUpload(file);
          return;
        }
      }

      console.error('No image found in clipboard');
    } catch (error: any) {
      console.error('Error reading clipboard:', error);
      if (error.name === 'NotAllowedError') {
        console.error('Clipboard access denied. Please grant permission to paste images.');
      } else {
        console.error('Failed to paste from clipboard');
      }
    }
  };

  const handleCopyPrompt = async () => {
    if (!currentPrompt?.content) {
      console.error('No prompt available to copy');
      return;
    }

    try {
      await copyToClipboard(currentPrompt.content);
      console.log('Prompt copied to clipboard!');
    } catch (error) {
      console.error('Error copying prompt:', error);
      console.error('Failed to copy prompt');
    }
  };

  // Generate text image by compositing title onto existing color image
  const handleGenerateTextImage = async () => {
    if (!user || !currentImage?.image_url) {
      toast({
        title: "No image available",
        description: "Please upload a color image first before generating text overlay.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Get page title from database
      const { data: pageData, error: pageError } = await supabase
        .from('pages')
        .select('title')
        .eq('id', pageId)
        .single();

      if (pageError || !pageData?.title) {
        throw new Error('Could not fetch page title');
      }

      // Fetch the color image and convert to data URL
      const response = await fetch(currentImage.image_url);
      const blob = await response.blob();
      const imageDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Composite text onto image
      const { blob: compositedBlob } = await compositeTextOnImage(imageDataUrl, pageData.title);

      // Upload the composited image
      const fileName = `page-${pageId}-text-${Date.now()}.png`;
      const filePath = `${user.id}/${bookId}/text/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(filePath, compositedBlob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('page-images')
        .getPublicUrl(filePath);

      // Update page_image_urls with text_image_url
      const { error: updateError } = await supabase
        .from('page_image_urls')
        .update({ text_image_url: urlData.publicUrl })
        .eq('id', currentImage.id);

      if (updateError) throw updateError;

      toast({
        title: "Text image generated",
        description: "Title overlay has been added to the image.",
      });
      
      refreshData();
    } catch (error: any) {
      console.error('Error generating text image:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate text image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-muted via-muted/50 to-muted rounded-lg" />
    );
  }

  // Prefer latest DB image; fall back to preloaded (from editor preloader)
  const displayImageUrl = currentImage?.image_url || preloadedImageUrl;
  const hasImage = Boolean(currentImage?.image_url || preloadedImageUrl);
  const isUserUploaded = currentImage?.source_type === 'user_uploaded';
  
  console.log('🎨 Render state:', {
    hasImage,
    imageUrl: currentImage?.image_url ? 'present' : 'missing',
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
            showCopyPrompt={true}
            onCopyPrompt={handleCopyPrompt}
            onGenerate={handleGenerateTextImage}
            isGenerating={isGenerating}
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
      ) : hasImage && displayImageUrl ? (
        // Show image with action buttons
        <div className="relative w-full h-full group">
          <OptimizedImage
            src={displayImageUrl}
            alt={isUserUploaded ? "Uploaded page image" : "Generated page image"}
            priority={priority}
            width={800}
            quality={85}
            srcSetSizes={[400, 800, 1200]}
            className="w-full h-full object-contain"
            containerClassName="w-full h-full"
          />
          
          {/* Action buttons - always visible on mobile, hover on desktop */}
          <div className="absolute top-2 right-2 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setInternalShowUpload(true)}
              className="h-8 text-xs shadow-lg"
            >
              <Upload className="w-3 h-3 mr-1" />
              Replace
            </Button>
            
            {hasDeployedPrompt && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowPromptViewer(true)}
                className="h-8 text-xs shadow-lg"
              >
                <Copy className="w-3 h-3 mr-1" />
                Prompt
              </Button>
            )}
          </div>
        </div>
      ) : showPromptViewer && currentPrompt?.content ? (
        // Show prompt viewer
        <div className="flex flex-col h-full p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Image Generation Prompt</h3>
            <Button
              size="sm"
              variant="outline"
              disabled={!currentPrompt?.content}
              onClick={async () => {
                if (currentPrompt?.content) {
                  try {
                    await copyToClipboard(currentPrompt.content);
                    console.log('Prompt copied to clipboard');
                  } catch (error) {
                    console.error('Failed to copy prompt');
                  }
                }
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3 mb-3">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
              {currentPrompt.content}
            </pre>
          </div>
          <Button
            onClick={() => setShowPromptViewer(false)}
            size="sm"
            variant="secondary"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Image
          </Button>
        </div>
      ) : (
        // Show initial state - paste only (Upload button handles file selection)
        <div 
          className="flex flex-col items-center justify-center h-full space-y-4 p-4 text-center border-2 border-dashed border-muted-foreground/20 rounded-lg focus:border-primary focus:outline-none transition-colors"
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <Clipboard className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Paste image from clipboard
              </p>
              <p className="text-xs text-muted-foreground">
                Or use the Upload button above to select files
              </p>
            </div>
            
            {/* Generate text overlay button */}
            <Button 
              onClick={handleGenerateTextImage}
              size="sm"
              variant="default"
              className="w-full max-w-xs"
              disabled={isUploading || isGenerating || !currentImage?.image_url}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>

            {/* View Prompt button */}
            {hasDeployedPrompt && currentPrompt?.content && (
              <Button 
                onClick={() => setShowPromptViewer(true)}
                size="sm"
                variant="secondary"
                className="w-full max-w-xs"
              >
                <Copy className="w-4 h-4 mr-2" />
                View Prompt
              </Button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}