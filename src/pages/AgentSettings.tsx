import { useNavigate } from 'react-router-dom';
import { StandardPageLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgeGroupsManager } from '@/components/agents/AgeGroupsManager';
import { CharacterThemesManager } from '@/components/agents/CharacterThemesManager';
import { QuestionsRegistryManager } from '@/components/agents/QuestionsRegistryManager';
import { AgentDocumentation } from '@/components/agents/AgentDocumentation';
import { ArrowLeft, Users, Sparkles, HelpCircle, FileText } from 'lucide-react';

const AgentSettings = () => {
  const navigate = useNavigate();

  return (
    <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/agents')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Shared Settings</h1>
            <p className="text-muted-foreground text-sm">
              Configure age groups, themes, questions, and view documentation
            </p>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="ages" className="w-full">
          <TabsList className="w-full max-w-xl">
            <TabsTrigger value="ages" className="flex items-center gap-1.5 flex-1">
              <Users className="h-4 w-4" />
              Ages
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center gap-1.5 flex-1">
              <Sparkles className="h-4 w-4" />
              Themes
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-1.5 flex-1">
              <HelpCircle className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-1.5 flex-1">
              <FileText className="h-4 w-4" />
              Docs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ages" className="mt-6">
            <AgeGroupsManager />
          </TabsContent>

          <TabsContent value="themes" className="mt-6">
            <CharacterThemesManager />
          </TabsContent>

          <TabsContent value="questions" className="mt-6">
            <QuestionsRegistryManager />
          </TabsContent>

          <TabsContent value="docs" className="mt-6">
            <AgentDocumentation />
          </TabsContent>
        </Tabs>
      </div>
    </StandardPageLayout>
  );
};

export default AgentSettings;
