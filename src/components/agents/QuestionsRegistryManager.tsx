import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuestions } from '@/hooks/useQuestions';
import { useCities } from '@/hooks/useCities';
import { Database, Plus, Settings, MapPin, Palette, GraduationCap, Users, Type, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const questionIcons: Record<string, React.ReactNode> = {
  city: <MapPin className="h-4 w-4" />,
  character_theme: <Palette className="h-4 w-4" />,
  grade_level: <GraduationCap className="h-4 w-4" />,
  age_group: <Users className="h-4 w-4" />,
  letter_case: <Type className="h-4 w-4" />,
};

interface OptionPreviewProps {
  tableName: string;
}

function OptionPreview({ tableName }: OptionPreviewProps) {
  const { data: cities, isLoading: citiesLoading } = useCities();

  // For now, we only have cities hook ready - others would be similar
  if (tableName === 'cities') {
    if (citiesLoading) return <Skeleton className="h-6 w-32" />;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {(cities || []).slice(0, 6).map(city => (
          <Badge key={city.id} variant="secondary" className="text-xs">
            {city.emoji} {city.label}
          </Badge>
        ))}
        {(cities?.length || 0) > 6 && (
          <Badge variant="outline" className="text-xs">
            +{(cities?.length || 0) - 6} more
          </Badge>
        )}
      </div>
    );
  }

  // Placeholder for other tables
  return (
    <p className="text-xs text-muted-foreground mt-2">
      Options loaded from <code>{tableName}</code> table
    </p>
  );
}

export function QuestionsRegistryManager() {
  const { data: questions, isLoading } = useQuestions();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Question Registry
            </CardTitle>
            <CardDescription>
              Manage available questions and their options. Options are loaded from database tables.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" disabled>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Question
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(questions || []).map(question => {
            const isExpanded = expandedQuestions.has(question.id);
            
            return (
              <Collapsible key={question.id} open={isExpanded} onOpenChange={() => toggleExpanded(question.id)}>
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-accent/5 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                          {questionIcons[question.id] || <Settings className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{question.label}</span>
                            <Badge variant={question.is_active ? 'default' : 'secondary'} className="text-xs">
                              {question.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {question.description && (
                            <p className="text-sm text-muted-foreground">
                              {question.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {question.options_table && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Database className="h-3 w-3" />
                            {question.options_table}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
                      <div className="pt-3 space-y-3">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Placeholder Key
                          </span>
                          <code className="block mt-1 text-sm font-mono bg-background px-2 py-1 rounded border">
                            {question.placeholder_key}
                          </code>
                        </div>
                        
                        {question.options_table && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Current Options
                            </span>
                            <OptionPreview tableName={question.options_table} />
                          </div>
                        )}

                        {!question.options_table && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Static Options
                            </span>
                            <p className="text-sm text-muted-foreground mt-1">
                              This question uses static options defined in the agent instructions.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        {(!questions || questions.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No questions in the registry yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
