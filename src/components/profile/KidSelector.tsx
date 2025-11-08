import { useKidSelection } from '@/contexts/KidSelectionContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CoinCounter } from '@/components/ui/coin-counter';

interface KidSelectorProps {
  /** Show coin count next to each kid's name */
  showCoins?: boolean;
  /** Compact mode for mobile/header */
  compact?: boolean;
}

export function KidSelector({ showCoins = true, compact = false }: KidSelectorProps) {
  const { selectedKidId, availableKids, setSelectedKidId } = useKidSelection();

  // Only show selector if multiple kids exist
  if (availableKids.length <= 1) {
    return null;
  }

  return (
    <Select value={selectedKidId || ''} onValueChange={setSelectedKidId}>
      <SelectTrigger className={compact ? 'h-9 w-auto' : 'w-full'}>
        <SelectValue placeholder="Select a kid" />
      </SelectTrigger>
      <SelectContent className="bg-background z-[100]">
        {availableKids.map((kid) => (
          <SelectItem key={kid.id} value={kid.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={kid.profile_image_url} />
                <AvatarFallback>
                  {kid.first_name[0]}{kid.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <span>{kid.first_name} {kid.last_name}</span>
              {showCoins && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <CoinCounter coins={kid.earned_coins} size="sm" showLabel={false} />
                </>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
