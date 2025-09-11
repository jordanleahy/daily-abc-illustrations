import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChangeResponsePanelProps {
  whatChanged: string;
  version: string;
  onDismiss: () => void;
  className?: string;
}

export const ChangeResponsePanel = ({ 
  whatChanged, 
  version, 
  onDismiss, 
  className 
}: ChangeResponsePanelProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setIsVisible(true);

    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Delay the actual dismissal to allow fade out animation
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  return (
    <div 
      className={cn(
        "transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        className
      )}
    >
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3 dark:bg-green-950/20 dark:border-green-800/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
              Changes Applied
            </h4>
          </div>
          <button
            onClick={handleDismiss}
            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-green-700 dark:text-green-300">
            {whatChanged}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
            Updated to {version}
          </p>
        </div>
      </div>
    </div>
  );
};