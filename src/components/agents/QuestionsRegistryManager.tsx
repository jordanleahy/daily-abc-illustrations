import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useQuestions, Question, StaticOption, QuestionInput } from '@/hooks/useQuestions';
import { useCities } from '@/hooks/useCities';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Database, Plus, MapPin, Palette, GraduationCap, Users, Type, 
  ChevronRight, Mountain, Sun, Shirt, Sparkles,
  List, X, HelpCircle
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ICON_OPTIONS = [
  { value: 'HelpCircle', label: 'Question', icon: HelpCircle },
  { value: 'MapPin', label: 'Location', icon: MapPin },
  { value: 'Palette', label: 'Theme', icon: Palette },
  { value: 'GraduationCap', label: 'Education', icon: GraduationCap },
  { value: 'Users', label: 'People', icon: Users },
  { value: 'Type', label: 'Text', icon: Type },
  { value: 'Mountain', label: 'Resort', icon: Mountain },
  { value: 'Sun', label: 'Season', icon: Sun },
  { value: 'Shirt', label: 'Clothing', icon: Shirt },
  { value: 'Sparkles', label: 'Adventure', icon: Sparkles },
  { value: 'List', label: 'Options', icon: List },
];

const getQuestionIcon = (iconName: string | null) => {
  const found = ICON_OPTIONS.find(i => i.value === iconName);
  if (found) {
    const IconComponent = found.icon;
    return <IconComponent className="h-4 w-4" />;
  }
  return <HelpCircle className="h-4 w-4" />;
};

interface OptionPreviewProps {
  tableName: string;
}

function OptionPreview({ tableName }: OptionPreviewProps) {
  const { data: cities, isLoading: citiesLoading } = useCities();

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

  return (
    <p className="text-xs text-muted-foreground mt-2">
      Options loaded from <code>{tableName}</code> table
    </p>
  );
}

interface QuestionFormData {
  id: string;
  label: string;
  description: string;
  placeholder_key: string;
  icon_name: string;
  options_type: 'none' | 'table' | 'static';
  options_table: string;
  options_label_column: string;
  options_value_column: string;
  static_options: StaticOption[];
  is_active: boolean;
}

const emptyFormData: QuestionFormData = {
  id: '',
  label: '',
  description: '',
  placeholder_key: '',
  icon_name: 'HelpCircle',
  options_type: 'static',
  options_table: '',
  options_label_column: '',
  options_value_column: '',
  static_options: [],
  is_active: true,
};

