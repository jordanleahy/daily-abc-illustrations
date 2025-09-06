import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Calendar } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useAuth } from '@/hooks/useAuth';

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
      <CardHeader className="pb-4 md:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <User className="w-5 h-5" />
          Edit Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name fields - always stacked on mobile for better UX */}
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={updateProfile.isPending}
                className="h-12 md:h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={updateProfile.isPending}
                className="h-12 md:h-10"
              />
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-2 pt-4 border-t border-border/50">
            <Label className="text-sm font-medium">Email</Label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-muted h-12 md:h-10"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed from this page
            </p>
          </div>

          {/* Member since field */}
          <div className="space-y-2 pt-4 border-t border-border/50">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              Member Since
            </Label>
            <Input
              value={new Date(profile.created_at).toLocaleDateString()}
              disabled
              className="bg-muted h-12 md:h-10"
            />
          </div>

          {/* Action buttons - stacked on mobile, side by side on desktop */}
          <div className="flex flex-col md:flex-row gap-3 pt-6">
            <Button
              type="submit"
              disabled={updateProfile.isPending || !isChanged}
              className="flex-1 h-12 md:h-10 order-2 md:order-1"
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
              className="h-12 md:h-10 md:w-auto order-1 md:order-2"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};