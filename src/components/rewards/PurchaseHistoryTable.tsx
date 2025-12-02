import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Check, Clock, X } from 'lucide-react';
import { formatPenniesAsCurrency } from '@/utils/currency';
import { format } from 'date-fns';
import type { KidPurchaseWithDetails } from '@/types/kidPurchase';
import { useFulfillPurchase } from '@/hooks/useFulfillPurchase';

interface PurchaseHistoryTableProps {
  purchases: KidPurchaseWithDetails[];
}

export const PurchaseHistoryTable = ({ purchases }: PurchaseHistoryTableProps) => {
  const [fulfillNotes, setFulfillNotes] = useState<Record<string, string>>({});
  const fulfillPurchase = useFulfillPurchase();

  const handleFulfill = (purchaseId: string) => {
    fulfillPurchase.mutate({
      purchaseId,
      notes: fulfillNotes[purchaseId] || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'fulfilled':
        return (
          <Badge variant="default" className="bg-green-500">
            <Check className="w-3 h-3 mr-1" />
            Fulfilled
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <X className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  if (purchases.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No purchases yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => (
        <Card key={purchase.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={purchase.kid_profiles?.profile_image_url} />
                  <AvatarFallback>
                    {purchase.kid_profiles?.first_name?.[0]}
                    {purchase.kid_profiles?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">
                    {purchase.kid_profiles?.first_name} {purchase.kid_profiles?.last_name}
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(purchase.purchased_at), 'PPp')}
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(purchase.purchase_status)}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {purchase.kid_rewards_products?.product_image_url && (
                <img
                  src={purchase.kid_rewards_products.product_image_url}
                  alt={purchase.kid_rewards_products.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{purchase.kid_rewards_products?.title}</p>
                <p className="text-sm text-muted-foreground">
                  {purchase.coins_spent} pennies ({formatPenniesAsCurrency(purchase.coins_spent)})
                </p>
              </div>
            </div>

            {purchase.purchase_status === 'pending' && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Add notes (optional)"
                  value={fulfillNotes[purchase.id] || ''}
                  onChange={(e) =>
                    setFulfillNotes((prev) => ({ ...prev, [purchase.id]: e.target.value }))
                  }
                  rows={2}
                />
                <Button
                  onClick={() => handleFulfill(purchase.id)}
                  disabled={fulfillPurchase.isPending}
                  className="w-full"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Fulfilled
                </Button>
              </div>
            )}

            {purchase.purchase_status === 'fulfilled' && purchase.fulfilled_at && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Fulfilled on {format(new Date(purchase.fulfilled_at), 'PPp')}</p>
                {purchase.notes && (
                  <p className="text-foreground">Note: {purchase.notes}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
