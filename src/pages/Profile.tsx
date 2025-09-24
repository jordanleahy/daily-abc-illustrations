import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Edit2, Calendar, Mail, BookOpen, Trophy, Clock, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useBooks } from '@/hooks/useBooks';
import { ProfileForm } from '@/components/ProfileForm';
import { PageLayout } from '@/components/layout/PageLayout';
import { Container } from '@/components/layout/Container';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { data: profile, isLoading, error } = useProfile();
  const { books } = useBooks();
  const navigate = useNavigate();
  const location = useLocation();

  // Calculate user stats
  const userStats = {
    totalBooks: books?.length || 0,
    memberSince: profile?.created_at ? new Date(profile.created_at) : new Date(),
    daysActive: profile?.created_at ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated && location.pathname !== '/auth') {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate, location.pathname]);

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
      <Container size="lg" className="py-4 md:py-8">
        <div className="space-y-6 md:space-y-8">
          {/* Enhanced Profile Header */}
          <div className="relative">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl blur-3xl" />
            
            <Card className="relative border-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  {/* Profile Info */}
                  <div className="flex items-center gap-6">
                    <Avatar className="w-20 h-20 md:w-24 md:h-24 ring-4 ring-primary/20 shadow-lg">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-xl md:text-2xl font-bold">
                        {profile.first_name?.[0]}{profile.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-2">
                      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {profile.first_name} {profile.last_name}
                      </h1>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Trophy className="w-3 h-3" />
                          Creator
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="w-3 h-3" />
                          {userStats.daysActive} days active
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 shadow-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/50 dark:border-blue-800/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{userStats.totalBooks}</p>
                <p className="text-sm text-blue-600/80 dark:text-blue-400/80">Books Created</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200/50 dark:border-green-800/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{userStats.daysActive}</p>
                <p className="text-sm text-green-600/80 dark:text-green-400/80">Days Active</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200/50 dark:border-purple-800/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {userStats.memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
                <p className="text-sm text-purple-600/80 dark:text-purple-400/80">Member Since</p>
              </CardContent>
            </Card>
          </div>

          {/* Profile Information */}
          <Card className="bg-gradient-to-br from-background to-muted/30 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="w-4 h-4" />
                    First Name
                  </div>
                  <p className="text-lg font-semibold pl-6">
                    {profile.first_name || 'Not provided'}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <User className="w-4 h-4" />
                    Last Name
                  </div>
                  <p className="text-lg font-semibold pl-6">
                    {profile.last_name || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </div>
                  <p className="text-lg font-semibold pl-6 break-all">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </div>
                  <p className="text-lg font-semibold pl-6">
                    {userStats.memberSince.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </PageLayout>
  );
};

export default Profile;