import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { SITE_CONFIG } from '@/config/site';

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkResetToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidToken(true);
      } else {
        toast({
          title: "Invalid or expired link",
          description: "This password reset link is invalid or has expired.",
          variant: "destructive",
        });
      }
      
      setCheckingToken(false);
    };

    checkResetToken();
  }, [toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password updated!",
          description: "Your password has been successfully reset.",
        });

        // Check subscription status to determine redirect
        const { data: subStatus } = await supabase.functions.invoke('check-subscription');
        
        if (subStatus?.subscribed && (!subStatus.subscription_end || new Date(subStatus.subscription_end) > new Date())) {
          navigate('/library');
        } else {
          navigate('/pricing');
        }
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

  if (checkingToken) {
    return (
      <>
        <AuthHeader />
        <PageLayout showHeader={false}>
          <Container size="sm" className="flex items-center justify-center min-h-screen py-8">
            <Card className="w-full">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground mt-2">Verifying reset link...</p>
                </div>
              </CardContent>
            </Card>
          </Container>
        </PageLayout>
      </>
    );
  }

  if (!isValidToken) {
    return (
      <>
        <AuthHeader />
        <PageLayout showHeader={false}>
          <Container size="sm" className="flex items-center justify-center min-h-screen py-8">
            <Card className="w-full">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
                <CardDescription>
                  This password reset link is invalid or has expired.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </CardContent>
            </Card>
          </Container>
        </PageLayout>
      </>
    );
  }

  return (
    <>
      <AuthHeader />
      <PageLayout showHeader={false}>
        <Container size="sm" className="flex items-center justify-center min-h-screen py-8">
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                {SITE_CONFIG.name} - Reset Password
              </CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Reset Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </Container>
      </PageLayout>
    </>
  );
};

export default ResetPassword;
