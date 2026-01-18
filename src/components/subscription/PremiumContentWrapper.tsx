import { ReactNode } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumContentWrapperProps {
  children: ReactNode;
  showOverlay?: boolean;
  className?: string;
}

/**
 * PremiumContentWrapper - Now just checks authentication
 * All authenticated users have full access
 */
export const PremiumContentWrapper = ({ 
  children, 
  showOverlay = true,
  className = ""
}: PremiumContentWrapperProps) => {
  const { isAuthenticated, loading } = useAuthContext();
  const navigate = useNavigate();

  // If authenticated, show content
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Still loading - show content to avoid flicker
  if (loading) {
    return <>{children}</>;
  }

  // Not authenticated - show sign in prompt
  if (showOverlay) {
    return (
      <div className={`relative ${className}`}>
        {/* Content (blurred/dimmed) */}
        <div className="pointer-events-none opacity-60 blur-[2px]">
          {children}
        </div>
        
        {/* Sign in overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center space-y-4 p-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Sign In Required</h3>
              <p className="text-sm text-muted-foreground">
                Create a free account to access this content
              </p>
            </div>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/auth?mode=signup');
              }}
              size="sm"
              className="shadow-lg"
            >
              Sign Up Free
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
