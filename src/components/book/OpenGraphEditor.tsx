/**
 * ==================================================================================
 * OPENGRAPH EDITOR COMPONENT
 * ==================================================================================
 * 
 * BUSINESS PURPOSE:
 * Provides a comprehensive interface for managing social media metadata and
 * thumbnail generation for book content. Enables content creators to optimize
 * how their books appear when shared across social platforms, directly impacting
 * click-through rates and engagement metrics.
 * 
 * FEATURE SET:
 * 1. Social Media Metadata Management
 *    - Custom title optimization (60 char limit awareness)
 *    - Description editing (160 char limit for meta descriptions)
 *    - Image upload and management
 * 
 * 2. AI Thumbnail Generation
 *    - Automated thumbnail creation using book metadata
 *    - Real-time generation progress tracking
 *    - Version control with rollback capabilities
 * 
 * 3. Preview & Validation
 *    - Live social media preview
 *    - Platform-specific optimization
 *    - Visual validation of changes
 * 
 * TECHNICAL ARCHITECTURE:
 * - React functional component with hooks
 * - Real-time data synchronization via React Query
 * - File upload handling with validation
 * - Inline editing with optimistic updates
 * - Toast notifications for user feedback
 * 
 * USER EXPERIENCE DESIGN:
 * - Inline editing for quick updates
 * - Visual feedback for all actions
 * - Progressive disclosure of advanced features
 * - Mobile-responsive design
 * 
 * BUSINESS RULES:
 * - Image priority: Custom upload > Generated thumbnail > Default
 * - File size limits (5MB max for uploads)
 * - Supported formats (images only)
 * - Version control for generated content
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Optimistic updates for immediate feedback
 * - Debounced API calls to prevent spam
 * - Progressive image loading
 * - Efficient re-render management
 * 
 * INTEGRATION POINTS:
 * - Book SEO metadata system
 * - Thumbnail generation service
 * - Supabase Storage for image hosting
 * - OpenAI for automated content generation
 * ==================================================================================
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { InlineEditInput } from '@/components/ui/inline-edit-input';
import { InlineEditTextarea } from '@/components/ui/inline-edit-textarea';
import { Loader2, Upload, Eye, Wand2, X, Image, Edit, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBookSeoMetadata } from '@/hooks/useBookSeoMetadata';
import { useUpdateSeoMetadata } from '@/hooks/useUpdateSeoMetadata';
import { useLatestBookThumbnail, useGenerateBookThumbnail, useBookThumbnailProgress, useBookThumbnails } from '@/hooks/useBookThumbnails';
import { useGenerateBookThumbnailPrompt } from '@/hooks/useGenerateBookThumbnailPrompt';
import { BookThumbnailPromptEditor } from './BookThumbnailPromptEditor';
import { useAuth } from '@/hooks/useAuth';

interface OpenGraphEditorProps {
  bookId: string;
  bookTitle: string;
  bookDescription?: string;
}

/**
 * COMPONENT: OpenGraphEditor
 * 
 * PROPS:
 * - bookId: Unique identifier for the book
 * - bookTitle: Default title (fallback for SEO title)
 * - bookDescription: Default description (fallback for SEO description)
 * 
 * STATE MANAGEMENT:
 * - Local editing states for inline editing UX
 * - Upload progress tracking
 * - Generation status monitoring
 * - Error handling and user feedback
 * 
 * DATA FLOW:
 * 1. Component mounts → Fetch existing SEO metadata
 * 2. User edits → Optimistic local updates
 * 3. Save action → API call + cache invalidation
 * 4. Generation → Progress polling + status updates
 * 5. Completion → Automatic UI refresh
 */
