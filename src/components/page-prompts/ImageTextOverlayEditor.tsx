import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Download, Info } from 'lucide-react';
import { useTextOverlay } from '@/hooks/useTextOverlay';
import { useBookThumbnailTextOverlay } from '@/hooks/useBookThumbnailTextOverlay';
import { drawTextOnCanvas, loadImageFromUrl, loadGoogleFont } from '@/utils/textOverlayProcessor';
import { toast } from 'sonner';
import { 
  DEFAULT_TEXT_OVERLAY_CONFIG, 
  AVAILABLE_FONTS, 
  TEXT_OVERLAY_PRESETS,
  type TextOverlayConfig 
} from '@/types/textOverlay';
import { ModalProps } from '@/types/shared';

type EditorMode = 'page' | 'thumbnail';

interface ImageTextOverlayEditorProps extends ModalProps {
  imageUrl: string;
  defaultText: string;
  mode?: EditorMode;
  // For page mode
  pageId?: string;
  bookId: string;
  userId: string;
  // For thumbnail mode
  dailyPublishedId?: string;
  seoMetadataId?: string;
  existingConfig?: TextOverlayConfig | null;
}

export function ImageTextOverlayEditor({
  open,
  onOpenChange,
  imageUrl,
  defaultText,
  mode = 'page',
  pageId,
  bookId,
  userId,
  dailyPublishedId,
  seoMetadataId,
  existingConfig,
}: ImageTextOverlayEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const [config, setConfig] = useState<TextOverlayConfig>({
    ...DEFAULT_TEXT_OVERLAY_CONFIG,
    ...existingConfig,
    text: existingConfig?.text || defaultText,
  });

  // Use appropriate hook based on mode
  const pageOverlay = useTextOverlay({
    pageId: pageId || '',
    bookId,
    userId,
  });

  const thumbnailOverlay = useBookThumbnailTextOverlay({
    bookId,
    dailyPublishedId: dailyPublishedId || '',
    seoMetadataId: seoMetadataId || '',
    userId,
  });

  const { applyTextOverlay, removeTextOverlay, isProcessing } = 
    mode === 'page' ? pageOverlay : thumbnailOverlay;

  // Reload existing config when dialog opens
  useEffect(() => {
    if (open) {
      setConfig({
        ...DEFAULT_TEXT_OVERLAY_CONFIG,
        ...existingConfig,
        text: existingConfig?.text || defaultText,
      });
    }
  }, [open, existingConfig, defaultText]);

  const updatePreview = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const image = imageRef.current;
    
    // Set canvas dimensions to match image
    canvas.width = image.width;
    canvas.height = image.height;

    // Load Google Font if needed
    const systemFonts = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier', 'Verdana'];
    if (!systemFonts.includes(config.fontFamily)) {
      await loadGoogleFont(config.fontFamily);
    }

    drawTextOnCanvas(canvas, image, config);
  }, [config]);

  // Load image when dialog opens
  useEffect(() => {
    if (open && imageUrl) {
      loadImageFromUrl(imageUrl).then((img) => {
        imageRef.current = img;
        if (canvasRef.current) {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          updatePreview();
        }
      });
    }
  }, [open, imageUrl, updatePreview]);

  // Update preview whenever config changes
  useEffect(() => {
    if (open && imageRef.current) {
      updatePreview();
    }
  }, [open, updatePreview]);

  const handleApplyPreset = (presetKey: string) => {
    setConfig((prev) => ({
      ...prev,
      ...TEXT_OVERLAY_PRESETS[presetKey],
    }));
  };

  const handleSave = () => {
    applyTextOverlay({ imageUrl, config });
    onOpenChange(false);
  };

  const handleRemove = () => {
    removeTextOverlay();
    onOpenChange(false);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    try {
      // Convert canvas to blob and download
      canvasRef.current.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate preview image');
          return;
        }
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = mode === 'thumbnail' 
          ? 'thumbnail-preview.png' 
          : `page-${pageId}-preview.png`;
        link.download = filename;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Preview downloaded successfully');
      }, 'image/png');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download preview');
    }
  };

  const updateConfig = <K extends keyof TextOverlayConfig>(
    key: K,
    value: TextOverlayConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingConfig ? 'Edit Text Overlay' : 'Add Text Overlay'}
          </DialogTitle>
        </DialogHeader>
        
        <Alert className="mb-2">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> Customize text and styling, then click <strong>"{existingConfig ? 'Update' : 'Apply'} Overlay"</strong> to save changes to the database. 
            Use <strong>"Download Preview"</strong> to save the preview locally without affecting the database.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg overflow-hidden bg-muted aspect-square">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text">Text</TabsTrigger>
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="position">Position</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="text">Text</Label>
                  <div className="relative">
                    <Textarea
                      id="text"
                      value={config.text}
                      onChange={(e) => updateConfig('text', e.target.value)}
                      placeholder="Enter text... (Press Enter for new line)"
                      className="min-h-[80px] pr-8 resize-y"
                      rows={3}
                    />
                    {config.text && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-6 w-6 p-0"
                        onClick={() => updateConfig('text', '')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Press Enter to create line breaks
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(TEXT_OVERLAY_PRESETS)
                      .filter(presetName => {
                        // Hide thumbnail-title in page mode
                        if (mode === 'page' && presetName === 'thumbnail-title') return false;
                        return true;
                      })
                      .sort((a, b) => {
                        // Show thumbnail-title first for thumbnail mode
                        if (mode === 'thumbnail' && a === 'thumbnail-title') return -1;
                        if (mode === 'thumbnail' && b === 'thumbnail-title') return 1;
                        return 0;
                      })
                      .map((presetName) => (
                        <Button
                          key={presetName}
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyPreset(presetName)}
                        >
                          {presetName.split('-').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </Button>
                      ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="style" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select
                    value={config.fontFamily}
                    onValueChange={(value) => updateConfig('fontFamily', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_FONTS.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Size: {config.fontSize}px</Label>
                  <Slider
                    value={[config.fontSize]}
                    onValueChange={([value]) => updateConfig('fontSize', value)}
                    min={12}
                    max={200}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Font Weight</Label>
                  <Select
                    value={config.fontWeight}
                    onValueChange={(value: any) => updateConfig('fontWeight', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="600">Semi-Bold</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="800">Extra Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color">Text Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={config.color}
                      onChange={(e) => updateConfig('color', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strokeColor">Stroke Color</Label>
                    <Input
                      id="strokeColor"
                      type="color"
                      value={config.strokeColor}
                      onChange={(e) => updateConfig('strokeColor', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Stroke Width: {config.strokeWidth}px</Label>
                  <Slider
                    value={[config.strokeWidth]}
                    onValueChange={([value]) => updateConfig('strokeWidth', value)}
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Shadow Blur: {config.shadowBlur}px</Label>
                  <Slider
                    value={[config.shadowBlur]}
                    onValueChange={([value]) => updateConfig('shadowBlur', value)}
                    min={0}
                    max={30}
                    step={1}
                  />
                </div>

                {/* Arc Effect Section */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Arc Effect</Label>
                      <p className="text-xs text-muted-foreground">Curve text along an arc</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Arc works best with short, single-line text
                      </p>
                    </div>
                    <Switch
                      checked={config.arcEnabled}
                      onCheckedChange={(checked) => updateConfig('arcEnabled', checked)}
                    />
                  </div>

                  {config.arcEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Arc Direction</Label>
                        <Select
                          value={config.arcDirection || 'down'}
                          onValueChange={(value: 'up' | 'down') => updateConfig('arcDirection', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="down">Down (Smile ⌣)</SelectItem>
                            <SelectItem value="up">Up (Frown ⌢)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Arc Intensity: {config.arcIntensity}</Label>
                        <Slider
                          value={[config.arcIntensity || 50]}
                          onValueChange={([value]) => updateConfig('arcIntensity', value)}
                          min={0}
                          max={100}
                          step={5}
                        />
                        <p className="text-xs text-muted-foreground">
                          Lower = gentle curve, Higher = tight curve
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Character Spacing: {(config.arcCharacterSpacing || 1.1).toFixed(1)}x</Label>
                        <Slider
                          value={[config.arcCharacterSpacing || 1.1]}
                          onValueChange={([value]) => updateConfig('arcCharacterSpacing', value)}
                          min={0.8}
                          max={1.5}
                          step={0.05}
                        />
                        <p className="text-xs text-muted-foreground">
                          Adjust spacing between curved characters
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="position" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={config.position}
                    onValueChange={(value: any) => updateConfig('position', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.position === 'custom' && (
                  <div className="space-y-2">
                    <Label>Y Offset: {config.yOffset}%</Label>
                    <Slider
                      value={[config.yOffset]}
                      onValueChange={([value]) => updateConfig('yOffset', value)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Alignment</Label>
                  <Select
                    value={config.align}
                    onValueChange={(value: any) => updateConfig('align', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="backgroundOverlay"
                      checked={config.backgroundOverlay}
                      onChange={(e) => updateConfig('backgroundOverlay', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="backgroundOverlay">Background Overlay</Label>
                  </div>
                </div>

                {config.backgroundOverlay && (
                  <div className="space-y-2">
                    <Label>Overlay Opacity: {Math.round(config.backgroundOpacity * 100)}%</Label>
                    <Slider
                      value={[config.backgroundOpacity * 100]}
                      onValueChange={([value]) => updateConfig('backgroundOpacity', value / 100)}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1 justify-start">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownload} 
              disabled={!config.text.trim()}
              className="gap-2"
              title="Download preview as PNG (does not save to database)"
            >
              <Download className="w-4 h-4" />
              Download Preview
            </Button>
          </div>
          <div className="flex gap-2 justify-end">
            {existingConfig && (
              <Button 
                variant="destructive" 
                onClick={handleRemove} 
                disabled={isProcessing}
                title="Remove text overlay and restore the original image in the database"
              >
                {isProcessing ? 'Removing...' : 'Remove Overlay'}
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={isProcessing || !config.text.trim()}
              title="Save this text overlay to the database"
            >
              {isProcessing ? 'Saving...' : existingConfig ? 'Update Overlay' : 'Apply Overlay'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
