import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Trash2 } from 'lucide-react';
import { useDeleteKidProfile } from '@/hooks/useKidProfileMutations';
import { KidProfile } from '@/hooks/useKidProfiles';

interface KidProfileCardProps {
  kid: KidProfile;
  onEdit: () => void;
}

export const KidProfileCard: React.FC<KidProfileCardProps> = ({ kid, onEdit }) => {
  const deleteKidProfile = useDeleteKidProfile();

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove ${kid.first_name}'s profile?`)) {
      deleteKidProfile.mutate(kid.id);
    }
  };

  const getInitials = () => {
    return `${kid.first_name.charAt(0)}${kid.last_name.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-3">
          <Avatar className="w-16 h-16">
            <AvatarImage src={kid.profile_image_url} />
            <AvatarFallback className="text-lg font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center">
            <h4 className="font-medium">
              {kid.first_name} {kid.last_name}
            </h4>
            <p className="text-sm text-muted-foreground">
              Added {new Date(kid.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex space-x-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1"
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteKidProfile.isPending}
              className="flex-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};