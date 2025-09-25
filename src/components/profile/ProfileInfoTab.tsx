import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export function ProfileInfoTab() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Set form values when profile data loads or editing starts
  useEffect(() => {
    if (profile && isEditing) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateProfile.mutate(
      { first_name: firstName, last_name: lastName },
      {
        onSuccess: () => {
          setIsEditing(false);
        }
      }
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFirstName(profile?.first_name || '');
    setLastName(profile?.last_name || '');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load profile information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Profile Information</h2>
        <p className="text-sm text-muted-foreground">
          Update your personal information and how others see you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>
            This information will be displayed on your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="memberSince">Member Since</Label>
                <Input
                  id="memberSince"
                  value={user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <div className="text-sm font-medium">
                  {profile.first_name || profile.last_name 
                    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                    : 'Not set'
                  }
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
              </div>
              
              <div className="space-y-2">
                <Label>Member Since</Label>
                <div className="text-sm text-muted-foreground">
                  {user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'Unknown'}
                </div>
              </div>
              
              <div className="pt-4">
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}