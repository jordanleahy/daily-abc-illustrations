import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'signin' | 'signup';
}

export const AuthModal = ({ 
  open, 
  onOpenChange, 
  defaultMode = 'signin' 
}: AuthModalProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);

  const handleSuccess = () => {
    onOpenChange(false);
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <span>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</span>
        </DialogHeader>
        
        {mode === 'signin' ? (
          <SignInForm 
            onToggleMode={toggleMode}
            onSuccess={handleSuccess}
          />
        ) : (
          <SignUpForm 
            onToggleMode={toggleMode}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};