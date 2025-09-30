import { RewardIndicator } from './reward-indicator';

interface RewardContainerProps {
  earnedRewards: number;
}

export function RewardContainer({ earnedRewards }: RewardContainerProps) {
  if (earnedRewards === 0) return null;

  return (
    <div className="flex justify-start gap-1 flex-wrap p-4">
      {Array.from({ length: earnedRewards }, (_, index) => (
        <RewardIndicator key={index} />
      ))}
    </div>
  );
}