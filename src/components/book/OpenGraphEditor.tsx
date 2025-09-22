import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { InlineEditInput } from '@/components/ui/inline-edit-input';
import { InlineEditTextarea } from '@/components/ui/inline-edit-textarea';
import { Loader2, Upload, Eye, Wand2, X, MessageSquare, ImagePlus, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBookSeoMetadata } from '@/hooks/useBookSeoMetadata';
import { useBookPages } from '@/hooks/useBookPages';
import { usePageImageUrls } from '@/hooks/usePageImageUrls';

import { useAuth } from '@/hooks/useAuth';

interface OpenGraphEditorProps {
  bookId: string;
  bookTitle: string;
  bookDescription?: string;
}

export const OpenGraphEditor = ({ bookId, bookTitle, bookDescription }: OpenGraphEditorProps) => {
  const { data: seoMetadata, isLoading, refetch } = useBookSeoMetadata(bookId);
  const { pages } = useBookPages(bookId);
  const firstPage = pages?.[0];
  const { currentImage: firstPageImage } = usePageImageUrls(firstPage?.id || '');
  
  const { user } = useAuth();
  
  // Debug logging for OpenGraph editor
  console.log('🎨 [OpenGraphEditor] Rendering with:', {
    bookId,
    bookTitle,
    seoMetadata: seoMetadata ? {
      has_title: !!seoMetadata.seo_title,
      has_description: !!seoMetadata.seo_description,
      has_thumbnail: !!seoMetadata.og_image_url,
      thumbnail_url: seoMetadata.og_image_url
    } : null,
    isLoading
  });
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTitle = seoMetadata?.seo_title || bookTitle;
  const currentDescription = seoMetadata?.seo_description || bookDescription || '';
  const currentImage = seoMetadata?.og_image_url;
  const fallbackImage = firstPageImage?.image_url && firstPageImage?.generation_status === 'complete' ? firstPageImage.image_url : null;

  // Debug the current state of images
  console.log('🖼️ [OpenGraphEditor] Image state:', {
    currentImage,
    fallbackImage,
    firstPageImage: firstPageImage ? {
      url: firstPageImage.image_url,
      status: firstPageImage.generation_status
    } : null
  });

  const handleTitleSave = async (newTitle: string) => {
    // Note: SEO metadata is now read-only as it's generated at book creation
    // Manual editing would require implementing new update logic
    setIsEditingTitle(false);
    toast.error('SEO editing is currently disabled - SEO is generated at book creation');
  };

  const handleDescriptionSave = async (newDescription: string) => {
    // Note: SEO metadata is now read-only as it's generated at book creation
    // Manual editing would require implementing new update logic
    setIsEditingDescription(false);
    toast.error('SEO editing is currently disabled - SEO is generated at book creation');
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Upload to page-images bucket with user ID as folder (required by RLS)
      const fileName = `${user?.id}/og-${bookId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('page-images')
        .getPublicUrl(fileName);

      // Note: Image upload functionality needs to be reimplemented
      // to work with the new SEO system where metadata is generated at book creation
      toast.error('Image upload is currently disabled - SEO is generated at book creation');

      refetch();
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    // Note: SEO metadata is now read-only as it's generated at book creation
    toast.error('Image removal is currently disabled - SEO is generated at book creation');
  };


  const handleGenerateThumbPrompt = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setIsGenerating(true);
    setGeneratedPrompt(null); // Clear previous prompt
    try {
      const { data, error } = await supabase.functions.invoke('generate-book-thumbnail-prompt', {
        body: {
          bookId,
          userId: user.id,
        },
      });

      if (error) throw error;

      if (data?.success && data?.thumbnailPrompt) {
        // Store the prompt in state to display in UI
        setGeneratedPrompt(data.thumbnailPrompt);
        
        // Show success message
        toast.success('Thumbnail prompt generated successfully!');
        
        // Log the prompt to console for debugging
        console.log('Generated Thumbnail Prompt:', data.thumbnailPrompt);
        console.log('Original Prompt (before safe space rules):', data.originalPrompt);
      } else {
        throw new Error('Failed to generate thumbnail prompt');
      }
    } catch (error) {
      console.error('Thumbnail prompt generation error:', error);
      toast.error('Failed to generate thumbnail prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (generatedPrompt && navigator.clipboard) {
      await navigator.clipboard.writeText(generatedPrompt);
      toast.success('Prompt copied to clipboard!');
    }
  };

  const handleClearPrompt = () => {
    setGeneratedPrompt(null);
  };

  const handleGenerateThumbImage = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    // Check if we have a generated prompt to use
    if (!generatedPrompt) {
      toast.error('Please generate a thumbnail prompt first');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-book-thumbnail', {
        body: {
          bookId,
          userId: user.id,
          ...(generatedPrompt && { customPrompt: generatedPrompt }), // Only include if we have a prompt
        },
      });

      if (error) throw error;

      if (data?.success && data?.thumbnailUrl) {
        // Refetch SEO metadata to show the new generated image
        refetch();
        toast.success('Thumbnail image generated successfully!');
        
        // Clear the prompt since it's been used
        setGeneratedPrompt(null);
      } else {
        throw new Error('Failed to generate thumbnail image');
      }
    } catch (error) {
      console.error('Thumbnail image generation error:', error);
      toast.error('Failed to generate thumbnail image');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <CardTitle className="text-lg">Social Media Preview</CardTitle>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Social Media Preview
          </CardTitle>
          <CardDescription>
            SEO metadata is generated automatically when the book is created
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title Field */}
        <div className="space-y-2">
          <Label htmlFor="og-title">Title</Label>
          <InlineEditInput
            value={currentTitle}
            onSave={handleTitleSave}
            isEditing={isEditingTitle}
            renderDisplay={(value) => (
              <div
                className="p-3 rounded-md border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 cursor-pointer transition-colors"
                onClick={() => setIsEditingTitle(true)}
              >
                <p className="font-medium">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to edit</p>
              </div>
            )}
            placeholder="Enter social media title..."
          />
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="og-description">Description</Label>
          <InlineEditTextarea
            value={currentDescription}
            onSave={handleDescriptionSave}
            isEditing={isEditingDescription}
            renderDisplay={(value) => (
              <div
                className="p-3 rounded-md border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 cursor-pointer transition-colors min-h-[80px]"
                onClick={() => setIsEditingDescription(true)}
              >
                <p className="text-sm">{value || 'No description set'}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to edit</p>
              </div>
            )}
            placeholder="Enter social media description..."
          />
        </div>

        {/* Image Field */}
        <div className="space-y-2">
          <Label>Social Media Image <span className="text-sm text-muted-foreground font-normal">(Recommended: 1200x630px)</span></Label>
          <div className="space-y-3">
            {currentImage ? (
              <div className="relative max-w-md">
                {/* Aspect ratio container for 1200x630 (1.9:1) social media images */}
                <div className="relative w-full" style={{ aspectRatio: '1200/630' }}>
                  <img
                    src={currentImage}
                    alt="OpenGraph preview"
                    className="absolute inset-0 w-full h-full object-cover rounded-md border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 z-10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : fallbackImage ? (
              <div className="space-y-2">
                <div className="relative w-full" style={{ aspectRatio: '1200/630' }}>
                  <img
                    src={fallbackImage}
                    alt="First page image (will be used when shared)"
                    className="absolute inset-0 w-full h-full object-cover rounded-md border border-dashed border-muted-foreground/50"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs p-2 rounded-b-md">
                    Using first page image (no custom image set)
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-md p-8 text-center">
                <p className="text-sm text-muted-foreground">No custom image set</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {firstPage ? 'Waiting for first page image to generate' : 'No pages created yet'}
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {currentImage ? 'Replace Image' : 'Upload Image'}
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateThumbPrompt}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                Generate Thumb Prompt
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateThumbImage}
                disabled={isGenerating || !generatedPrompt}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ImagePlus className="w-4 h-4" />
                )}
                {currentImage ? 'Regenerate Thumb Image' : 'Generate Thumb Image'}
              </Button>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={seoMetadata ? 'default' : 'secondary'}>
            {seoMetadata ? 'Custom Settings' : 'Using Defaults'}
          </Badge>
        </div>

        {/* Thumbnail Prompt */}
        {generatedPrompt && (
          <div className="border rounded-md bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center justify-between p-3 border-b bg-blue-100/30 dark:bg-blue-900/20">
              <Label className="text-sm font-medium">
                Generated Thumbnail Prompt
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPrompt}
                  className="h-7 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearPrompt}
                  className="h-7 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="p-3">
              <textarea
                value={generatedPrompt || ''}
                readOnly
                className="w-full h-32 text-xs font-mono bg-transparent border-none resize-none focus:outline-none"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
              />
            </div>
          </div>
        )}

        {/* Preview Card */}
        <div className="border rounded-md p-4 bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
          <div className="space-y-2">
            <p className="font-semibold text-sm">{currentTitle}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">{currentDescription}</p>
            {(currentImage || fallbackImage) && (
              <div className="w-full" style={{ aspectRatio: '1200/630' }}>
                <img
                  src={currentImage || fallbackImage || ''}
                  alt="Preview"
                  className="w-full h-full object-cover rounded"
                />
                {!currentImage && fallbackImage && (
                  <p className="text-xs text-muted-foreground mt-1">Using first page image</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};