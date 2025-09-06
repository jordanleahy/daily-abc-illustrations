import { useAuth as useClerkAuthHook, useUser } from '@clerk/clerk-react';

export const useAuth = () => {
  const { isSignedIn, isLoaded } = useClerkAuthHook();
  const { user } = useUser();

  const signOut = async () => {
    // Clerk handles sign out automatically through UserButton
    // This is here for compatibility with existing code
  };

  return {
    user,
    session: null, // Clerk doesn't use sessions in the same way
    loading: !isLoaded,
    signOut,
    isAuthenticated: !!isSignedIn,
  };
};