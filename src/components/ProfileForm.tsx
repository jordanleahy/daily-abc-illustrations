import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Calendar } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useAuth } from '@/hooks/useClerkAuth';

interface ProfileFormProps {
  profile: {
    first_name: string;
    last_name: string;
    created_at: string;
  };
  onCancel: () => void;
}

export const ProfileForm = ({ profile, onCancel }: ProfileFormProps) => {
  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      { first_name: firstName, last_name: lastName },
      { onSuccess: onCancel }
    );
  };

  const isChanged = firstName !== profile.first_name || lastName !== profile.last_name;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Edit Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={updateProfile.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={updateProfile.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={user?.primaryEmailAddress?.emailAddress || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed from this page
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Member Since
            </Label>
            <Input
              value={new Date(profile.created_at).toLocaleDateString()}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={updateProfile.isPending || !isChanged}
              className="flex-1"
            >
              {updateProfile.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={updateProfile.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};