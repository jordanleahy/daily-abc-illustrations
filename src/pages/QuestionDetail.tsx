import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import { useAddCity, useDeleteCity } from '@/hooks/useCityOptions';
import type { Question } from '@/hooks/useQuestions';

interface QuestionOption {
  value: string;
  label: string;
}

const QuestionDetail = () => {
  const navigate = useNavigate();
  const { questionId } = useParams<{ questionId: string }>();
  
  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteOption, setDeleteOption] = useState<QuestionOption | null>(null);
  const [newCityLabel, setNewCityLabel] = useState('');
  const [newCityId, setNewCityId] = useState('');
  
  // Mutations for cities table
  const addCity = useAddCity();
  const deleteCity = useDeleteCity();

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

      // Dynamic query based on the options_table configuration
      const tableName = question.options_table as 'cities' | 'age_groups' | 'grade_levels' | 'character_themes';
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
              {question.options_table === 'cities' && (
                <Button 
                  size="sm" 
                  onClick={() => {
                    setNewCityLabel('');
                    setNewCityId('');
                    setIsAddDialogOpen(true);
                  }}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add City
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
                      {question.options_table === 'cities' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteOption(option)}
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

      {/* Add City Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New City</DialogTitle>
            <DialogDescription>
              Add a new city to the available options. The ID should be unique and use UPPER_SNAKE_CASE.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cityLabel">City Name</Label>
              <Input
                id="cityLabel"
                placeholder="e.g., San Francisco"
                value={newCityLabel}
                onChange={(e) => {
                  setNewCityLabel(e.target.value);
                  // Auto-generate ID from label
                  const generatedId = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9\s]/g, '')
                    .replace(/\s+/g, '_')
                    .trim();
                  setNewCityId(generatedId);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cityId">City ID</Label>
              <Input
                id="cityId"
                placeholder="e.g., SAN_FRANCISCO"
                value={newCityId}
                onChange={(e) => setNewCityId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier used in the system
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newCityLabel && newCityId) {
                  addCity.mutate(
                    { id: newCityId, label: newCityLabel },
                    { onSuccess: () => setIsAddDialogOpen(false) }
                  );
                }
              }}
              disabled={!newCityLabel || !newCityId || addCity.isPending}
            >
              {addCity.isPending ? 'Adding...' : 'Add City'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteOption} onOpenChange={(open) => !open && setDeleteOption(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove "{deleteOption?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the city from the available options. The data is preserved and can be restored later by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteOption) {
                  deleteCity.mutate(deleteOption.value, {
                    onSuccess: () => setDeleteOption(null),
                  });
                }
              }}
            >
              {deleteCity.isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StandardPageLayout>
  );
};

export default QuestionDetail;
