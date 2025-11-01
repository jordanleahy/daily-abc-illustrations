import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { InstructionsTab } from './InstructionsTab';
import { ModelSettingsTab } from './ModelSettingsTab';
import { ProviderModelTab } from './ProviderModelTab';
import { AgentConfig } from '@/types/agent';

interface ConfigurationTabsProps {
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  onUpdateModelSettings: (settings: Partial<AgentConfig['modelSettings']>) => void;
  onSaveWithOverrides: (configOverrides?: Partial<AgentConfig>) => Promise<void>;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  agentType?: string;
}

export const ConfigurationTabs = ({
  config,
  onUpdate,
  onUpdateModelSettings,
  onSaveWithOverrides,
  isLoading,
  hasUnsavedChanges,
  agentType,
}: ConfigurationTabsProps) => {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Tabs defaultValue="provider" className="w-full">
          {hasUnsavedChanges && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-warning-foreground font-medium">
                ⚠️ Unsaved Changes Detected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "Save Instructions" or "Save Settings" to apply changes and see what was modified with automatic version increment.
              </p>
            </div>
          )}
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="provider">Provider & Model</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="model-settings">Advanced Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="provider" className="mt-6">
            <ProviderModelTab
              config={config}
              onUpdate={onUpdate}
            />
          </TabsContent>
          
          <TabsContent value="instructions" className="mt-6">
            <InstructionsTab
              config={config}
              onUpdate={onUpdate}
              onSaveWithOverrides={onSaveWithOverrides}
              isLoading={isLoading}
              hasUnsavedChanges={hasUnsavedChanges}
              agentType={agentType}
            />
          </TabsContent>
          
          <TabsContent value="model-settings" className="mt-6">
            <ModelSettingsTab
              config={config}
              onUpdate={onUpdateModelSettings}
              onSaveWithOverrides={onSaveWithOverrides}
              isLoading={isLoading}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};