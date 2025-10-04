import { useState } from 'react';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, PackagePlus } from 'lucide-react';
import { ProductCard } from '@/components/rewards/ProductCard';
import { CreateProductModal } from '@/components/rewards/CreateProductModal';
import { PurchaseHistoryTable } from '@/components/rewards/PurchaseHistoryTable';
import { useRewardsProducts } from '@/hooks/useRewardsProducts';
import { useDeleteRewardsProduct } from '@/hooks/useDeleteRewardsProduct';
import { useKidPurchases } from '@/hooks/useKidPurchases';
import { LoadingState } from '@/components/ui/loading-state';
import type { RewardsProduct } from '@/types/rewardsProduct';

const RewardsManage = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<RewardsProduct | undefined>();
  
  const { data: products, isLoading: productsLoading } = useRewardsProducts();
  const { data: purchases, isLoading: purchasesLoading } = useKidPurchases();
  const deleteProduct = useDeleteRewardsProduct();

  const activeProducts = products?.filter((p) => p.is_active) || [];
  const pendingPurchases = purchases?.filter((p) => p.purchase_status === 'pending') || [];
  const fulfilledPurchases = purchases?.filter((p) => p.purchase_status === 'fulfilled') || [];

  const handleEdit = (product: RewardsProduct) => {
    setEditProduct(product);
    setCreateModalOpen(true);
  };

  const handleDelete = (productId: string) => {
    if (confirm('Are you sure you want to remove this product?')) {
      deleteProduct.mutate(productId);
    }
  };

  const handleCloseModal = () => {
    setCreateModalOpen(false);
    setEditProduct(undefined);
  };

  return (
    <StandardPageLayout title="Manage Rewards Store">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Create rewards for your kids to purchase with their earned coins
        </p>
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">
              Products ({activeProducts.length})
            </TabsTrigger>
            <TabsTrigger value="purchases">
              Purchases ({pendingPurchases.length} pending)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Products</h2>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Product
              </Button>
            </div>

            {productsLoading ? (
              <LoadingState text="Loading products..." />
            ) : activeProducts.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <PackagePlus className="w-16 h-16 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="text-lg font-medium mb-2">No products yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first reward product for your kids to purchase
                  </p>
                  <Button onClick={() => setCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Product
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    mode="parent"
                    onEdit={() => handleEdit(product)}
                    onDelete={() => handleDelete(product.id)}
                    isDeleting={deleteProduct.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchases" className="space-y-4 mt-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Pending Purchases</h2>
              {purchasesLoading ? (
                <LoadingState text="Loading purchases..." />
              ) : (
                <PurchaseHistoryTable purchases={pendingPurchases} />
              )}
            </div>

            {fulfilledPurchases.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Fulfilled Purchases</h2>
                <PurchaseHistoryTable purchases={fulfilledPurchases} />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <CreateProductModal
          open={createModalOpen}
          onOpenChange={handleCloseModal}
          editProduct={editProduct}
        />
      </div>
    </StandardPageLayout>
  );
};

export default RewardsManage;
