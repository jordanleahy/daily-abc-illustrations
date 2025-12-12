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
import { getBookCoverUploadInfo } from '@/utils/storagePaths';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { processImageForOpenGraph, formatFileSize } from '@/utils/imageProcessor';
import { useQuery } from '@tanstack/react-query';

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
  // Fetch book cover image from cover page
  const { data: bookCoverData } = useQuery({
    queryKey: ['book-cover-image', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_image_urls')
        .select(`
          image_url,
          pages!inner(page_type)
        `)
        .eq('book_id', bookId)
        .eq('pages.page_type', 'cover')
        .eq('is_latest', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30000,
  });
  
  // Debug logging for OpenGraph editor
  console.log('🎨 [OpenGraphEditor] Rendering with:', {
    bookId,
    bookTitle,
    seoMetadata: seoMetadata ? {
      has_title: !!seoMetadata.seo_title,
      has_description: !!seoMetadata.seo_description,
      has_og_image: !!seoMetadata.og_image_url,
      og_image_url: seoMetadata.og_image_url
    } : null,
    isLoading
  });
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTitle = seoMetadata?.seo_title || bookTitle;
  const currentDescription = seoMetadata?.seo_description || bookDescription || '';
  const currentImage = seoMetadata?.og_image_url;
  const bookCover = bookCoverData?.image_url || null;
  const fallbackImage = bookCover || firstPageImage?.image_url || null;

  // Debug the current state of images
  console.log('🖼️ [OpenGraphEditor] Image state:', {
    currentImage,
    bookCover,
    fallbackImage,
    firstPageImage: firstPageImage ? {
      url: firstPageImage.image_url
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

  const handleGenerateFromCover = async () => {
    if (!bookCover) {
      toast.error('No cover image available. Please upload a cover image first.');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated. Please log in and try again.');
      return;
    }

    setIsGenerating(true);
    try {
      toast.loading('Generating thumbnail from cover...', { id: 'generating-thumbnail' });

      // Fetch the cover image as a blob
      const response = await fetch(bookCover);
      if (!response.ok) throw new Error('Failed to fetch cover image');
      const blob = await response.blob();
      const file = new File([blob], 'cover.webp', { type: blob.type });

      // Process for OpenGraph dimensions (1200x630)
      const processed = await processImageForOpenGraph(file);
      toast.dismiss('generating-thumbnail');

      // Upload to book-covers bucket
      const storagePath = `${bookId}/og-generated-${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(storagePath, processed.blob, {
          contentType: 'image/webp',
          cacheControl: '31536000, immutable',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('book-covers')
        .getPublicUrl(storagePath);

      if (!publicUrl?.publicUrl) {
        throw new Error('Failed to get public URL for generated thumbnail');
      }

      // Find or create daily_published entry
      let { data: dailyPublishedEntries, error: dailyError } = await supabase
        .from('daily_published')
        .select('id, status, created_at')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

      if (dailyError) throw new Error(`Failed to find daily published entry: ${dailyError.message}`);

      let targetDailyPublished = null;

      if (!dailyPublishedEntries || dailyPublishedEntries.length === 0) {
        const { data: newEntry, error: createError } = await supabase
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

        if (createError) throw new Error(`Failed to create draft entry: ${createError.message}`);
        targetDailyPublished = newEntry;
      } else {
        const priorityOrder = ['active', 'queued', 'expired', 'draft'];
        for (const priority of priorityOrder) {
          const entry = dailyPublishedEntries.find(e => e.status === priority);
          if (entry) {
            targetDailyPublished = entry;
            break;
          }
        }
        if (!targetDailyPublished) targetDailyPublished = dailyPublishedEntries[0];
      }

      // Update or insert SEO metadata
      const { data: updatedRows } = await supabase
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

      if (!updatedRows || updatedRows.length === 0) {
        const { data: versionData } = await supabase
          .rpc('get_next_seo_version_number', { p_daily_published_id: targetDailyPublished.id });
        const nextVersion = versionData || 1;

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
              upload_type: 'generated_from_cover',
              dimensions: `${processed.width}x${processed.height}`,
              compression_ratio: processed.compressionRatio.toFixed(2)
            }
          });

        if (insertError) throw new Error(`Failed to save SEO metadata: ${insertError.message}`);
      }

      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['library-books'] });
      
      toast.success('Thumbnail generated from cover successfully');
    } catch (error) {
      console.error('Generate thumbnail error:', error);
      toast.dismiss('generating-thumbnail');
      toast.error(error instanceof Error ? error.message : 'Failed to generate thumbnail');
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
                disabled={isUploading || isGenerating}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {currentImage ? 'Replace' : 'Upload'}
              </Button>
              {bookCover && (
                <Button
                  variant="outline"
                  onClick={handleGenerateFromCover}
                  disabled={isUploading || isGenerating}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  Generate from Cover
                </Button>
              )}
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
    </>
  );
};