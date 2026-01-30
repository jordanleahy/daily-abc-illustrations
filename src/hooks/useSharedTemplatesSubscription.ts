import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSharedTemplatesSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('shared-templates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_page_templates',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['shared-templates'] });
          queryClient.invalidateQueries({ queryKey: ['shared-template-versions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
