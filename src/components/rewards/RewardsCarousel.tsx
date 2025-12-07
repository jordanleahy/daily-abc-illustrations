import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { RewardsCarouselCard } from './RewardsCarouselCard';
import { PurchaseConfirmDialog } from './PurchaseConfirmDialog';
import { usePurchaseReward } from '@/hooks/usePurchaseReward';
import { RewardsProduct } from '@/types/rewardsProduct';
import { LIBRARY_CONFIG } from '@/config/library';
import { LIBRARY_STYLES } from '@/styles/library.styles';

interface RewardsCarouselProps {
  products: RewardsProduct[];
  kidId: string;
  currentCoins: number;
}

export const RewardsCarousel = memo(({
  products,
  kidId,
  currentCoins,
}: RewardsCarouselProps) => {
  const [selectedProduct, setSelectedProduct] = useState<RewardsProduct | null>(null);
  const { mutate: purchaseReward, isPending } = usePurchaseReward();
  const navigate = useNavigate();

  if (products.length === 0) return null;

  const handlePurchase = () => {
    if (!selectedProduct) return;
    
    purchaseReward({
      kidProfileId: kidId,
      productId: selectedProduct.id,
    }, {
      onSuccess: () => {
        setSelectedProduct(null);
        // Store return time (10 minutes from now) and navigate to videos
        const returnTime = Date.now() + 10 * 60 * 1000; // 10 minutes
        localStorage.setItem('returnHomeAt', returnTime.toString());
        navigate('/videos');
      },
    });
  };

  return (
    <section className={LIBRARY_STYLES.carousel.section}>
      {/* Section header */}
      <div className={LIBRARY_STYLES.carousel.header}>
        <h2 className={LIBRARY_STYLES.carousel.title}>
          <ShoppingBag className={`${LIBRARY_STYLES.carousel.icon} text-primary`} />
          <span>Rewards</span>
        </h2>
      </div>

      {/* Carousel */}
      <Carousel
        opts={LIBRARY_CONFIG.CAROUSEL}
        className={LIBRARY_STYLES.carousel.wrapper}
      >
        <CarouselContent className={LIBRARY_STYLES.carousel.content}>
          {products.map((product, index) => (
            <CarouselItem
              key={product.id}
              className={LIBRARY_STYLES.carousel.item}
            >
              <RewardsCarouselCard
                product={product}
                onClick={() => setSelectedProduct(product)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>

      {/* Purchase Modal */}
      <PurchaseConfirmDialog
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
        product={selectedProduct}
        currentPennies={currentCoins}
        onConfirm={handlePurchase}
      />
    </section>
  );
});

RewardsCarousel.displayName = 'RewardsCarousel';
