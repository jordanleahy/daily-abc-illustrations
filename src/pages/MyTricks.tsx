import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { useTrickGoals } from '@/hooks/useTrickGoals';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { TrickTrackingCard } from '@/components/tricks/TrickTrackingCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { CoinCounter } from '@/components/ui/coin-counter';

export default function MyTricks() {
  const { data: kids } = useKidProfiles();
  const activeKid = kids?.find((k) => k.is_active);
  const [selectedKidId, setSelectedKidId] = useState<string>('');
  
  useEffect(() => {
    if (activeKid && !selectedKidId) {
      setSelectedKidId(activeKid.id);
    }
  }, [activeKid, selectedKidId]);
  
  const { data: goals, isLoading } = useTrickGoals(selectedKidId);

  const selectedKid = kids?.find((k) => k.id === selectedKidId);

  return (
    <StandardPageLayout
      title="My Tricks"
    >
      <div className="space-y-6">
        {kids && kids.length > 1 && (
          <div className="flex items-center gap-4">
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
            {selectedKid && (
              <CoinCounter coins={selectedKid.earned_coins} size="sm" />
            )}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your tricks...</p>
          </div>
        ) : !goals || goals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No tricks assigned yet. Ask your parent to create some tricks for you!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <TrickTrackingCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
}
