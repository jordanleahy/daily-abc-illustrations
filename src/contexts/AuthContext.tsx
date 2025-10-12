import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

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
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
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