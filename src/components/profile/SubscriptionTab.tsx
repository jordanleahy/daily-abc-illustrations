import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';

export function SubscriptionTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Subscription & Billing</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription plan and billing information.
        </p>
      </div>

      <SubscriptionStatus showActions={true} />
    </div>
  );
}