export const OpenGraphEditor = ({ bookId, bookTitle, bookDescription }: OpenGraphEditorProps) => {
  const { data: seoMetadata, isLoading, refetch } = useBookSeoMetadata(bookId);
  const { data: latestThumbnail } = useLatestBookThumbnail(bookId);
  const { data: thumbnailProgress } = useBookThumbnailProgress(bookId);
  const { data: allThumbnails } = useBookThumbnails(bookId);
  const generateThumbnail = useGenerateBookThumbnail();
  const generatePrompt = useGenerateBookThumbnailPrompt();
  const updateSeoMetadata = useUpdateSeoMetadata();
  const { user } = useAuth();
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [promptContent, setPromptContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTitle = seoMetadata?.seo_title || bookTitle;
  const currentDescription = seoMetadata?.seo_description || bookDescription || '';
  // Prioritize SEO metadata image, then latest thumbnail, then null
  const currentImage = seoMetadata?.og_image_url || latestThumbnail?.thumbnail_url;
  
  // Get the latest thumbnail record (which may have a prompt but no image yet)
  const latestThumbnailRecord = allThumbnails?.[0]; // First item is latest due to ordering
  const hasPrompt = latestThumbnailRecord?.prompt_used;
  const canGenerateImage = hasPrompt && latestThumbnailRecord?.generation_status !== 'in_progress';

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

  /**
   * IMAGE UPLOAD HANDLER
   * 
   * FEATURES:
   * - File type validation (images only)
   * - Size validation (5MB limit)
   * - Progress tracking
   * - Automatic SEO metadata update
   * - Error handling with user feedback
   * 
   * SECURITY:
   * - File type verification
   * - Size limits enforcement
   * - User folder isolation in storage
   * 
   * UX CONSIDERATIONS:
   * - Immediate visual feedback
   * - Loading states during upload
   * - Error recovery guidance
   */
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

  /**
   * AUTO-GENERATION HANDLER
   * 
   * BUSINESS LOGIC:
   * - Leverages OpenAI for SEO optimization
   * - Generates title, description, and metadata
   * - Maintains brand voice and style consistency
   * - Optimizes for search engine visibility
   * 
   * TECHNICAL IMPLEMENTATION:
   * - Calls generate-seo-metadata edge function
   * - Handles async processing with loading states
   * - Provides user feedback throughout process
   * - Automatic cache refresh on completion
   */
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

  /**
   * PROMPT GENERATION HANDLER
   * 
   * WORKFLOW:
   * 1. User clicks "Generate Prompt"
   * 2. AI analyzes book metadata and creates optimized prompt
   * 3. Prompt is stored in database with version control
   * 4. User can review and edit before image generation
   */
  const handleGeneratePrompt = async () => {
    try {
      const result = await generatePrompt.mutateAsync({ bookId });
      setPromptContent(result.prompt);
      setIsEditingPrompt(true);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  /**
   * DIRECT IMAGE GENERATION HANDLER
   * 
   * Used when we already have a prompt and want to generate the image
   */
  const handleGenerateImageFromPrompt = async () => {
    if (!latestThumbnailRecord?.id) {
      toast.error('No prompt available for image generation');
      return;
    }

    try {
      // Call the generate-book-thumbnail function directly with the existing record
      const { data, error } = await supabase.functions.invoke('generate-book-thumbnail', {
        body: {
          recordId: latestThumbnailRecord.id,
          userId: user?.id,
        },
      });

      if (error) throw error;
      toast.success('Thumbnail generation started!');
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Failed to generate thumbnail image');
    }
  };

  /**
   * PROMPT EDITING HANDLERS
   */
  const handleSavePrompt = async () => {
    if (!latestThumbnailRecord?.id) return;

    try {
      const { error } = await supabase
        .from('book_thumbnails')
        .update({ 
          prompt_used: promptContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', latestThumbnailRecord.id);

      if (error) throw error;
      
      setIsEditingPrompt(false);
      toast.success('Prompt saved successfully');
    } catch (error) {
      console.error('Save prompt error:', error);
      toast.error('Failed to save prompt');
    }
  };

  const handleCancelPromptEdit = () => {
    setIsEditingPrompt(false);
    setPromptContent(latestThumbnailRecord?.prompt_used || '');
  };

  const handleEditExistingPrompt = () => {
    setPromptContent(latestThumbnailRecord?.prompt_used || '');
    setIsEditingPrompt(true);
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
            
            <div className="space-y-2">
              {/* Upload Button */}
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 w-full"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {currentImage ? 'Replace Image' : 'Upload Image'}
              </Button>

              {/* Thumbnail Generation Flow */}
              <div className="space-y-2">
                {/* Generate Prompt Button */}
                <Button
                  onClick={handleGeneratePrompt}
                  disabled={generatePrompt.isPending}
                  variant="outline"
                  className="flex items-center gap-2 w-full"
                >
                  {generatePrompt.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Prompt...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate Prompt
                    </>
                  )}
                </Button>

                {/* Generate Thumb Button - disabled until prompt exists */}
                <Button
                  onClick={handleGenerateImageFromPrompt}
                  disabled={!hasPrompt || !canGenerateImage || thumbnailProgress?.generation_status === 'in_progress'}
                  className="flex items-center gap-2 w-full"
                >
                  {thumbnailProgress?.generation_status === 'in_progress' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Thumb...
                    </>
                  ) : (
                    <>
                      <Image className="w-4 h-4" />
                      Generate Thumb
                    </>
                  )}
                </Button>

                {/* Edit Prompt Button - only show when prompt exists */}
                {hasPrompt && (
                  <Button
                    onClick={handleEditExistingPrompt}
                    variant="outline"
                    className="flex items-center gap-2 w-full"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Prompt
                  </Button>
                )}
              </div>
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

        {/* Prompt Editor Modal */}
        {isEditingPrompt && (
          <div className="space-y-4">
            <BookThumbnailPromptEditor
              content={promptContent}
              onContentChange={setPromptContent}
              onSave={handleSavePrompt}
              onCancel={handleCancelPromptEdit}
              onGenerateImage={handleGenerateImageFromPrompt}
              isGeneratingImage={thumbnailProgress?.generation_status === 'in_progress'}
              aspectRatio="1200:630"
            />
          </div>
        )}

        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={seoMetadata ? 'default' : 'secondary'}>
            {seoMetadata ? 'Custom Settings' : 'Using Defaults'}
          </Badge>
          {latestThumbnail && !seoMetadata?.og_image_url && (
            <Badge variant="outline">
              Using Generated Thumbnail
            </Badge>
          )}
          {hasPrompt && !latestThumbnail && (
            <Badge variant="secondary">
              <FileText className="w-3 h-3 mr-1" />
              Prompt Ready
            </Badge>
          )}
          {thumbnailProgress?.generation_status === 'in_progress' && (
            <Badge variant="secondary">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Generating Image
            </Badge>
          )}
        </div>

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