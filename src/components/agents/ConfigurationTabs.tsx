import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { InstructionsTab } from './InstructionsTab';
import { ModelSettingsTab } from './ModelSettingsTab';
import { AgentConfig } from '@/types/agent';

interface ConfigurationTabsProps {
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  onUpdateModelSettings: (settings: Partial<AgentConfig['modelSettings']>) => void;
  onSave: () => void;
  onSaveWithOverrides: (configOverrides?: Partial<AgentConfig>) => Promise<void>;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
}

export const ConfigurationTabs = ({
  config,
  onUpdate,
  onUpdateModelSettings,
  onSave,
  onSaveWithOverrides,
  isLoading,
  hasUnsavedChanges,
}: ConfigurationTabsProps) => {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Tabs defaultValue="instructions" className="w-full">
          {hasUnsavedChanges && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 dark:bg-yellow-950/20 dark:border-yellow-800/30">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                ⚠️ Unsaved Changes Detected
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Click "Save Instructions" to apply changes and see what was modified with automatic version increment.
              </p>
            </div>
          )}
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="model-settings">Model Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="instructions" className="mt-6">
            <InstructionsTab
              config={config}
              onUpdate={onUpdate}
              onSave={onSave}
              onSaveWithOverrides={onSaveWithOverrides}
              isLoading={isLoading}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </TabsContent>
          
          <TabsContent value="model-settings" className="mt-6">
            <ModelSettingsTab
              config={config}
              onUpdate={onUpdateModelSettings}
              onSave={onSave}
              isLoading={isLoading}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};