export function QuestionsRegistryManager() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: questions, isLoading } = useQuestions();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestion, setDeleteQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(emptyFormData);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: QuestionInput) => {
      const maxOrder = Math.max(...(questions || []).map(q => q.sort_order), 0);
      const { error } = await supabase.from('questions').insert({
        id: data.id,
        label: data.label,
        description: data.description || null,
        placeholder_key: data.placeholder_key,
        icon_name: data.icon_name || 'HelpCircle',
        options_table: data.options_table || null,
        options_label_column: data.options_label_column || null,
        options_value_column: data.options_value_column || null,
        static_options: data.static_options ? JSON.parse(JSON.stringify(data.static_options)) : null,
        is_active: data.is_active ?? true,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question created');
      setIsCreateDialogOpen(false);
      setFormData(emptyFormData);
    },
    onError: (error: any) => {
      console.error('Error creating question:', error);
      toast.error(error.message || 'Failed to create question');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: QuestionInput) => {
      const { error } = await supabase.from('questions').update({
        label: data.label,
        description: data.description || null,
        placeholder_key: data.placeholder_key,
        icon_name: data.icon_name || 'HelpCircle',
        options_table: data.options_table || null,
        options_label_column: data.options_label_column || null,
        options_value_column: data.options_value_column || null,
        static_options: data.static_options ? JSON.parse(JSON.stringify(data.static_options)) : null,
        is_active: data.is_active ?? true,
        updated_at: new Date().toISOString(),
      }).eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question updated');
      setEditingQuestion(null);
      setFormData(emptyFormData);
    },
    onError: (error: any) => {
      console.error('Error updating question:', error);
      toast.error(error.message || 'Failed to update question');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete agent_questions mappings
      await supabase.from('agent_questions').delete().eq('question_id', id);
      // Then delete the question
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['agent-questions'] });
      toast.success('Question deleted');
      setDeleteQuestion(null);
    },
    onError: (error: any) => {
      console.error('Error deleting question:', error);
      toast.error(error.message || 'Failed to delete question');
    },
  });

  const openCreateDialog = () => {
    setFormData(emptyFormData);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (question: Question) => {
    const optionsType = question.options_table 
      ? 'table' 
      : (question.static_options && question.static_options.length > 0) 
        ? 'static' 
        : 'none';
    
    setFormData({
      id: question.id,
      label: question.label,
      description: question.description || '',
      placeholder_key: question.placeholder_key,
      icon_name: question.icon_name || 'HelpCircle',
      options_type: optionsType,
      options_table: question.options_table || '',
      options_label_column: question.options_label_column || '',
      options_value_column: question.options_value_column || '',
      static_options: question.static_options || [],
      is_active: question.is_active,
    });
    setEditingQuestion(question);
  };

  const handleSubmit = () => {
    const input: QuestionInput = {
      id: formData.id.toLowerCase().replace(/\s+/g, '_'),
      label: formData.label,
      description: formData.description || undefined,
      placeholder_key: formData.placeholder_key || `{{${formData.id.toUpperCase().replace(/\s+/g, '_')}_OPTIONS}}`,
      icon_name: formData.icon_name,
      is_active: formData.is_active,
    };

    if (formData.options_type === 'table') {
      input.options_table = formData.options_table || undefined;
      input.options_label_column = formData.options_label_column || undefined;
      input.options_value_column = formData.options_value_column || undefined;
      input.static_options = null;
    } else if (formData.options_type === 'static') {
      input.static_options = formData.static_options.length > 0 ? formData.static_options : null;
      input.options_table = null;
      input.options_label_column = null;
      input.options_value_column = null;
    } else {
      input.static_options = null;
      input.options_table = null;
      input.options_label_column = null;
      input.options_value_column = null;
    }

    if (editingQuestion) {
      updateMutation.mutate(input);
    } else {
      createMutation.mutate(input);
    }
  };

  const addStaticOption = () => {
    if (!newOptionLabel.trim()) return;
    const value = newOptionValue.trim() || newOptionLabel.toLowerCase().replace(/\s+/g, '-');
    setFormData(prev => ({
      ...prev,
      static_options: [...prev.static_options, { value, label: newOptionLabel.trim() }],
    }));
    setNewOptionLabel('');
    setNewOptionValue('');
  };

  const removeStaticOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      static_options: prev.static_options.filter((_, i) => i !== index),
    }));
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

  const isFormValid = formData.id.trim() && formData.label.trim();
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Question Registry
              </CardTitle>
              <CardDescription>
                Manage discovery questions. Use database tables for complex entities or inline options for simple lists.
              </CardDescription>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(questions || []).map(question => (
              <div 
                key={question.id}
                className="border rounded-lg overflow-hidden cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => navigate(`/agents/questions/${question.id}`)}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                      {getQuestionIcon(question.icon_name)}
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
                    <Badge variant="outline" className="text-xs font-mono">
                      {question.placeholder_key}
                    </Badge>
                    {question.options_table && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Database className="h-3 w-3" />
                        Dynamic: {question.options_table}
                      </Badge>
                    )}
                    {question.static_options && question.static_options.length > 0 && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <List className="h-3 w-3" />
                        {question.static_options.length} options
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(!questions || questions.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No questions in the registry yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreateDialogOpen || !!editingQuestion} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingQuestion(null);
            setFormData(emptyFormData);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Create New Question'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion 
                ? 'Update the question configuration.' 
                : 'Add a new discovery question for agents to use.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id">ID</Label>
                <Input
                  id="id"
                  placeholder="e.g., resort"
                  value={formData.id}
                  onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                  disabled={!!editingQuestion}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={formData.icon_name}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                placeholder="e.g., Ski Resort"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., Choose a ski resort for the book setting"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeholder">Placeholder Key</Label>
              <Input
                id="placeholder"
                placeholder="e.g., {{RESORT_OPTIONS}}"
                value={formData.placeholder_key}
                onChange={(e) => setFormData(prev => ({ ...prev, placeholder_key: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Options Source</Label>
              <Select
                value={formData.options_type}
                onValueChange={(value: 'none' | 'table' | 'static') => 
                  setFormData(prev => ({ ...prev, options_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static Options (inline list)</SelectItem>
                  <SelectItem value="table">Database Table (lookup)</SelectItem>
                  <SelectItem value="none">Free Text (no options)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.options_type === 'table' && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>Table Name</Label>
                  <Input
                    placeholder="e.g., resorts"
                    value={formData.options_table}
                    onChange={(e) => setFormData(prev => ({ ...prev, options_table: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Label Column</Label>
                    <Input
                      placeholder="e.g., name"
                      value={formData.options_label_column}
                      onChange={(e) => setFormData(prev => ({ ...prev, options_label_column: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Value Column</Label>
                    <Input
                      placeholder="e.g., id"
                      value={formData.options_value_column}
                      onChange={(e) => setFormData(prev => ({ ...prev, options_value_column: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.options_type === 'static' && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <Label>Static Options</Label>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Option label"
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addStaticOption()}
                  />
                  <Input
                    placeholder="Value (optional)"
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addStaticOption()}
                    className="w-32"
                  />
                  <Button type="button" size="icon" onClick={addStaticOption}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.static_options.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.static_options.map((opt, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pr-1">
                        {opt.label}
                        <button
                          type="button"
                          onClick={() => removeStaticOption(i)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingQuestion(null);
                setFormData(emptyFormData);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!isFormValid || isPending}>
              {isPending ? 'Saving...' : editingQuestion ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteQuestion} onOpenChange={() => setDeleteQuestion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteQuestion?.label}" and remove it from all agents.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuestion && deleteMutation.mutate(deleteQuestion.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}