import { RewardIndicator } from './reward-indicator';

interface RewardContainerProps {
  earnedRewards: number;
  className?: string;
}

export function RewardContainer({ earnedRewards, className }: RewardContainerProps) {
  if (earnedRewards === 0) return null;

  return (
    <div className={className}>
      <div className="text-center space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Reward</h3>
        <div className="flex justify-center gap-1 flex-wrap">
          {Array.from({ length: earnedRewards }, (_, index) => (
            <RewardIndicator key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}