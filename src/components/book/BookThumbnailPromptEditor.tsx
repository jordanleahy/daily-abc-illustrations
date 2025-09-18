/**
 * ==================================================================================
 * BOOK THUMBNAIL PROMPT EDITOR COMPONENT
 * ==================================================================================
 * 
 * BUSINESS PURPOSE:
 * Provides a specialized editing interface for book thumbnail generation prompts,
 * allowing users to review, modify, and optimize AI-generated prompts before
 * committing to expensive image generation operations.
 * 
 * KEY FEATURES:
 * - Prompt editing with syntax highlighting awareness
 * - Character count and optimization guidelines
 * - Safe space rules display
 * - Version control integration
 * - Validation before image generation
 * 
 * USER EXPERIENCE:
 * - Clear visual hierarchy
 * - Helpful guidelines and tips
 * - Real-time validation feedback
 * - Keyboard shortcuts for power users
 * ==================================================================================
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Image, Wand2, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BookThumbnailPromptEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onGenerateImage: () => Promise<void>;
  isGeneratingImage?: boolean;
  aspectRatio?: string;
}

/**
 * COMPONENT: BookThumbnailPromptEditor
 * 
 * PROPS:
 * - content: Current prompt text
 * - onContentChange: Handler for text changes
 * - onSave: Save prompt changes
 * - onCancel: Cancel editing
 * - onGenerateImage: Proceed to image generation
 * - isGeneratingImage: Loading state for image generation
 * - aspectRatio: Target aspect ratio for guidelines
 * 
 * STATE MANAGEMENT:
 * - Local saving state for UX feedback
 * - Character count tracking
 * - Validation status
 */
export const BookThumbnailPromptEditor: React.FC<BookThumbnailPromptEditorProps> = ({
  content,
  onContentChange,
  onSave,
  onCancel,
  onGenerateImage,
  isGeneratingImage = false,
  aspectRatio = '1200:630'
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  // Calculate prompt quality metrics
  const charCount = content.length;
  const wordCount = content.trim().split(/\s+/).length;
  const isOptimalLength = charCount >= 200 && charCount <= 1000;
  const hasDetailedDescription = content.toLowerCase().includes('detailed') || content.toLowerCase().includes('style');
  const hasSafeSpaceRules = content.toLowerCase().includes('safe') || content.toLowerCase().includes('margin');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Thumbnail Prompt Editor
            </CardTitle>
            <CardDescription>
              Review and edit the AI-generated prompt before creating your thumbnail
            </CardDescription>
          </div>
          <Badge variant={isOptimalLength ? 'default' : 'secondary'}>
            {charCount} characters
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Prompt Guidelines */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Optimal prompts:</strong> Include specific style details, composition notes, 
            and safe space considerations for {aspectRatio} aspect ratio. Aim for 200-1000 characters.
          </AlertDescription>
        </Alert>

        {/* Prompt Editor */}
        <div className="space-y-2">
          <Label htmlFor="prompt-content">Prompt Content</Label>
          <Textarea
            id="prompt-content"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your thumbnail generation prompt..."
            className="min-h-[120px] font-mono text-sm"
            autoFocus
          />
          
          {/* Prompt Statistics */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
            <Badge variant={isOptimalLength ? 'default' : 'outline'} className="text-xs">
              {isOptimalLength ? 'Optimal length' : 'Consider expanding'}
            </Badge>
          </div>
        </div>

        {/* Quality Indicators */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Prompt Quality</Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant={isOptimalLength ? 'default' : 'secondary'} className="text-xs">
              {isOptimalLength ? <Check className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
              Length: {isOptimalLength ? 'Good' : 'Too short'}
            </Badge>
            <Badge variant={hasDetailedDescription ? 'default' : 'secondary'} className="text-xs">
              {hasDetailedDescription ? <Check className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
              Style Details: {hasDetailedDescription ? 'Present' : 'Missing'}
            </Badge>
            <Badge variant={hasSafeSpaceRules ? 'default' : 'secondary'} className="text-xs">
              {hasSafeSpaceRules ? <Check className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
              Safe Space: {hasSafeSpaceRules ? 'Included' : 'Check rules'}
            </Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving || isGeneratingImage}
          >
            Cancel
          </Button>
          
          <Button
            variant="secondary"
            onClick={handleSave}
            disabled={!content.trim() || isSaving || isGeneratingImage}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              'Save Prompt'
            )}
          </Button>
          
          <Button
            onClick={onGenerateImage}
            disabled={!content.trim() || isSaving || isGeneratingImage || !isOptimalLength}
            className="flex items-center gap-2"
          >
            {isGeneratingImage ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generating Image...
              </>
            ) : (
              <>
                <Image className="w-4 h-4" />
                Generate Thumbnail
              </>
            )}
          </Button>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>Keyboard shortcuts: <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+S</kbd> to save, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to cancel</p>
        </div>
      </CardContent>
    </Card>
  );
};