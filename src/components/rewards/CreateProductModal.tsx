import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageUpload } from '@/components/ImageUpload';
import { VideoUpload } from '@/components/VideoUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCreateRewardsProduct } from '@/hooks/useCreateRewardsProduct';
import { useUpdateRewardsProduct } from '@/hooks/useUpdateRewardsProduct';
import { formatCoinsAsCurrency } from '@/utils/currency';
import type { RewardsProduct } from '@/types/rewardsProduct';

interface CreateProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProduct?: RewardsProduct;
}

export const CreateProductModal = ({ open, onOpenChange, editProduct }: CreateProductModalProps) => {
  const { user } = useAuth();
  const createProduct = useCreateRewardsProduct();
  const updateProduct = useUpdateRewardsProduct();
  
  const [title, setTitle] = useState(editProduct?.title || '');
  const [description, setDescription] = useState(editProduct?.description || '');
  const [coinPrice, setCoinPrice] = useState(editProduct?.coin_price?.toString() || '');
  const [hasQuantityLimit, setHasQuantityLimit] = useState(!!editProduct?.quantity_available);
  const [quantityAvailable, setQuantityAvailable] = useState(editProduct?.quantity_available?.toString() || '1');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState(editProduct?.product_image_url || '');
  const [existingVideoUrl, setExistingVideoUrl] = useState(editProduct?.product_video_url || '');
  const [isUploading, setIsUploading] = useState(false);

  // Sync form state with editProduct when modal opens or editProduct changes
  useEffect(() => {
    if (open && editProduct) {
      setTitle(editProduct.title || '');
      setDescription(editProduct.description || '');
      setCoinPrice(editProduct.coin_price?.toString() || '');
      setHasQuantityLimit(!!editProduct.quantity_available);
      setQuantityAvailable(editProduct.quantity_available?.toString() || '1');
      setExistingImageUrl(editProduct.product_image_url || '');
      setExistingVideoUrl(editProduct.product_video_url || '');
      setUploadedImage(null);
      setUploadedVideo(null);
    } else if (open && !editProduct) {
      resetForm();
    }
  }, [open, editProduct]);

  const handleImageSelect = (file: File) => {
    setUploadedImage(file);
  };

  const handleVideoSelect = (file: File) => {
    setUploadedVideo(file);
  };

  const uploadImage = async (): Promise<string | undefined> => {
    if (!uploadedImage || !user?.id) return existingImageUrl || undefined;

    try {
      const fileExt = uploadedImage.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('kid-rewards-images')
        .upload(fileName, uploadedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('kid-rewards-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const uploadVideo = async (): Promise<string | undefined> => {
    if (!uploadedVideo || !user?.id) return existingVideoUrl || undefined;

    try {
      const fileExt = uploadedVideo.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('kid-rewards-images')
        .upload(fileName, uploadedVideo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('kid-rewards-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsUploading(true);
    try {
      const productImageUrl = await uploadImage();
      const productVideoUrl = await uploadVideo();

      const productData = {
        title,
        description: description || undefined,
        coin_price: parseInt(coinPrice),
        product_image_url: productImageUrl,
        product_video_url: productVideoUrl,
        quantity_available: hasQuantityLimit ? parseInt(quantityAvailable) : undefined,
      };

      if (editProduct) {
        updateProduct.mutate(
          { id: editProduct.id, updates: productData },
          {
            onSuccess: () => {
              onOpenChange(false);
              resetForm();
            },
          }
        );
      } else {
        createProduct.mutate(productData, {
          onSuccess: () => {
            onOpenChange(false);
            resetForm();
          },
        });
      }
    } catch (error) {
      console.error('Error submitting product:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCoinPrice('');
    setHasQuantityLimit(false);
    setQuantityAvailable('1');
    setUploadedImage(null);
    setUploadedVideo(null);
    setExistingImageUrl('');
    setExistingVideoUrl('');
  };

  const coins = parseInt(coinPrice) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editProduct ? 'Edit' : 'Create'} Reward Product</DialogTitle>
          <DialogDescription>
            Create rewards that your kids can purchase with their earned coins
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="h-48">
                <ImageUpload onImageSelect={handleImageSelect} />
              </div>
              {existingImageUrl && !uploadedImage && (
                <img src={existingImageUrl} alt="Current" className="w-32 h-32 object-cover rounded-lg" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Product Video (Portrait)</Label>
              <div className="h-48">
                <VideoUpload onVideoSelect={handleVideoSelect} />
              </div>
              {existingVideoUrl && !uploadedVideo && (
                <video src={existingVideoUrl} className="w-32 h-48 object-cover rounded-lg" controls />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Ice Cream Trip, New Toy"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about this reward"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Coin Price *</Label>
            <Input
              id="price"
              type="number"
              min="1"
              value={coinPrice}
              onChange={(e) => setCoinPrice(e.target.value)}
              placeholder="100"
              required
            />
            <p className="text-xs text-muted-foreground">
              {coins > 0 && `${coins} coins = ${formatCoinsAsCurrency(coins)}`}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="quantity"
                checked={hasQuantityLimit}
                onCheckedChange={(checked) => setHasQuantityLimit(checked as boolean)}
              />
              <Label htmlFor="quantity" className="cursor-pointer">
                Limit quantity available
              </Label>
            </div>

            {hasQuantityLimit && (
              <Input
                type="number"
                min="0"
                value={quantityAvailable}
                onChange={(e) => setQuantityAvailable(e.target.value)}
                placeholder="How many times can this be purchased?"
              />
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !title ||
                !coinPrice ||
                isUploading ||
                createProduct.isPending ||
                updateProduct.isPending
              }
            >
              {isUploading
                ? 'Uploading...'
                : createProduct.isPending || updateProduct.isPending
                ? 'Saving...'
                : editProduct
                ? 'Update'
                : 'Create'} Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
