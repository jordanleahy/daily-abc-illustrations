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