import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [acceptTerms, setAcceptTerms] = useState(true);


  // Redirect authenticated users to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/pricing`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast({
          title: "Google Sign-In failed",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
      }
      // Loading state will persist until redirect happens
    } catch (error) {
      toast({
        title: "Authentication error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

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
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          navigate('/home');
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
                  New books delivered daily at 7:01 AM ET
                </div>
              )}
            </CardDescription>
          </CardHeader>
        <CardContent>
          {/* Google Sign-In Button - Only show for login and signup, not forgot password */}
          {!isForgotPassword && (
            <>
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

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
            
            {!isLogin && !isForgotPassword && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  disabled={loading}
                />
                <Label 
                  htmlFor="terms" 
                  className="text-sm font-normal cursor-pointer"
                >
                  I accept the{' '}
                  <Link to="/terms-of-service" className="text-primary underline hover:text-primary/80">
                    Terms and Conditions
                  </Link>
                </Label>
              </div>
            )}
            
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || (!isLogin && !isForgotPassword && !acceptTerms)}
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