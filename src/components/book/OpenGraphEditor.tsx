import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { InlineEditInput } from '@/components/ui/inline-edit-input';
import { InlineEditTextarea } from '@/components/ui/inline-edit-textarea';
import { Loader2, Upload, Eye, Wand2, X, MessageSquare, ImagePlus, Copy, Type } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBookSeoMetadata } from '@/hooks/useBookSeoMetadata';
import { useBookPages } from '@/hooks/useBookPages';
import { usePageImageUrls } from '@/hooks/usePageImageUrls';
import { getBookCoverUploadInfo } from '@/utils/storagePaths';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { ImageTextOverlayEditor } from '@/components/page-prompts/ImageTextOverlayEditor';
import { processImageForOpenGraph, formatFileSize } from '@/utils/imageProcessor';

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
  
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  
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
  const [showTextOverlayEditor, setShowTextOverlayEditor] = useState(false);
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
    if (!user?.id || !newTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    try {
      // Find the appropriate daily_published entry for this book
      const { data: dailyPublishedEntries, error: dailyError } = await supabase
        .from('daily_published')
        .select('id, status, created_at')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

      if (dailyError) {
        throw new Error(`Failed to find daily published entry: ${dailyError.message}`);
      }

      if (!dailyPublishedEntries || dailyPublishedEntries.length === 0) {
        throw new Error('No daily published entry found for this book. Please queue the book for publishing first.');
      }

      // Prioritize active/queued over expired/draft
      const priorityOrder = ['active', 'queued', 'expired', 'draft'];
      let targetDailyPublished = null;

      for (const priority of priorityOrder) {
        const entry = dailyPublishedEntries.find(entry => entry.status === priority);
        if (entry) {
          targetDailyPublished = entry;
          break;
        }
      }

      if (!targetDailyPublished) {
        targetDailyPublished = dailyPublishedEntries[0];
      }

      // Get next version number
      const { data: versionData } = await supabase
        .rpc('get_next_seo_version_number', { p_daily_published_id: targetDailyPublished.id });
      const nextVersion = versionData || 1;

      // Update existing SEO metadata to mark as not latest
      await supabase
        .from('seo_metadata')
        .update({ is_latest: false })
        .eq('daily_published_id', targetDailyPublished.id)
        .eq('is_latest', true);

      // Create new SEO metadata record with updated title
      const { error: insertError } = await supabase
        .from('seo_metadata')
        .insert({
          daily_published_id: targetDailyPublished.id,
          user_id: user.id,
          og_image_url: currentImage,
          seo_title: newTitle,
          seo_description: currentDescription,
          optimization_status: 'complete',
          version_number: nextVersion,
          is_latest: true,
          is_active: true,
          source_data: {
            book_id: bookId,
            action_type: 'manual_title_update'
          }
        });

      if (insertError) {
        throw new Error(`Failed to save SEO metadata: ${insertError.message}`);
      }

      refetch();
      toast.success('Title updated successfully');
    } catch (error) {
      console.error('Title update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update title');
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = async (newDescription: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      // Find the appropriate daily_published entry for this book
      const { data: dailyPublishedEntries, error: dailyError } = await supabase
        .from('daily_published')
        .select('id, status, created_at')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

      if (dailyError) {
        throw new Error(`Failed to find daily published entry: ${dailyError.message}`);
      }

      if (!dailyPublishedEntries || dailyPublishedEntries.length === 0) {
        throw new Error('No daily published entry found for this book. Please queue the book for publishing first.');
      }

      // Prioritize active/queued over expired/draft
      const priorityOrder = ['active', 'queued', 'expired', 'draft'];
      let targetDailyPublished = null;

      for (const priority of priorityOrder) {
        const entry = dailyPublishedEntries.find(entry => entry.status === priority);
        if (entry) {
          targetDailyPublished = entry;
          break;
        }
      }

      if (!targetDailyPublished) {
        targetDailyPublished = dailyPublishedEntries[0];
      }

      // Get next version number
      const { data: versionData } = await supabase
        .rpc('get_next_seo_version_number', { p_daily_published_id: targetDailyPublished.id });
      const nextVersion = versionData || 1;

      // Update existing SEO metadata to mark as not latest
      await supabase
        .from('seo_metadata')
        .update({ is_latest: false })
        .eq('daily_published_id', targetDailyPublished.id)
        .eq('is_latest', true);

      // Create new SEO metadata record with updated description
      const { error: insertError } = await supabase
        .from('seo_metadata')
        .insert({
          daily_published_id: targetDailyPublished.id,
          user_id: user.id,
          og_image_url: currentImage,
          seo_title: currentTitle,
          seo_description: newDescription,
          optimization_status: 'complete',
          version_number: nextVersion,
          is_latest: true,
          is_active: true,
          source_data: {
            book_id: bookId,
            action_type: 'manual_description_update'
          }
        });

      if (insertError) {
        throw new Error(`Failed to save SEO metadata: ${insertError.message}`);
      }

      refetch();
      toast.success('Description updated successfully');
    } catch (error) {
      console.error('Description update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update description');
    }
    setIsEditingDescription(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Critical: Validate user is authenticated
    if (!user?.id) {
      toast.error('User not authenticated. Please log in and try again.');
      return;
    }

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
      // Process image for OpenGraph (crop to 1200x630, optimize)
      toast.loading('Processing image for social media preview...', { id: 'image-processing' });
      const processed = await processImageForOpenGraph(file);
      toast.dismiss('image-processing');
      
      // Show processing results
      toast.success(
        `Image cropped to 1200×630 (${formatFileSize(processed.originalSize)} → ${formatFileSize(processed.compressedSize)})`,
        { duration: 3000 }
      );

      // Upload to book-covers bucket (RLS requires first folder = bookId)
      const processedFile = new File(
        [processed.blob],
        file.name.replace(/\.[^/.]+$/, '.webp'),
        { type: processed.blob.type }
      );
      const { path: storagePath, contentType } = getBookCoverUploadInfo(bookId, processedFile);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(storagePath, processed.blob, {
          contentType,
          cacheControl: '31536000, immutable',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('book-covers')
        .getPublicUrl(storagePath);

      if (!publicUrl?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      // Verify book ownership first (critical for RLS)
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('id, user_id')
        .eq('id', bookId)
        .eq('user_id', user.id)
        .single();

      if (bookError || !bookData) {
        throw new Error('Book not found or access denied');
      }

      // Find or create daily_published entry for this book
      let { data: dailyPublishedEntries, error: dailyError } = await supabase
        .from('daily_published')
        .select('id, status, created_at, book_id')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

      if (dailyError) {
        throw new Error(`Failed to find daily published entry: ${dailyError.message}`);
      }

      let targetDailyPublished = null;

      // If no entries exist, create a draft entry for thumbnail storage
      if (!dailyPublishedEntries || dailyPublishedEntries.length === 0) {
        console.log('📝 Creating draft daily_published entry for thumbnail upload');
        
        const { data: newDailyPublished, error: createError } = await supabase
          .from('daily_published')
          .insert({
            book_id: bookId,
            title: bookTitle,
            description: bookDescription || `Thumbnail for ${bookTitle}`,
            status: 'draft',
            is_active: false,
            publish_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create draft entry: ${createError.message}`);
        }

        targetDailyPublished = newDailyPublished;
      } else {
        // Prioritize active/queued over expired/draft
        const priorityOrder = ['active', 'queued', 'expired', 'draft'];

        for (const priority of priorityOrder) {
          const entry = dailyPublishedEntries.find(entry => entry.status === priority);
          if (entry) {
            targetDailyPublished = entry;
            break;
          }
        }

        if (!targetDailyPublished) {
          targetDailyPublished = dailyPublishedEntries[0];
        }
      }

      console.log('🔧 [Upload Debug] Target daily published:', {
        id: targetDailyPublished.id,
        status: targetDailyPublished.status,
        book_id: targetDailyPublished.book_id,
        user_id: user.id
      });

      // Update existing latest SEO metadata in place (RLS-friendly)
      const { data: updatedRows, error: updateLatestError } = await supabase
        .from('seo_metadata')
        .update({
          og_image_url: publicUrl.publicUrl,
          seo_title: currentTitle,
          seo_description: currentDescription,
          is_active: true,
          is_latest: true,
        })
        .eq('daily_published_id', targetDailyPublished.id)
        .eq('is_latest', true)
        .select('id');

      if (updateLatestError) {
        console.warn('⚠️ Update latest SEO metadata failed, will try insert fallback:', updateLatestError);
      }

      if (!updatedRows || updatedRows.length === 0) {
        // Fallback: create a new versioned row
        const { data: versionData } = await supabase
          .rpc('get_next_seo_version_number', { p_daily_published_id: targetDailyPublished.id });
        const nextVersion = versionData || 1;

        // Mark any existing latest row as not latest (best effort)
        await supabase
          .from('seo_metadata')
          .update({ is_latest: false })
          .eq('daily_published_id', targetDailyPublished.id)
          .eq('is_latest', true);

        const { error: insertError } = await supabase
          .from('seo_metadata')
          .insert({
            daily_published_id: targetDailyPublished.id,
            user_id: user.id,
            og_image_url: publicUrl.publicUrl,
            seo_title: currentTitle,
            seo_description: currentDescription,
            optimization_status: 'complete',
            version_number: nextVersion,
            is_latest: true,
            is_active: true,
            source_data: {
              book_id: bookId,
              upload_type: 'manual_image_upload',
              original_filename: file.name,
              processed: true,
              dimensions: `${processed.width}x${processed.height}`,
              compression_ratio: processed.compressionRatio.toFixed(2)
            }
          });

        if (insertError) {
          console.error('🚨 [Upload Debug] Insert error details:', insertError);
          throw new Error(`Failed to save SEO metadata: ${insertError.message}`);
        }
      }

      // Invalidate library books cache to refresh thumbnails
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['library-books'] });
      
      toast.success('Image uploaded and SEO metadata updated successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Clear file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImage) return;

    try {
      // Find the appropriate daily_published entry for this book
      const { data: dailyPublishedEntries, error: dailyError } = await supabase
        .from('daily_published')
        .select('id, status, created_at')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

      if (dailyError) {
        throw new Error(`Failed to find daily published entry: ${dailyError.message}`);
      }

      if (!dailyPublishedEntries || dailyPublishedEntries.length === 0) {
        throw new Error('No daily published entry found for this book');
      }

      // Prioritize active/queued over expired/draft
      const priorityOrder = ['active', 'queued', 'expired', 'draft'];
      let targetDailyPublished = null;

      for (const priority of priorityOrder) {
        const entry = dailyPublishedEntries.find(entry => entry.status === priority);
        if (entry) {
          targetDailyPublished = entry;
          break;
        }
      }

      if (!targetDailyPublished) {
        targetDailyPublished = dailyPublishedEntries[0];
      }

      // Update latest SEO metadata to remove custom image (RLS-friendly)
      const { data: updatedRows, error: updateError } = await supabase
        .from('seo_metadata')
        .update({ og_image_url: null })
        .eq('daily_published_id', targetDailyPublished.id)
        .eq('is_latest', true)
        .select('id');

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedRows || updatedRows.length === 0) {
        // No existing row to update; nothing else to do
        toast.message('No custom image was set');
        return;
      }

      refetch();
      toast.success('Custom image removed - will use fallback image when shared');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove image');
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
    <>
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Social Media Preview
          </CardTitle>
          <CardDescription>
            Customize social media preview with manual uploads or AI-generated content
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column: Form fields */}
          <div className="space-y-4">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="og-title">Title</Label>
              <InlineEditInput
                value={currentTitle}
                onSave={handleTitleSave}
                isEditing={isEditingTitle}
                renderDisplay={(value) => (
                  <div
                    className="p-2 rounded-md border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 cursor-pointer transition-colors"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <p className="text-sm font-medium">{value}</p>
                    <p className="text-xs text-muted-foreground">Click to edit</p>
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
                    className="p-2 rounded-md border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 cursor-pointer transition-colors min-h-[60px]"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    <p className="text-xs line-clamp-3">{value || 'Click to add description'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to edit</p>
                  </div>
                )}
                placeholder="Enter social media description..."
              />
            </div>
          </div>

          {/* Right column: Image preview */}
          <div className="space-y-3">
            <Label className="text-sm">Social Media Image</Label>
            {currentImage ? (
              <div className="relative group">
                <div className="relative w-full rounded-md overflow-hidden border" style={{ aspectRatio: '1200/630' }}>
                  <img
                    src={currentImage}
                    alt="OpenGraph preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowTextOverlayEditor(true)}
                    >
                      <Type className="w-4 h-4 mr-2" />
                      {seoMetadata?.text_overlay_config ? 'Edit Text Overlay' : 'Add Text Overlay'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : fallbackImage ? (
              <div className="relative w-full rounded-md overflow-hidden border border-dashed" style={{ aspectRatio: '1200/630' }}>
                <img
                  src={fallbackImage}
                  alt="First page image (will be used when shared)"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-xs p-2">
                  Using first page image
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
    
    {currentImage && seoMetadata && user?.id && (
      <ImageTextOverlayEditor
        open={showTextOverlayEditor}
        onOpenChange={setShowTextOverlayEditor}
        imageUrl={currentImage}
        defaultText={currentTitle}
        mode="thumbnail"
        bookId={bookId}
        dailyPublishedId={seoMetadata.daily_published_id}
        seoMetadataId={seoMetadata.id}
        userId={user.id}
        existingConfig={seoMetadata.text_overlay_config}
      />
    )}
    </>
  );
};