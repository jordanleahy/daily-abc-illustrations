import { Button } from '@/components/ui/button';
import { useAdminUpdateExpiration } from '@/hooks/useAdminUpdateExpiration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const AdminExpireFix = () => {
  const adminUpdateExpiration = useAdminUpdateExpiration();

  const handleFixExpiration = () => {
    adminUpdateExpiration.mutate({
      dailyPublishedId: 'de383fdd-adad-482d-afd1-30baa88f6ea0',
      newExpiresAt: '2025-09-23 11:01:00+00'
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Admin: Fix Expiration</CardTitle>
        <CardDescription>
          Update the current active content to expire tomorrow (Sept 23) at 7:01 AM ET
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleFixExpiration}
          disabled={adminUpdateExpiration.isPending}
          className="w-full"
        >
          {adminUpdateExpiration.isPending ? 'Updating...' : 'Fix Expiration Date'}
        </Button>
      </CardContent>
    </Card>
  );
};