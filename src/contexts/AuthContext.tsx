import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { SafeLocalStorage, SUBSCRIPTION_CACHE_KEY, ROLE_CACHE_KEY, ACCESS_STATE_CACHE_KEY } from '@/utils/storage';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthContext] Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Clear ALL access caches on sign out to prevent stale data
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] Clearing all caches after SIGNED_OUT');
          SafeLocalStorage.remove(SUBSCRIPTION_CACHE_KEY);
          SafeLocalStorage.remove(ROLE_CACHE_KEY);
          SafeLocalStorage.remove(ACCESS_STATE_CACHE_KEY);
        }
        
        // Clear ALL access caches on auth change to force fresh data for new/returning users
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('[AuthContext] Clearing all access caches after', event);
          SafeLocalStorage.remove(SUBSCRIPTION_CACHE_KEY);
          SafeLocalStorage.remove(ACCESS_STATE_CACHE_KEY);
          
          // Trigger a subscription check after a brief delay to ensure trial status is fetched
          setTimeout(() => {
            console.log('[AuthContext] Triggering subscription check for fresh trial/subscription data');
            window.dispatchEvent(new CustomEvent('auth-subscription-check'));
          }, 300);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Global session validation every 5 minutes
    const validateInterval = setInterval(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        await supabase.auth.signOut({ scope: 'local' });
        setSession(null);
        setUser(null);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(validateInterval);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setSession(null);
    setUser(null);
    // Clear all access-related caches on logout
    SafeLocalStorage.remove(SUBSCRIPTION_CACHE_KEY);
    SafeLocalStorage.remove(ROLE_CACHE_KEY);
    SafeLocalStorage.remove(ACCESS_STATE_CACHE_KEY);
  };

  const authData: AuthContextValue = {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};