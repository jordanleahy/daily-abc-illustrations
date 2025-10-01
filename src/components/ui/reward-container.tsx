import { RewardIndicator } from './reward-indicator';

interface RewardContainerProps {
  earnedRewards: number;
}

export function RewardContainer({ earnedRewards }: RewardContainerProps) {
  if (earnedRewards === 0) return null;

  // Limit display to prevent overflow (max 20 visible indicators)
  const displayCount = Math.min(earnedRewards, 20);

  return (
    <div className="flex justify-end gap-1 flex-wrap p-2">
      {Array.from({ length: displayCount }, (_, index) => (
        <RewardIndicator key={index} />
      ))}
      {earnedRewards > 20 && (
        <span className="text-xs text-muted-foreground ml-1">+{earnedRewards - 20}</span>
      )}
    </div>
  );
}