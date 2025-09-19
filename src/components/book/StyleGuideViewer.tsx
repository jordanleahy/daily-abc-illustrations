/**
 * Component for displaying JSON-structured style guides with visual formatting
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStyleGuideJSON } from '@/hooks/useStyleGuideJSON';
import { Palette, Eye, Layout, Lightbulb } from 'lucide-react';

interface StyleGuideViewerProps {
  styleGuideContent?: string;
  className?: string;
}

export function StyleGuideViewer({ styleGuideContent, className }: StyleGuideViewerProps) {
  const { isValid, data: styleGuide, error, isJSON, fallbackContent } = useStyleGuideJSON({ 
    styleGuideContent 
  });

  // Handle non-JSON legacy format
  if (!isJSON && fallbackContent) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Style Guide (Legacy Format)
          </CardTitle>
          <Badge variant="secondary">Text Format</Badge>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg overflow-auto">
            {fallbackContent}
          </pre>
        </CardContent>
      </Card>
    );
  }

  // Handle errors
  if (!isValid || !styleGuide) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Eye className="w-5 h-5" />
            Style Guide Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{error}</p>
          {fallbackContent && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">View Raw Content</summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs font-mono bg-muted p-3 rounded max-h-48 overflow-auto">
                {fallbackContent}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Style Guide Overview
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="default">{styleGuide.metadata.category}</Badge>
            <Badge variant="secondary">{styleGuide.metadata.theme}</Badge>
            <Badge variant="outline">{styleGuide.metadata.version}</Badge>
            <Badge variant="outline">{styleGuide.metadata.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Audience</h4>
              <p className="text-muted-foreground">{styleGuide.metadata.audience}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Style Tags</h4>
              <div className="flex gap-1 flex-wrap">
                {styleGuide.metadata.styleTags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Color Palette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(styleGuide.colorPalette).map(([colorName, colorData]) => {
              const color = colorData as { hex: string; hsl: string; usage: string };
              return (
                <div key={colorName} className="border rounded-lg p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-8 h-8 rounded-md border-2 border-border"
                      style={{ backgroundColor: color.hex }}
                      title={color.hex}
                    />
                    <div>
                      <h5 className="font-medium capitalize">{colorName}</h5>
                      <p className="text-xs text-muted-foreground">{color.hex}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{color.usage}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Visual Elements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Visual Elements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Foreground Elements</h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Required: </span>
                {styleGuide.visualElements.foregroundElements.required.map((item, idx) => (
                  <Badge key={idx} variant="default" className="mr-1 mb-1 text-xs">{item}</Badge>
                ))}
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Optional: </span>
                {styleGuide.visualElements.foregroundElements.optional.map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="mr-1 mb-1 text-xs">{item}</Badge>
                ))}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Background Foundation</h4>
            <p className="text-sm text-muted-foreground mb-2">{styleGuide.visualElements.backgroundFoundation.setting}</p>
            <div className="text-sm">
              <strong>Whitespace:</strong> {styleGuide.visualElements.backgroundFoundation.whitespace}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Style Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Style Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Art Style</h4>
            <p className="text-sm text-muted-foreground">{styleGuide.styleRequirements.artStyle}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Tone</h4>
              <Badge variant="outline" className="capitalize">{styleGuide.styleRequirements.tone}</Badge>
            </div>
            <div>
              <h4 className="font-medium mb-2">Layout Flow</h4>
              <Badge variant="outline" className="capitalize">{styleGuide.compositionGuidelines.layoutFlow}</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Technical Specifications</h4>
            <div className="flex gap-2 text-sm">
              <Badge variant="secondary">{styleGuide.styleRequirements.technicalSpecs.aspectRatio}</Badge>
              <Badge variant="secondary">{styleGuide.styleRequirements.technicalSpecs.resolution}</Badge>
              <Badge variant="secondary">{styleGuide.styleRequirements.technicalSpecs.format}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Metaphors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Visual Metaphors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(styleGuide.visualMetaphors).map(([key, metaphor]) => {
              const meta = metaphor as { concept: string; visualRepresentation: string; implementation: string };
              return (
                <div key={key} className="border rounded-lg p-3">
                  <h5 className="font-medium mb-1">{meta.concept}</h5>
                  <p className="text-sm text-muted-foreground mb-2">{meta.visualRepresentation}</p>
                  <p className="text-xs text-muted-foreground italic">{meta.implementation}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}