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
import { useUpdateSeoMetadata } from '@/hooks/useUpdateSeoMetadata';
import { useAuth } from '@/hooks/useAuth';

interface OpenGraphEditorProps {
  bookId: string;
  bookTitle: string;
  bookDescription?: string;
}

export const OpenGraphEditor = ({ bookId, bookTitle, bookDescription }: OpenGraphEditorProps) => {
  const { data: seoMetadata, isLoading, refetch } = useBookSeoMetadata(bookId);
  const updateSeoMetadata = useUpdateSeoMetadata();
  const { user } = useAuth();
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTitle = seoMetadata?.seo_title || bookTitle;
  const currentDescription = seoMetadata?.seo_description || bookDescription || '';
  const currentImage = seoMetadata?.og_image_url;

  const handleTitleSave = async (newTitle: string) => {
    try {
      await updateSeoMetadata.mutateAsync({
        bookId,
        seoTitle: newTitle,
        seoDescription: currentDescription,
        ogImageUrl: currentImage,
      });
      setIsEditingTitle(false);
      refetch();
      toast.success('Title updated successfully');
    } catch (error) {
      toast.error('Failed to update title');
    }
  };

  const handleDescriptionSave = async (newDescription: string) => {
    try {
      await updateSeoMetadata.mutateAsync({
        bookId,
        seoTitle: currentTitle,
        seoDescription: newDescription,
        ogImageUrl: currentImage,
      });
      setIsEditingDescription(false);
      refetch();
      toast.success('Description updated successfully');
    } catch (error) {
      toast.error('Failed to update description');
    }
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

      // Update SEO metadata with new image URL
      await updateSeoMetadata.mutateAsync({
        bookId,
        seoTitle: currentTitle,
        seoDescription: currentDescription,
        ogImageUrl: publicUrl.publicUrl,
      });

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
    try {
      await updateSeoMetadata.mutateAsync({
        bookId,
        seoTitle: currentTitle,
        seoDescription: currentDescription,
        ogImageUrl: null,
      });
      refetch();
      toast.success('Image removed successfully');
    } catch (error) {
      toast.error('Failed to remove image');
    }
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-seo-metadata', {
        body: {
          bookId,
          contentTitle: bookTitle,
          contentDescription: bookDescription,
        },
      });

      if (error) throw error;

      refetch();
      toast.success('OpenGraph content generated successfully');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate OpenGraph content');
    } finally {
      setIsGenerating(false);
    }
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
        
        // Show the generated prompt in a success toast with copy functionality
        toast.success('Thumbnail prompt generated! Check browser console for full prompt.', {
          duration: 5000,
        });
        
        // Log the prompt to console for easy copying
        console.log('Generated Thumbnail Prompt:', data.thumbnailPrompt);
        console.log('Original Prompt (before safe space rules):', data.originalPrompt);
        
        // Optionally copy to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(data.thumbnailPrompt);
          toast.info('Prompt copied to clipboard!');
        }
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

  const handleGenerateThumbImage = () => {
    // Placeholder for Generate Thumb Image functionality
    toast.info('Generate Thumb Image - Coming Soon');
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Social Media Preview
            </CardTitle>
            <CardDescription>
              Customize how your book appears when shared on social media
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            Auto-generate
          </Button>
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
              <div className="relative">
                <img
                  src={currentImage}
                  alt="OpenGraph preview"
                  className="w-full max-w-md h-32 object-cover rounded-md border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-md p-8 text-center">
                <p className="text-sm text-muted-foreground">No custom image set</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Will use the first page image when shared
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
                className="flex items-center gap-2"
              >
                <ImagePlus className="w-4 h-4" />
                Generate Thumb Image
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

        {/* Generated Thumbnail Prompt */}
        {generatedPrompt && (
          <div className="border rounded-md bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center justify-between p-3 border-b bg-blue-100/30 dark:bg-blue-900/20">
              <Label className="text-sm font-medium">Generated Thumbnail Prompt</Label>
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
                value={generatedPrompt}
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
            {currentImage && (
              <img
                src={currentImage}
                alt="Preview"
                className="w-full h-20 object-cover rounded"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};