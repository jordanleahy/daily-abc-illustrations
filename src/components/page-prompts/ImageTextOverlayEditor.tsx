import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { useTextOverlay } from '@/hooks/useTextOverlay';
import { drawTextOnCanvas, loadImageFromUrl, loadGoogleFont } from '@/utils/textOverlayProcessor';
import { 
  DEFAULT_TEXT_OVERLAY_CONFIG, 
  AVAILABLE_FONTS, 
  TEXT_OVERLAY_PRESETS,
  type TextOverlayConfig 
} from '@/types/textOverlay';

interface ImageTextOverlayEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  defaultText: string;
  pageId: string;
  bookId: string;
  userId: string;
  existingConfig?: TextOverlayConfig | null;
}

export function ImageTextOverlayEditor({
  open,
  onOpenChange,
  imageUrl,
  defaultText,
  pageId,
  bookId,
  userId,
  existingConfig,
}: ImageTextOverlayEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const [config, setConfig] = useState<TextOverlayConfig>({
    ...DEFAULT_TEXT_OVERLAY_CONFIG,
    ...existingConfig,
    text: existingConfig?.text || defaultText,
  });

  const { applyTextOverlay, removeTextOverlay, isProcessing } = useTextOverlay({ pageId, bookId, userId });

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
          <DialogTitle>Add Text Overlay</DialogTitle>
        </DialogHeader>

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
                    <Input
                      id="text"
                      value={config.text}
                      onChange={(e) => updateConfig('text', e.target.value)}
                      placeholder="Enter text..."
                      className="pr-8"
                    />
                    {config.text && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => updateConfig('text', '')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset('bold-title')}
                    >
                      Bold Title
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset('subtle-caption')}
                    >
                      Subtle Caption
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset('playful')}
                    >
                      Playful
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyPreset('minimal')}
                    >
                      Minimal
                    </Button>
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

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {existingConfig && (
            <Button 
              variant="destructive" 
              onClick={handleRemove} 
              disabled={isProcessing}
            >
              {isProcessing ? 'Removing...' : 'Remove Text from Image'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={isProcessing || !config.text.trim()}>
            {isProcessing ? 'Applying...' : 'Apply Text Overlay'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
