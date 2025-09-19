import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Save, X, RefreshCw } from "lucide-react";
import { usePageSimplifiedPrompt } from "@/hooks/usePageSimplifiedPrompt";

interface SimplifiedPromptTabProps {
  pageId: string;
  pageTitle?: string;
}

export function SimplifiedPromptTab({ pageId, pageTitle }: SimplifiedPromptTabProps) {
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