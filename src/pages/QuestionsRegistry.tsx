import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Check, X } from 'lucide-react';
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuestions } from '@/hooks/useQuestions';

const QuestionsRegistry = () => {
  const navigate = useNavigate();
  const { data: questions, isLoading } = useQuestions();

  if (isLoading) {
    return (
      <StandardPageLayout showHeader={true} containerSize="xl" containerClassName="py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
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
            onClick={() => navigate('/agents')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">All Questions</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Complete registry of discovery questions used by agents
            </p>
          </div>
        </div>

        {/* Questions List */}
        <div className="grid gap-4">
          {questions?.map((question) => (
            <Card 
              key={question.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
              onClick={() => navigate(`/agents/questions/${question.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{question.label}</h3>
                      {question.is_active ? (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Check className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                          <X className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {question.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {question.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs font-mono">
                        {question.placeholder_key}
                      </Badge>
                      {question.options_table && (
                        <Badge variant="secondary" className="text-xs">
                          Dynamic: {question.options_table}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!questions || questions.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No questions found in the registry.</p>
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
};

export default QuestionsRegistry;
