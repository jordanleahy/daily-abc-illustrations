import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuestions, useAgentQuestions, useToggleAgentQuestion, useInitializeAgentQuestions, useReorderAgentQuestion } from '@/hooks/useQuestions';
import { HelpCircle, Database, MapPin, Palette, GraduationCap, Users, Type, ChevronUp, ChevronDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AgentQuestionsManagerProps {
  agentType: string;
  agentName?: string;
  /** When true, renders without the Card wrapper for embedding in other components */
  embedded?: boolean;
}

const questionIcons: Record<string, React.ReactNode> = {
  city: <MapPin className="h-4 w-4" />,
  character_theme: <Palette className="h-4 w-4" />,
  grade_level: <GraduationCap className="h-4 w-4" />,
  age_group: <Users className="h-4 w-4" />,
  letter_case: <Type className="h-4 w-4" />,
};

export function AgentQuestionsManager({ agentType, agentName, embedded = false }: AgentQuestionsManagerProps) {
  const { data: allQuestions, isLoading: questionsLoading } = useQuestions();
  const { data: agentQuestions, isLoading: agentQuestionsLoading } = useAgentQuestions(agentType);
  const toggleMutation = useToggleAgentQuestion();
  const initializeMutation = useInitializeAgentQuestions();
  const reorderMutation = useReorderAgentQuestion();

  // Initialize mappings when component loads
  useEffect(() => {
    if (agentType && allQuestions && allQuestions.length > 0 && !agentQuestionsLoading) {
      initializeMutation.mutate(agentType);
    }
  }, [agentType, allQuestions?.length, agentQuestionsLoading]);

  const isLoading = questionsLoading || agentQuestionsLoading;

  // Build sorted list using agent_questions order, falling back to question order
  const sortedQuestions = (agentQuestions || [])
    .map(aq => ({
      ...aq.question,
      agentQuestionId: aq.id,
      isEnabled: aq.is_enabled,
      agentSortOrder: aq.sort_order,
    }))
    .sort((a, b) => (a.agentSortOrder ?? 0) - (b.agentSortOrder ?? 0));

  const handleToggle = (questionId: string, currentEnabled: boolean) => {
    toggleMutation.mutate({
      agentType,
      questionId,
      isEnabled: !currentEnabled,
    });
  };

  const handleReorder = (questionId: string, direction: 'up' | 'down') => {
    reorderMutation.mutate({
      agentType,
      questionId,
      direction,
    });
  };

  if (isLoading) {
    if (embedded) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      );
    }
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const questionsList = (
    <div className="space-y-3">
      {sortedQuestions.map((question, index) => {
        const isPending = toggleMutation.isPending && 
          toggleMutation.variables?.questionId === question.id;
        const isReordering = reorderMutation.isPending &&
          reorderMutation.variables?.questionId === question.id;
        const isFirst = index === 0;
        const isLast = index === sortedQuestions.length - 1;

        return (
          <div
            key={question.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
          >
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5 mr-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={isFirst || isReordering}
                onClick={() => handleReorder(question.id, 'up')}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={isLast || isReordering}
                onClick={() => handleReorder(question.id, 'down')}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                {questionIcons[question.id] || <HelpCircle className="h-4 w-4" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{question.label}</span>
                  {question.options_table && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="text-xs gap-1">
                            <Database className="h-3 w-3" />
                            {question.options_table}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          Options loaded from {question.options_table} table
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                {question.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {question.description}
                  </p>
                )}
                <code className="text-xs text-muted-foreground/70 font-mono">
                  {question.placeholder_key}
                </code>
              </div>
            </div>
            <Switch
              checked={question.isEnabled}
              onCheckedChange={() => handleToggle(question.id, question.isEnabled)}
              disabled={isPending}
              aria-label={`Toggle ${question.label}`}
            />
          </div>
        );
      })}

      {sortedQuestions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No questions configured in the registry.
        </div>
      )}
    </div>
  );

  // Embedded mode - just render the list
  if (embedded) {
    return questionsList;
  }

  // Full card mode
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Questions for {agentName || agentType}
        </CardTitle>
        <CardDescription>
          Enable or disable discovery questions for this agent. Enabled questions will be presented to users during book creation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {questionsList}
      </CardContent>
    </Card>
  );
}
