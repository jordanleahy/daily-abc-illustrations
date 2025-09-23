import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const DirectExpireFix = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDirectFix = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('direct-fix-expiration', {
        body: {}
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: 'Success!',
          description: data.message,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update expiration',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Direct Database Fix</CardTitle>
        <CardDescription>
          Directly update the database without authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleDirectFix}
          disabled={isLoading}
          className="w-full"
          variant="destructive"
        >
          {isLoading ? 'Updating...' : 'Fix Expiration Directly'}
        </Button>
        
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Or run this SQL manually in Supabase Dashboard:</strong></p>
          <div className="bg-muted p-3 rounded font-mono text-xs">
            UPDATE daily_published<br/>
            SET expires_at = '2025-09-23 11:01:00+00'<br/>
            WHERE id = 'de383fdd-adad-482d-afd1-30baa88f6ea0';
          </div>
        </div>
      </CardContent>
    </Card>
  );
};