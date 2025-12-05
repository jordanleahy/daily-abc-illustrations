import { useState, useMemo } from 'react';
import { useTypeDiscoveries, useTypeDiscoveryMutations, TypeSpecificDiscovery, DiscoveryOption } from '@/hooks/useTypeDiscoveries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const AGENT_TYPES = [
  'abc', 'numbers', 'colors', 'shapes', 'rhyming', 'cvc',
  'opposites', 'emotions', 'animals', 'sight-words', 'first-words', 'bedtime'
];

export const TypeDiscoveriesManager = () => {
  const { data: discoveries, isLoading } = useTypeDiscoveries();
  const { createMutation, updateMutation, deleteMutation } = useTypeDiscoveryMutations();
  
  const [filterAgentType, setFilterAgentType] = useState<string>('all');
  const [editingDiscovery, setEditingDiscovery] = useState<TypeSpecificDiscovery | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    agent_type: '',
    question_key: '',
    question_text: '',
    options: [] as DiscoveryOption[],
    sort_order: 0,
    is_active: true,
  });
  const [newOptionKey, setNewOptionKey] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');

  const filteredDiscoveries = useMemo(() => {
    if (!discoveries) return [];
    if (filterAgentType === 'all') return discoveries;
    return discoveries.filter(d => d.agent_type === filterAgentType);
  }, [discoveries, filterAgentType]);

  const groupedDiscoveries = useMemo(() => {
    const groups: Record<string, TypeSpecificDiscovery[]> = {};
    for (const d of filteredDiscoveries) {
      if (!groups[d.agent_type]) groups[d.agent_type] = [];
      groups[d.agent_type].push(d);
    }
    return groups;
  }, [filteredDiscoveries]);

  const resetForm = () => {
    setFormData({
      agent_type: '',
      question_key: '',
      question_text: '',
      options: [],
      sort_order: 0,
      is_active: true,
    });
    setNewOptionKey('');
    setNewOptionLabel('');
  };

  const handleEdit = (discovery: TypeSpecificDiscovery) => {
    setEditingDiscovery(discovery);
    setFormData({
      agent_type: discovery.agent_type,
      question_key: discovery.question_key,
      question_text: discovery.question_text,
      options: [...discovery.options],
      sort_order: discovery.sort_order,
      is_active: discovery.is_active,
    });
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    resetForm();
    setEditingDiscovery(null);
    setIsAddingNew(true);
  };

  const handleClose = () => {
    setEditingDiscovery(null);
    setIsAddingNew(false);
    resetForm();
  };

  const handleAddOption = () => {
    if (!newOptionKey.trim() || !newOptionLabel.trim()) return;
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { key: newOptionKey.trim(), label: newOptionLabel.trim() }]
    }));
    setNewOptionKey('');
    setNewOptionLabel('');
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.agent_type || !formData.question_key || !formData.question_text) return;

    if (editingDiscovery) {
      await updateMutation.mutateAsync({
        id: editingDiscovery.id,
        ...formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
    handleClose();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discovery question?')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleToggleActive = async (discovery: TypeSpecificDiscovery) => {
    await updateMutation.mutateAsync({
      id: discovery.id,
      is_active: !discovery.is_active,
    });
  };

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading discoveries...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Label>Filter by Agent:</Label>
          <Select value={filterAgentType} onValueChange={setFilterAgentType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {AGENT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Discovery
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedDiscoveries).map(([agentType, items]) => (
          <Card key={agentType}>
            <CardHeader className="py-3">
              <CardTitle className="text-lg capitalize">{agentType} Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map(discovery => (
                <div
                  key={discovery.id}
                  className={`p-3 border rounded-lg flex items-start justify-between gap-4 ${
                    !discovery.is_active ? 'opacity-50 bg-muted' : ''
                  }`}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {discovery.question_key}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Order: {discovery.sort_order}
                      </span>
                    </div>
                    <p className="font-medium">{discovery.question_text}</p>
                    <div className="flex flex-wrap gap-1">
                      {discovery.options.map((opt, i) => (
                        <span key={i} className="text-xs bg-secondary px-2 py-1 rounded">
                          {opt.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={discovery.is_active}
                      onCheckedChange={() => handleToggleActive(discovery)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(discovery)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(discovery.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAddingNew || !!editingDiscovery} onOpenChange={() => handleClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDiscovery ? 'Edit Discovery Question' : 'Add Discovery Question'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agent Type</Label>
                <Select 
                  value={formData.agent_type} 
                  onValueChange={v => setFormData(prev => ({ ...prev, agent_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Question Key</Label>
                <Input
                  value={formData.question_key}
                  onChange={e => setFormData(prev => ({ ...prev, question_key: e.target.value }))}
                  placeholder="e.g., letter_case"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                value={formData.question_text}
                onChange={e => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
                placeholder="What letter case would you prefer?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={e => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {formData.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="text-sm font-mono">{opt.key}:</span>
                    <span className="text-sm flex-1">{opt.label}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Key (e.g., lowercase)"
                  value={newOptionKey}
                  onChange={e => setNewOptionKey(e.target.value)}
                  className="w-1/3"
                />
                <Input
                  placeholder="Label (e.g., lowercase (a, b, c))"
                  value={newOptionLabel}
                  onChange={e => setNewOptionLabel(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={handleAddOption}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingDiscovery ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
