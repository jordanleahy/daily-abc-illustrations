import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Save, X, RefreshCw, Image } from "lucide-react";
import { usePageSimplifiedPrompt } from "@/hooks/usePageSimplifiedPrompt";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface SimplifiedPromptTabProps {
  pageId: string;
  pageTitle?: string;
  bookId: string;
}

export function SimplifiedPromptTab({ pageId, pageTitle, bookId }: SimplifiedPromptTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const {
    currentPrompt,
    isLoading,
    isEditing,
    editedContent,
    isGenerating,
    isSaving,
    startEdit,
    cancelEdit,
    saveEdit,
    generateSimplifiedPrompt,
    updateEditedContent,
  } = usePageSimplifiedPrompt(pageId);

  const handleGenerateImage = async () => {
    if (!user || !currentPrompt?.simplified_content) {
      toast({
        title: "Error",
        description: !user ? "Please log in to generate images" : "No simplified prompt available",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingImage(true);

      // Get the next version number for this page's images
      const { data: existingImages, error: fetchError } = await supabase
        .from('page_image_urls')
        .select('version_number')
        .eq('page_id', pageId)
        .order('version_number', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const nextVersion = existingImages && existingImages.length > 0 
        ? existingImages[0].version_number + 1 
        : 1;

      // Create a new page_image_urls record with the simplified prompt
      const { data: newImageRecord, error: createError } = await supabase
        .from('page_image_urls')
        .insert({
          page_id: pageId,
          book_id: bookId,
          user_id: user.id,
          version_number: nextVersion,
          is_latest: true,
          generation_status: 'not_started',
          prompt_used: currentPrompt.simplified_content // Use the simplified prompt instead
        })
        .select()
        .single();

      if (createError) throw createError;

      // Get current session for auth
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes.session?.access_token;

      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in again to generate images",
          variant: "destructive",
        });
        setIsGeneratingImage(false);
        return;
      }

      // Call generate-image with the record ID
      const { error: generateError } = await supabase.functions.invoke('generate-image', {
        body: {
          recordId: newImageRecord.id,
          userId: user.id,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (generateError) throw generateError;

      toast({
        title: "Success",
        description: "Image generation started using simplified prompt",
      });

    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to generate image with simplified prompt",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Simplified Image Prompt
          {pageTitle && <span className="text-sm text-muted-foreground">for {pageTitle}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentPrompt ? (
          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => updateEditedContent(e.target.value)}
                    className="min-h-[120px] resize-none"
                    placeholder="Enter your simplified image prompt..."
                  />
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">
                      {editedContent.length} characters
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        disabled={isSaving || !editedContent.trim()}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">
                    {currentPrompt.simplified_content}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      Version {currentPrompt.version_number}
                    </Badge>
                    <Badge variant="outline">
                      {currentPrompt.simplified_content.length} characters
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateSimplifiedPrompt}
                      disabled={isGenerating}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                      {isGenerating ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startEdit}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage}
                      className="bg-gradient-to-r from-primary to-primary/80"
                    >
                      <Image className={`h-4 w-4 mr-1 ${isGeneratingImage ? 'animate-pulse' : ''}`} />
                      {isGeneratingImage ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No simplified prompt yet</p>
              <p className="text-sm">
                Generate a focused image prompt optimized for AI image generation
              </p>
            </div>
            <Button
              onClick={generateSimplifiedPrompt}
              disabled={isGenerating}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              <Sparkles className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Call Simplify Image'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}