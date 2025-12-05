import { useNetworkStatusContext } from '@/contexts/NetworkStatusContext';
import { WifiOff, Wifi } from 'lucide-react';

export function WeakNetworkBanner() {
  const { isOnline, isWeak } = useNetworkStatusContext();

  const showBanner = !isOnline || isWeak;

  if (!showBanner) {
    return null;
  }

  const isOffline = !isOnline;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50
        px-4 py-2
        flex items-center justify-center gap-2
        text-sm font-medium
        animate-in slide-in-from-top duration-300
        ${isOffline 
          ? 'bg-destructive text-destructive-foreground' 
          : 'bg-amber-500 text-amber-950'
        }
      `}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You're offline. Some features may not work.</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4" />
          <span>Your connection is weak. Loading might take longer.</span>
        </>
      )}
    </div>
  );
}
