import { RewardIndicator } from './reward-indicator';

interface RewardContainerProps {
  earnedRewards: number;
  className?: string;
}

export function RewardContainer({ earnedRewards, className }: RewardContainerProps) {
  if (earnedRewards === 0) return null;

  return (
    <div className={className}>
      <div className="text-center">
        <div className="flex justify-center gap-1 flex-wrap">
          {Array.from({ length: earnedRewards }, (_, index) => (
            <RewardIndicator key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}