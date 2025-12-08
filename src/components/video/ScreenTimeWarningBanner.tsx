import { Clock } from "lucide-react";

interface ScreenTimeWarningBannerProps {
  timeRemaining: number; // in milliseconds
}

export const ScreenTimeWarningBanner = ({ timeRemaining }: ScreenTimeWarningBannerProps) => {
  const seconds = Math.max(0, Math.ceil(timeRemaining / 1000));
  const displayTime = seconds >= 60 
    ? `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
    : `${seconds}s`;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 py-2 px-4 text-center font-medium flex items-center justify-center gap-2 animate-pulse">
      <Clock className="h-4 w-4" />
      <span>Screen time ending in {displayTime}</span>
    </div>
  );
};
