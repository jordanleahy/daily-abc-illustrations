import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, HelpCircle, Check, X, Database, List, Plus, Trash2 } from 'lucide-react';
import { StandardPageLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAddQuestionOption, useDeleteQuestionOption } from '@/hooks/useQuestionOptions';
import type { Question } from '@/hooks/useQuestions';

interface QuestionOption {
  value: string;
  label: string;
}

type SupportedTable = 'cities' | 'age_groups' | 'grade_levels' | 'character_themes';

const QuestionDetail = () => {
  const navigate = useNavigate();
  const { questionId } = useParams<{ questionId: string }>();
  const queryClient = useQueryClient();

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteOption, setDeleteOption] = useState<QuestionOption | null>(null);
  const [newOptionId, setNewOptionId] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');

  // Mutations
  const addMutation = useAddQuestionOption();
  const deleteMutation = useDeleteQuestionOption();

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
      return data;
    },
    enabled: !!questionId,
  });

  // Fetch options from the referenced table if applicable
  const { data: options, isLoading: isLoadingOptions } = useQuery({
    queryKey: ['question-options', question?.options_table, question?.options_label_column, question?.options_value_column],
    queryFn: async (): Promise<QuestionOption[]> => {
      if (!question?.options_table || !question?.options_label_column || !question?.options_value_column) {
        return [];
      }

      const labelCol = question.options_label_column;
      const valueCol = question.options_value_column;

      const tableName = question.options_table as SupportedTable;
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching options:', error);
        return [];
      }

      return (data || []).map((item) => ({
        value: String(item[valueCol as keyof typeof item] ?? ''),
        label: String(item[labelCol as keyof typeof item] ?? ''),
      }));
    },
    enabled: !!question?.options_table && !!question?.options_label_column && !!question?.options_value_column,
  });

  const handleAddOption = () => {
    if (!question?.options_table || !newOptionId.trim() || !newOptionLabel.trim()) return;

    const formattedId = newOptionId.trim().toUpperCase().replace(/\s+/g, '_');
    
    addMutation.mutate(
      {
        tableName: question.options_table as SupportedTable,
        id: formattedId,
        label: newOptionLabel.trim(),
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          setNewOptionId('');
          setNewOptionLabel('');
        },
      }
    );
  };

  const handleDeleteOption = () => {
    if (!question?.options_table || !deleteOption) return;

    deleteMutation.mutate(
      {
        tableName: question.options_table as SupportedTable,
        id: deleteOption.value,
      },
      {
        onSuccess: () => {
          setDeleteOption(null);
        },
      }
    );
  };

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

  const canManageOptions = !!question.options_table;

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
              <div className="space-y-4">
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
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                This question uses static options defined in code or free-form input.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Options List */}
        {question.options_table && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <List className="h-5 w-5 text-primary" />
                Available Options ({options?.length || 0})
              </CardTitle>
              {canManageOptions && (
                <Button 
                  size="sm" 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoadingOptions ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : options && options.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {options.map((option) => (
                    <div 
                      key={option.value}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{option.label}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{option.value}</p>
                      </div>
                      {canManageOptions && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteOption(option);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No options available.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Option Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Option</DialogTitle>
            <DialogDescription>
              Add a new option to the {question?.options_table} table. This will be available to all agents using this question.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="optionLabel">Display Label</Label>
              <Input
                id="optionLabel"
                placeholder="e.g., San Francisco"
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="optionId">ID (auto-formatted to UPPER_SNAKE_CASE)</Label>
              <Input
                id="optionId"
                placeholder="e.g., san_francisco"
                value={newOptionId}
                onChange={(e) => setNewOptionId(e.target.value)}
              />
              {newOptionId && (
                <p className="text-xs text-muted-foreground">
                  Will be saved as: <span className="font-mono">{newOptionId.trim().toUpperCase().replace(/\s+/g, '_')}</span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddOption}
              disabled={!newOptionId.trim() || !newOptionLabel.trim() || addMutation.isPending}
            >
              {addMutation.isPending ? 'Adding...' : 'Add Option'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteOption} onOpenChange={(open) => !open && setDeleteOption(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Option</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deleteOption?.label}"? This will hide it from all agents using this question, but the data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOption}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StandardPageLayout>
  );
};

export default QuestionDetail;
