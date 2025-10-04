-- Create kid_rewards_products table
CREATE TABLE public.kid_rewards_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  coin_price INTEGER NOT NULL CHECK (coin_price > 0),
  product_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  quantity_available INTEGER CHECK (quantity_available IS NULL OR quantity_available >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kid_purchases table
CREATE TABLE public.kid_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.kid_rewards_products(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coins_spent INTEGER NOT NULL,
  purchase_status TEXT NOT NULL DEFAULT 'pending' CHECK (purchase_status IN ('pending', 'fulfilled', 'cancelled')),
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('kid-rewards-images', 'kid-rewards-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.kid_rewards_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kid_rewards_products

-- Parents can create their own products
CREATE POLICY "Parents can create their own products"
ON public.kid_rewards_products
FOR INSERT
TO authenticated
WITH CHECK (parent_user_id = auth.uid());

-- Parents can view their own products
CREATE POLICY "Parents can view their own products"
ON public.kid_rewards_products
FOR SELECT
TO authenticated
USING (parent_user_id = auth.uid());

-- Parents can update their own products
CREATE POLICY "Parents can update their own products"
ON public.kid_rewards_products
FOR UPDATE
TO authenticated
USING (parent_user_id = auth.uid());

-- Parents can delete their own products
CREATE POLICY "Parents can delete their own products"
ON public.kid_rewards_products
FOR DELETE
TO authenticated
USING (parent_user_id = auth.uid());

-- Kids can view products belonging to their parent
CREATE POLICY "Kids can view their parent's products"
ON public.kid_rewards_products
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM public.kid_profiles
    WHERE kid_profiles.parent_user_id = kid_rewards_products.parent_user_id
    AND kid_profiles.id IN (
      SELECT id FROM public.kid_profiles WHERE parent_user_id = auth.uid()
    )
  )
);

-- Admins can view all products
CREATE POLICY "Admins can view all products"
ON public.kid_rewards_products
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for kid_purchases

-- Parents can insert purchases on behalf of their kids
CREATE POLICY "Parents can create purchases for their kids"
ON public.kid_purchases
FOR INSERT
TO authenticated
WITH CHECK (
  parent_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.kid_profiles
    WHERE kid_profiles.id = kid_purchases.kid_profile_id
    AND kid_profiles.parent_user_id = auth.uid()
  )
);

-- Kids can view their own purchases (via parent relationship)
CREATE POLICY "Kids can view their own purchases"
ON public.kid_purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.kid_profiles
    WHERE kid_profiles.id = kid_purchases.kid_profile_id
    AND kid_profiles.parent_user_id = auth.uid()
  )
);

-- Parents can view purchases for their kids
CREATE POLICY "Parents can view purchases for their kids"
ON public.kid_purchases
FOR SELECT
TO authenticated
USING (parent_user_id = auth.uid());

-- Parents can update purchase status
CREATE POLICY "Parents can update purchases for their kids"
ON public.kid_purchases
FOR UPDATE
TO authenticated
USING (parent_user_id = auth.uid());

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
ON public.kid_purchases
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for kid-rewards-images

-- Parents can upload product images
CREATE POLICY "Parents can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kid-rewards-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Parents can update their product images
CREATE POLICY "Parents can update their product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kid-rewards-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Parents can delete their product images
CREATE POLICY "Parents can delete their product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kid-rewards-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view product images (public bucket)
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'kid-rewards-images');

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_kid_rewards_products_updated_at
BEFORE UPDATE ON public.kid_rewards_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kid_purchases_updated_at
BEFORE UPDATE ON public.kid_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();