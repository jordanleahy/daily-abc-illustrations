import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { SITE_CONFIG } from '@/config/site';

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();
  
  const searchParams = new URLSearchParams(location.search);
  const mode = searchParams.get('mode');
  
  const [isLogin, setIsLogin] = useState(mode !== 'signup');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);


  // Redirect authenticated users if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password reset email sent!",
          description: "Check your inbox for the reset link.",
        });
        setEmail('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          // Check subscription status
          const { data: subStatus } = await supabase.functions.invoke('check-subscription');
          
          if (subStatus?.subscribed && (!subStatus.subscription_end || new Date(subStatus.subscription_end) > new Date())) {
            toast({
              title: "Welcome back!",
              description: "You have successfully logged in.",
            });
            navigate('/library');
          } else {
            // Redirect to pricing page
            toast({
              title: "Welcome back!",
              description: "Please select a subscription plan to continue.",
            });
            navigate('/pricing');
          }
        }
      } else {
        // Redirect to pricing page after email confirmation
        const redirectUrl = `${window.location.origin}/pricing`;
        
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
            description: "Please check your email to verify your account. You'll be redirected to our pricing page.",
          });
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
    <>
      <AuthHeader />
      <PageLayout showHeader={false}>
        <Container size="sm" className="flex items-center justify-center min-h-screen py-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isForgotPassword ? 'Reset Password' : isLogin ? SITE_CONFIG.name : 'Create Account to Subscribe'}
            </CardTitle>
            <CardDescription className="space-y-1">
              <div>
                {isForgotPassword 
                  ? 'Enter your email to receive a password reset link' 
                  : isLogin 
                    ? 'Sign in to manage your subscription' 
                    : 'Create your account to start your subscription'}
              </div>
              {!isForgotPassword && (
                <div className="text-xs text-muted-foreground">
                  Daily ABC books delivered at 7:01 AM ET
                </div>
              )}
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={isForgotPassword ? handleForgotPassword : handleAuth} className="space-y-4">
            {!isLogin && !isForgotPassword && (
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
            {!isForgotPassword && (
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
            )}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Sign Up'}
          </Button>
          </form>
          
          <div className="mt-4 flex items-center justify-between gap-4 flex-wrap text-sm">
            {isLogin && !isForgotPassword && (
              <Button
                variant="link"
                type="button"
                onClick={() => setIsForgotPassword(true)}
                disabled={loading}
                className="text-sm h-auto p-0"
              >
                Forgot Password?
              </Button>
            )}
            <Button
              variant="link"
              onClick={() => {
                if (isForgotPassword) {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                } else {
                  setIsLogin(!isLogin);
                }
              }}
              disabled={loading}
              className="text-sm h-auto p-0"
            >
              {isForgotPassword
                ? "Back to Sign In"
                : isLogin 
                  ? "Need an account? Sign up to subscribe" 
                  : "Already have an account? Sign in"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
      </Container>
      </PageLayout>
    </>
  );
};

export default Auth;