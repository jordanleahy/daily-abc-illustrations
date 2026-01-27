import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, HelpCircle, Check, X, Database } from 'lucide-react';
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { OptionManagerFactory } from '@/components/questions/OptionManagerFactory';
import { StaticOptionManager } from '@/components/questions/StaticOptionManager';
import { useQuestionsSubscription } from '@/hooks/useQuestionsSubscription';
import type { Question, StaticOption } from '@/hooks/useQuestions';

const QuestionDetail = () => {
  const navigate = useNavigate();
  const { questionId } = useParams<{ questionId: string }>();
  
  // Real-time sync across admin tabs
  useQuestionsSubscription();

  // Fetch the question
  const { data: question, isLoading: isLoadingQuestion } = useQuery({
    queryKey: ['question', questionId],
    queryFn: async (): Promise<Question | null> => {
      if (!questionId) return null;
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', questionId)
        .single();
      
      if (error) {
        console.error('Error fetching question:', error);
        return null;
      }
      const staticOpts = Array.isArray(data.static_options) 
        ? (data.static_options as unknown as StaticOption[])
        : null;
      return {
        ...data,
        static_options: staticOpts,
      } as Question;
    },
    enabled: !!questionId,
  });

  if (isLoadingQuestion) {
    return (
      <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </StandardPageLayout>
    );
  }

  if (!question) {
    return (
      <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
        <div className="text-center py-12">
          <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Question Not Found</h2>
          <p className="text-muted-foreground mb-4">The question you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/agents/questions')}>Back to Questions</Button>
        </div>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/agents/questions')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{question.label}</h1>
              {question.is_active ? (
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <X className="h-3 w-3" />
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {question.description || 'No description provided'}
            </p>
          </div>
        </div>

        {/* Question Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              Question Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p className="font-mono text-sm mt-1">{question.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Placeholder Key</label>
                <p className="font-mono text-sm mt-1">{question.placeholder_key}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sort Order</label>
                <p className="text-sm mt-1">{question.sort_order}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm mt-1">{question.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Options Source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" />
              Options Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {question.options_table ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source Table</label>
                  <p className="font-mono text-sm mt-1 bg-muted px-2 py-1 rounded inline-block">
                    {question.options_table}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Label Column</label>
                  <p className="font-mono text-sm mt-1">{question.options_label_column}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Value Column</label>
                  <p className="font-mono text-sm mt-1">{question.options_value_column}</p>
                </div>
              </div>
            ) : question.static_options ? (
              <p className="text-muted-foreground text-sm">
                This question uses static options defined inline.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                This question uses free-form input.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Options Manager - Use Factory for dynamic tables */}
        {question.options_table && (
          <OptionManagerFactory 
            tableName={question.options_table} 
            questionId={question.id} 
          />
        )}

        {/* Static Options Manager */}
        {question.static_options && (
          <StaticOptionManager 
            questionId={question.id} 
            options={question.static_options} 
          />
        )}
      </div>
    </StandardPageLayout>
  );
};

export default QuestionDetail;
