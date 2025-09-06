import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Edit2, Calendar, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useClerkAuth';
import { useProfile } from '@/hooks/useProfile';
import { ProfileForm } from '@/components/ProfileForm';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { data: profile, isLoading, error } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Don't redirect since /auth route no longer exists
      // Clerk will handle authentication via SignInButton
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading || isLoading) {
    return (
      <PageLayout title="Profile">
        <Container size="md" className="py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Profile">
        <Container size="md" className="py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">
                Failed to load profile: {error.message}
              </p>
            </CardContent>
          </Card>
        </Container>
      </PageLayout>
    );
  }

  if (!profile) {
    return null;
  }

  if (isEditing) {
    return (
      <PageLayout title="Edit Profile">
        <Container size="md" className="py-8">
          <ProfileForm
            profile={profile}
            onCancel={() => setIsEditing(false)}
          />
        </Container>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Profile">
      <Container size="md" className="py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Profile</h1>
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </label>
                  <p className="text-foreground font-medium">
                    {profile.first_name || 'Not provided'}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </label>
                  <p className="text-foreground font-medium">
                    {profile.last_name || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <p className="text-foreground font-medium">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Member Since
                </label>
                <p className="text-foreground font-medium">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </PageLayout>
  );
};

export default Profile;