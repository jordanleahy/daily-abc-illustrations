import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext'; // Fixed import
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { SITE_CONFIG } from '@/config/site';

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();
  
  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get('mode');
  const returnUrl = searchParams.get('returnUrl');
  
  const [isLogin, setIsLogin] = useState(mode !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  // Only redirect if already authenticated AND not on auth page
  useEffect(() => {
    if (isAuthenticated && location.pathname !== '/auth') {
      navigate('/');
    }
  }, [isAuthenticated, navigate, location.pathname]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          navigate(returnUrl || '/');
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: firstName,
              last_name: lastName,
            }
          }
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try logging in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: returnUrl ? "Please check your email to verify your account, then you'll be redirected to complete your subscription." : "Please check your email to verify your account.",
          });
          // For email verification flow, we can't redirect immediately
          // The user will be redirected after email verification
        }
      }
    } catch (error) {
      toast({
        title: "Authentication error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout showHeader={false}>
      <Container size="sm" className="flex items-center justify-center min-h-screen py-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isLogin ? SITE_CONFIG.name : 'Create Account to Subscribe'}
            </CardTitle>
            <CardDescription className="space-y-1">
              <div>
                {isLogin ? 'Sign in to manage your subscription' : 'Create your account to start your subscription'}
              </div>
              <div className="text-xs text-muted-foreground">
                Daily ABC books delivered at 7:01 AM ET
              </div>
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="text-sm"
            >
              {isLogin 
                ? "Need an account? Sign up to subscribe" 
                : "Already have an account? Sign in"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
    </PageLayout>
  );
};

export default Auth;