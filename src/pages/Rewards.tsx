import { useState } from 'react';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { useAuth } from '@/hooks/useAuth';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { LoadingState } from '@/components/ui/loading-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Coins, BookOpen, Star, ShoppingBag, Package, Plus, UserPlus } from 'lucide-react';
import { RewardContainer } from '@/components/ui/reward-container';
import { CoinCounter } from '@/components/ui/coin-counter';
import { ProductCard } from '@/components/rewards/ProductCard';
import { PurchaseConfirmDialog } from '@/components/rewards/PurchaseConfirmDialog';
import { useRewardsProducts } from '@/hooks/useRewardsProducts';
import { usePurchaseReward } from '@/hooks/usePurchaseReward';
import { useKidPurchases } from '@/hooks/useKidPurchases';
import { useRewardsImagePreloader } from '@/hooks/useRewardsImagePreloader';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import type { RewardsProduct } from '@/types/rewardsProduct';
import { AddKidModal } from '@/components/profile/AddKidModal';

export default function Rewards() {
  const { user, loading: authLoading } = useAuth();
  const { data: kidProfiles, isLoading } = useKidProfiles();
  const [selectedKidId, setSelectedKidId] = useState<string>('');
  const [purchaseProduct, setPurchaseProduct] = useState<RewardsProduct | null>(null);
  const [showAddKidModal, setShowAddKidModal] = useState(false);
  
  const { data: products } = useRewardsProducts();
  const { data: purchases } = useKidPurchases(selectedKidId || kidProfiles?.[0]?.id);
  const purchaseReward = usePurchaseReward();
  
  // Preload product images for instant display
  useRewardsImagePreloader(products);

  const activeProducts = products?.filter((p) => p.is_active && (p.quantity_available === null || p.quantity_available > 0)) || [];
  const kidPurchases = purchases?.filter((p) => p.kid_profile_id === (selectedKidId || kidProfiles?.[0]?.id)) || [];

  // Redirect if not authenticated
  if (authLoading) {
    return <LoadingState text="Loading..." />;
  }

  if (!user) {
    return (
      <StandardPageLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Please sign in to view rewards.</p>
        </div>
      </StandardPageLayout>
    );
  }

  if (isLoading) {
    return (
      <StandardPageLayout>
        <LoadingState text="Loading rewards..." />
      </StandardPageLayout>
    );
  }

  if (!kidProfiles || kidProfiles.length === 0) {
    return (
      <StandardPageLayout>
        <div className="container max-w-4xl mx-auto p-6 space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Reading Rewards</h1>
            <p className="text-muted-foreground">
              Track your reading progress and collect coins!
            </p>
          </div>

          {/* Hero CTA Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2">
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-4">
                <UserPlus className="mx-auto h-16 w-16 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">Add Your Kid to Get Started</h2>
                  <p className="text-muted-foreground">
                    Create a profile to track reading progress and earn rewards
                  </p>
                </div>
                <Button onClick={() => setShowAddKidModal(true)} size="lg" className="mt-4">
                  <Plus className="mr-2 h-5 w-5" />
                  Add Your First Kid
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Preview */}
          <div className="space-y-6">
            {/* Earned Rewards Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Earned Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Start Reading to Earn Coins!</h3>
                  <p className="text-muted-foreground">
                    Read ABC books to start collecting your first coins.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Progress Encouragement */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Keep Reading!</h3>
                  <p className="text-muted-foreground">
                    Every page you read earns you more coins. 
                    Visit the daily books to continue your reading adventure!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Rewards Store Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Rewards Store
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Build Your Rewards Store</h3>
                  <p className="text-muted-foreground mb-4">
                    Add rewards that your kids can purchase with their earned coins.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Final CTA */}
          <div className="text-center pt-4">
            <Button onClick={() => setShowAddKidModal(true)} size="lg" variant="outline">
              Set Up Kid Profile Now
            </Button>
          </div>
        </div>
        <AddKidModal open={showAddKidModal} onOpenChange={setShowAddKidModal} />
      </StandardPageLayout>
    );
  }

  // Auto-select first kid if none selected
  const currentKid = selectedKidId 
    ? kidProfiles.find(kid => kid.id === selectedKidId)
    : kidProfiles[0];

  if (!currentKid && !selectedKidId && kidProfiles.length > 0) {
    setSelectedKidId(kidProfiles[0].id);
  }

  const handleBuyProduct = (product: RewardsProduct) => {
    setPurchaseProduct(product);
  };

  const handleConfirmPurchase = () => {
    if (!purchaseProduct || !currentKid) return;

    purchaseReward.mutate(
      {
        kidProfileId: currentKid.id,
        productId: purchaseProduct.id,
      },
      {
        onSuccess: () => {
          setPurchaseProduct(null);
        },
      }
    );
  };

  return (
    <StandardPageLayout>
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reading Rewards</h1>
          <p className="text-muted-foreground">
            Track your reading progress and collect coins!
          </p>
        </div>

        {kidProfiles.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Select Kid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedKidId || kidProfiles[0]?.id} onValueChange={setSelectedKidId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a kid to view rewards" />
                </SelectTrigger>
                <SelectContent>
                  {kidProfiles.map((kid) => (
                    <SelectItem key={kid.id} value={kid.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={kid.profile_image_url} />
                          <AvatarFallback>
                            {kid.first_name[0]}{kid.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {kid.first_name} {kid.last_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {currentKid && (
          <div className="space-y-6">
            {/* Kid Info & Coin Balance */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={currentKid.profile_image_url} />
                      <AvatarFallback className="text-xl">
                        {currentKid.first_name[0]}{currentKid.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {currentKid.first_name} {currentKid.last_name}
                      </h2>
                      <p className="text-muted-foreground">Reading Champion</p>
                    </div>
                  </div>
                  <CoinCounter coins={currentKid.earned_coins || 0} size="md" />
                </div>
              </CardContent>
            </Card>

            {/* Coin Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Earned Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentKid.earned_coins > 0 ? (
                  <div className="bg-muted/50 rounded-lg">
                    <RewardContainer earnedRewards={currentKid.earned_coins} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Start Reading to Earn Coins!</h3>
                    <p className="text-muted-foreground">
                      Read ABC books to start collecting your first coins.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Encouragement */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Keep Reading!</h3>
                  <p className="text-muted-foreground">
                    Every page you read earns you more coins. 
                    Visit the daily books to continue your reading adventure!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Rewards Store */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Rewards Store
                  </CardTitle>
                  {user && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/rewards/manage">
                        <Package className="h-4 w-4 mr-2" />
                        Manage Store
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {activeProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Rewards Yet!</h3>
                    <p className="text-muted-foreground mb-4">
                      Add rewards to your store that your kids can purchase with their earned coins.
                    </p>
                    <Button variant="outline" asChild>
                      <Link to="/rewards/manage">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Reward
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeProducts.map((product) => {
                      const canAfford = (currentKid.earned_coins || 0) >= product.coin_price;
                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          mode="kid"
                          canAfford={canAfford}
                          onBuy={() => handleBuyProduct(product)}
                          isPurchasing={purchaseReward.isPending}
                        />
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Purchases */}
            {kidPurchases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    My Purchases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {kidPurchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {purchase.kid_rewards_products?.product_image_url && (
                            <img
                              src={purchase.kid_rewards_products.product_image_url}
                              alt={purchase.kid_rewards_products.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">
                              {purchase.kid_rewards_products?.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(purchase.purchased_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        {purchase.purchase_status === 'pending' && (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        {purchase.purchase_status === 'fulfilled' && (
                          <Badge variant="default" className="bg-green-500">Fulfilled!</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <PurchaseConfirmDialog
          open={!!purchaseProduct}
          onOpenChange={(open) => !open && setPurchaseProduct(null)}
          product={purchaseProduct}
          currentCoins={currentKid?.earned_coins || 0}
          onConfirm={handleConfirmPurchase}
        />
      </div>
    </StandardPageLayout>
  );
}