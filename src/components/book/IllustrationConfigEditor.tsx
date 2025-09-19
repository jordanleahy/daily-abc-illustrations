import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, X, Palette, Layout, Eye } from 'lucide-react';
import { IllustrationConfigEditorProps, IllustrationConfig } from '@/types/illustrationConfig';
import { transformConfigToContent } from '@/utils/configTransformer';

export function IllustrationConfigEditor({
  config,
  onConfigChange,
  onSave,
  onCancel
}: IllustrationConfigEditorProps) {
  const [editedConfig, setEditedConfig] = useState<IllustrationConfig>(config);
  const [activeTab, setActiveTab] = useState<'basic' | 'colors' | 'visual' | 'preview'>('basic');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onConfigChange(editedConfig);
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (path: string, value: any) => {
    const pathArray = path.split('.');
    const newConfig = { ...editedConfig };
    let current: any = newConfig;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;
    
    setEditedConfig(newConfig);
  };

  const previewContent = transformConfigToContent(editedConfig);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Edit Illustration Configuration
        </CardTitle>
        <Badge variant="secondary">{editedConfig.configVersion}</Badge>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="colors">
              <Palette className="h-4 w-4 mr-1" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="visual">
              <Layout className="h-4 w-4 mr-1" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={editedConfig.metadata.category}
                  onChange={(e) => updateConfig('metadata.category', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Input
                  id="theme"
                  value={editedConfig.metadata.theme}
                  onChange={(e) => updateConfig('metadata.theme', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                value={editedConfig.metadata.audience}
                onChange={(e) => updateConfig('metadata.audience', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="artStyle">Art Style</Label>
              <Input
                id="artStyle"
                value={editedConfig.styleRequirements.artStyle}
                onChange={(e) => updateConfig('styleRequirements.artStyle', e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4">
            {Object.entries(editedConfig.colorPalette).map(([colorKey, colorData]) => (
              <div key={colorKey} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: colorData.hex }}
                  />
                  <Label className="font-medium capitalize">{colorKey}</Label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`${colorKey}-hex`}>Hex</Label>
                    <Input
                      id={`${colorKey}-hex`}
                      value={colorData.hex}
                      onChange={(e) => updateConfig(`colorPalette.${colorKey}.hex`, e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${colorKey}-hsl`}>HSL</Label>
                    <Input
                      id={`${colorKey}-hsl`}
                      value={colorData.hsl}
                      onChange={(e) => updateConfig(`colorPalette.${colorKey}.hsl`, e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Label htmlFor={`${colorKey}-usage`}>Usage</Label>
                  <Textarea
                    id={`${colorKey}-usage`}
                    value={colorData.usage}
                    onChange={(e) => updateConfig(`colorPalette.${colorKey}.usage`, e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="visual" className="space-y-4">
            <div>
              <Label htmlFor="layoutFlow">Layout Flow</Label>
              <Input
                id="layoutFlow"
                value={editedConfig.compositionGuidelines.layoutFlow}
                onChange={(e) => updateConfig('compositionGuidelines.layoutFlow', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="spacingRules">Spacing Rules</Label>
              <Textarea
                id="spacingRules"
                value={editedConfig.compositionGuidelines.spacingRules}
                onChange={(e) => updateConfig('compositionGuidelines.spacingRules', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="balanceStrategy">Balance Strategy</Label>
              <Textarea
                id="balanceStrategy"
                value={editedConfig.compositionGuidelines.balanceStrategy}
                onChange={(e) => updateConfig('compositionGuidelines.balanceStrategy', e.target.value)}
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {previewContent}
              </pre>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}