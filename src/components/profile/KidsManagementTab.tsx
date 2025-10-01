import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, User, Lock, Crown } from 'lucide-react';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { KidProfileCard } from './KidProfileCard';
import { AddKidModal } from './AddKidModal';
import { EditKidModal } from './EditKidModal';
import { KidProfile } from '@/hooks/useKidProfiles';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';
import { useAuthContext } from '@/contexts/AuthContext';

export const KidsManagementTab = () => {
  const { data: kids, isLoading } = useKidProfiles();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingKid, setEditingKid] = useState<KidProfile | null>(null);
  const { isAuthenticated } = useAuthContext();
  const { hasActiveSubscription, createCheckoutSession } = useSubscription();

  const handleUpgradeClick = async () => {
    await createCheckoutSession(SUBSCRIPTION_TIERS.standard_monthly.price_id);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-24 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Kids Profiles</h3>
          <p className="text-sm text-muted-foreground">
            Manage profiles for your children
          </p>
        </div>
        {hasActiveSubscription ? (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Kid
          </Button>
        ) : (
          <Button onClick={handleUpgradeClick} variant="default">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Add Kids
          </Button>
        )}
      </div>

      {!hasActiveSubscription && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">Premium Feature</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
              Kids Profiles is a premium feature. Upgrade your subscription to create and manage profiles for your children.
            </p>
            <Button onClick={handleUpgradeClick}>
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      {hasActiveSubscription && kids && kids.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kids.map((kid) => (
            <KidProfileCard
              key={kid.id}
              kid={kid}
              onEdit={() => setEditingKid(kid)}
            />
          ))}
        </div>
      )}

      {hasActiveSubscription && (!kids || kids.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No kids added yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Add your first kid profile to get started
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Kid
            </Button>
          </CardContent>
        </Card>
      )}

      <AddKidModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />

      <EditKidModal
        kid={editingKid}
        open={!!editingKid}
        onOpenChange={(open) => !open && setEditingKid(null)}
      />
    </div>
  );
};