import { PageLayout } from "@/components/layout/PageLayout";
import { WireframePricing } from "@/components/subscription/WireframePricing";

const Subscription = () => {
  return (
    <PageLayout showHeader={true}>
      <WireframePricing />
    </PageLayout>
  );
};

export default Subscription;