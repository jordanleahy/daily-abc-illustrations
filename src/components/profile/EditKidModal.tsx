import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X } from 'lucide-react';
import { useUpdateKidProfile } from '@/hooks/useKidProfileMutations';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { KidProfile } from '@/hooks/useKidProfiles';

interface EditKidModalProps {
  kid: KidProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditKidModal: React.FC<EditKidModalProps> = ({ kid, open, onOpenChange }) => {
  const { user } = useAuthContext();
  const updateKidProfile = useUpdateKidProfile();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (kid) {
      setFirstName(kid.first_name);
      setLastName(kid.last_name);
      setImagePreview(kid.profile_image_url || '');
      setProfileImage(null);
    }
  }, [kid]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB');
        return;
      }

      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!profileImage || !user?.id || !kid?.id) return null;

    setIsUploading(true);
    try {
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${user.id}/${kid.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('kid-profile-images')
        .upload(fileName, profileImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('kid-profile-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!kid || !firstName.trim() || !lastName.trim()) {
      alert('Please fill in both first and last name');
      return;
    }

    let imageUrl = kid.profile_image_url;
    
    if (profileImage) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    updateKidProfile.mutate(
      {
        id: kid.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        profile_image_url: imageUrl,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview('');
  };

  const getInitials = () => {
    if (!firstName || !lastName) return '?';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!kid) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Kid Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={imagePreview} />
                <AvatarFallback className="text-lg font-medium">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              {imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                  onClick={removeImage}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="edit-kid-image-upload"
              />
              <Label
                htmlFor="edit-kid-image-upload"
                className="cursor-pointer inline-flex items-center px-3 py-1 text-sm border rounded-md hover:bg-accent"
              >
                <Upload className="w-3 h-3 mr-2" />
                {imagePreview ? 'Change Photo' : 'Add Photo'}
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editFirstName">First Name</Label>
              <Input
                id="editFirstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editLastName">Last Name</Label>
              <Input
                id="editLastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateKidProfile.isPending || isUploading}
            >
              {updateKidProfile.isPending || isUploading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};