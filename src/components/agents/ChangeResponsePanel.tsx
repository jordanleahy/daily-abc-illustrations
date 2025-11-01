import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChangeResponsePanelProps {
  whatChanged?: string | null;
  version: string;
  className?: string;
  defaultMessage?: string;
}

export const ChangeResponsePanel = ({ 
  whatChanged, 
  version, 
  className,
  defaultMessage = "Agent configuration ready"
}: ChangeResponsePanelProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    setIsVisible(true);
  }, []);

  return (
    <div 
      className={cn(
        "transition-all duration-300 ease-in-out",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        className
      )}
    >
      <div className="bg-success/10 border border-success/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-success-foreground" />
          </div>
          <h4 className="text-sm font-semibold text-success-foreground">
            Changes Applied
          </h4>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-success-foreground/90">
            {whatChanged || defaultMessage}
          </p>
          <p className="text-xs text-success-foreground/75 font-medium">
            Version {version}
          </p>
        </div>
      </div>
    </div>
  );
};