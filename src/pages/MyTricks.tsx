import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { useTrickGoals } from '@/hooks/useTrickGoals';
import { useTricks } from '@/hooks/useTricks';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useDeleteTrick } from '@/hooks/useDeleteTrick';
import { TrickTrackingCard } from '@/components/tricks/TrickTrackingCard';
import { TrickCard } from '@/components/tricks/TrickCard';
import { CreateTrickModal } from '@/components/tricks/CreateTrickModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { CoinCounter } from '@/components/ui/coin-counter';
import { Edit, Plus, ArrowLeft } from 'lucide-react';
import { Trick } from '@/types/trick';

export default function MyTricks() {
  const { data: kids } = useKidProfiles();
  const activeKid = kids?.find((k) => k.is_active);
  const [selectedKidId, setSelectedKidId] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTrick, setEditTrick] = useState<Trick | null>(null);
  
  useEffect(() => {
    if (activeKid && !selectedKidId) {
      setSelectedKidId(activeKid.id);
    }
  }, [activeKid, selectedKidId]);
  
  const { data: goals, isLoading: goalsLoading } = useTrickGoals(selectedKidId);
  const { data: tricks, isLoading: tricksLoading } = useTricks();
  const deleteTrick = useDeleteTrick();

  const handleEdit = (trick: Trick) => {
    setEditTrick(trick);
    setCreateModalOpen(true);
  };

  const handleDelete = (trickId: string) => {
    if (confirm('Are you sure you want to delete this trick? This will also remove all associated goals and completions.')) {
      deleteTrick.mutate(trickId);
    }
  };

  const handleCreateNew = () => {
    setEditTrick(null);
    setCreateModalOpen(true);
  };

  const isLoading = isEditMode ? tricksLoading : goalsLoading;

  const selectedKid = kids?.find((k) => k.id === selectedKidId);

  return (
    <StandardPageLayout
      title="My Tricks"
    >
      <div className="space-y-6">
        {/* Header with Edit/Create buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {kids && kids.length > 1 && (
              <>
                <Select value={selectedKidId} onValueChange={setSelectedKidId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select kid" />
                  </SelectTrigger>
                  <SelectContent>
                    {kids.map((kid) => (
                      <SelectItem key={kid.id} value={kid.id}>
                        {kid.first_name} {kid.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedKid && !isEditMode && (
                  <CoinCounter coins={selectedKid.earned_coins} size="sm" />
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Button onClick={handleCreateNew} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Trick
                </Button>
                <Button 
                  onClick={() => setIsEditMode(false)} 
                  variant="outline"
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tracking
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => setIsEditMode(true)} 
                variant="outline"
                size="sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Tricks
              </Button>
            )}
          </div>
        </div>

        {/* Content - Toggle between tracking and management */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isEditMode ? 'Loading tricks...' : 'Loading your tricks...'}
            </p>
          </div>
        ) : isEditMode ? (
          // Management Mode - Show all tricks with edit/delete
          !tricks || tricks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No tricks created yet. Click "Create Trick" to get started!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tricks.map((trick) => {
                const trickGoals = goals?.filter((g) => g.trick_id === trick.id) || [];
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
          )
        ) : (
          // Tracking Mode - Show assigned tricks for selected kid
          !goals || goals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No tricks assigned yet. Click "Edit Tricks" to create and assign some!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <TrickTrackingCard key={goal.id} goal={goal} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Create/Edit Modal */}
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
