import { useState } from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTricks } from '@/hooks/useTricks';
import { useTrickGoals } from '@/hooks/useTrickGoals';
import { useDeleteTrick } from '@/hooks/useDeleteTrick';
import { TrickCard } from '@/components/tricks/TrickCard';
import { CreateTrickModal } from '@/components/tricks/CreateTrickModal';
import { Trick } from '@/types/trick';

export default function TricksManage() {
  const { data: tricks, isLoading: tricksLoading } = useTricks();
  const { data: allGoals, isLoading: goalsLoading } = useTrickGoals();
  const deleteTrick = useDeleteTrick();
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTrick, setEditTrick] = useState<Trick | null>(null);

  const handleEdit = (trick: Trick) => {
    setEditTrick(trick);
    setCreateModalOpen(true);
  };

  const handleDelete = (trickId: string) => {
    if (confirm('Are you sure you want to delete this trick?')) {
      deleteTrick.mutate(trickId);
    }
  };

  const isLoading = tricksLoading || goalsLoading;

  return (
    <StandardPageLayout title="Manage Tricks">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Tricks</h2>
            <p className="text-muted-foreground">Create and track cumulative progress goals</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Trick
          </Button>
        </div>
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tricks...</p>
        </div>
      ) : !tricks || tricks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No tricks yet. Create your first trick to start tracking progress!
          </p>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Trick
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tricks.map((trick) => {
            const trickGoals = allGoals?.filter((g) => g.trick_id === trick.id) || [];
            return (
              <TrickCard
                key={trick.id}
                trick={trick}
                goals={trickGoals}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
        )}
      </div>

      <CreateTrickModal 
        open={createModalOpen} 
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) setEditTrick(null);
        }} 
      />
    </StandardPageLayout>
  );
}
