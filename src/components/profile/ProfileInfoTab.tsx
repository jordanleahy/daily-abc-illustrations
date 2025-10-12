import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export function ProfileInfoTab() {
  const { user } = useAuthContext();
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
    <div className="space-y-3">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="memberSince">Member Since</Label>
              <Input
                id="memberSince"
                value={user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : ''}
                disabled
                className="bg-muted text-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              type="submit" 
              size="sm"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Full Name</Label>
              <div className="text-sm font-medium">
                {profile.first_name || profile.last_name 
                  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                  : 'Not set'
                }
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="text-sm">{user?.email}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Member Since</Label>
              <div className="text-sm">
                {user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'Unknown'}
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <Button onClick={() => setIsEditing(true)} size="sm">
              Edit Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}