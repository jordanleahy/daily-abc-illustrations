import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Edit2, Calendar, Mail } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { ProfileForm } from '@/components/ProfileForm';
import { StandardPageLayout } from '@/components/layout';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { isAuthenticated, user, loading: authLoading } = useAuthContext();
  const { data: profile, isLoading, error } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated && location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate, location.pathname]);

  if (authLoading || isLoading) {
    return (
      <StandardPageLayout title="Profile" containerSize="md" containerClassName="py-8">
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
      </StandardPageLayout>
    );
  }

  if (error) {
    return (
      <StandardPageLayout title="Profile" containerSize="md" containerClassName="py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Failed to load profile: {error.message}
            </p>
          </CardContent>
        </Card>
      </StandardPageLayout>
    );
  }

  if (!profile) {
    return null;
  }

  if (isEditing) {
    return (
      <StandardPageLayout title="Edit Profile" containerSize="md" containerClassName="py-8">
        <ProfileForm
          profile={profile}
          onCancel={() => setIsEditing(false)}
        />
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout title="Profile" containerSize="md" containerClassName="py-4 md:py-8">
      <div className="space-y-4 md:space-y-6">
        {/* Mobile-optimized header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          {/* Profile Avatar and Title */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 md:w-6 md:h-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>
          </div>
          
          {/* Edit button - full width on mobile, normal on desktop */}
          <Button 
            onClick={() => setIsEditing(true)} 
            className="gap-2 w-full md:w-auto h-12 md:h-10"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-4 md:p-6">
            {/* Name section - always stacked on mobile, grid on desktop */}
            <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  First Name
                </label>
                <p className="text-foreground font-medium text-base">
                  {profile.first_name || 'Not provided'}
                </p>
              </div>
              <div className="space-y-2 pt-4 md:pt-0 border-t md:border-t-0 border-border/50 md:border-none">
                <label className="text-sm font-medium text-muted-foreground">
                  Last Name
                </label>
                <p className="text-foreground font-medium text-base">
                  {profile.last_name || 'Not provided'}
                </p>
              </div>
            </div>

            {/* Email section */}
            <div className="space-y-2 pt-4 border-t border-border/50">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <p className="text-foreground font-medium text-base break-all">
                {user?.email}
              </p>
            </div>

            {/* Member since section */}
            <div className="space-y-2 pt-4 border-t border-border/50">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member Since
              </label>
              <p className="text-foreground font-medium text-base">
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
    </StandardPageLayout>
  );
};

export default Profile;