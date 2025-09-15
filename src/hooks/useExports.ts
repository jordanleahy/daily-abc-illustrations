import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Export, CreateExportRequest } from '@/types/export';
import { ProcessStatus } from '@/types/process';
import { toast } from '@/hooks/use-toast';

export const useExports = (contentType?: string, contentId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: exports = [], isLoading, error, refetch } = useQuery({
    queryKey: ['exports', user?.id, contentType, contentId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('exports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (contentType && contentId) {
        query = query
          .eq('content_type', contentType)
          .eq('content_id', contentId);
      }

      const { data: exportsData, error: exportsError } = await query;

      if (exportsError) {
        console.error('Error fetching exports:', exportsError);
        toast({
          variant: "destructive",
          title: "Failed to load exports",
          description: exportsError.message
        });
        throw exportsError;
      }

      return (exportsData || []) as Export[];
    },
    enabled: !!user?.id,
  });

  // Create export mutation
  const createExportMutation = useMutation({
    mutationFn: async (request: CreateExportRequest): Promise<Export> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('exports')
        .insert({
          ...request,
          user_id: user.id,
          export_status: ProcessStatus.NOT_STARTED
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating export:', error);
        toast({
          variant: "destructive",
          title: "Failed to create export",
          description: error.message
        });
        throw error;
      }

      return data as Export;
    },
    onSuccess: (newExport) => {
      const queryKey = ['exports', user?.id, contentType, contentId];
      queryClient.setQueryData(queryKey, (old: Export[] = []) => [newExport, ...old]);
    }
  });

  // Update export mutation
  const updateExportMutation = useMutation({
    mutationFn: async ({ exportId, updates }: { exportId: string; updates: Partial<Export> }): Promise<Export> => {
      const { data, error } = await supabase
        .from('exports')
        .update(updates)
        .eq('id', exportId)
        .select()
        .single();

      if (error) {
        console.error('Error updating export:', error);
        toast({
          variant: "destructive",
          title: "Failed to update export",
          description: error.message
        });
        throw error;
      }

      return data as Export;
    },
    onSuccess: (updatedExport) => {
      const queryKey = ['exports', user?.id, contentType, contentId];
      queryClient.setQueryData(queryKey, (old: Export[] = []) =>
        old.map(exp => exp.id === updatedExport.id ? updatedExport : exp)
      );
    }
  });

  // Delete export mutation
  const deleteExportMutation = useMutation({
    mutationFn: async (exportId: string): Promise<void> => {
      const { error } = await supabase
        .from('exports')
        .delete()
        .eq('id', exportId);

      if (error) {
        console.error('Error deleting export:', error);
        toast({
          variant: "destructive",
          title: "Failed to delete export",
          description: error.message
        });
        throw error;
      }
    },
    onSuccess: (_, deletedId) => {
      const queryKey = ['exports', user?.id, contentType, contentId];
      queryClient.setQueryData(queryKey, (old: Export[] = []) =>
        old.filter(exp => exp.id !== deletedId)
      );
    }
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    let channelFilter = `user_id=eq.${user.id}`;
    if (contentType && contentId) {
      channelFilter += `,content_type=eq.${contentType},content_id=eq.${contentId}`;
    }

    const channel = supabase
      .channel('exports-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exports',
          filter: channelFilter
        },
        (payload) => {
          console.log('Export inserted:', payload.new);
          const queryKey = ['exports', user.id, contentType, contentId];
          queryClient.setQueryData(queryKey, (old: Export[] = []) => [payload.new as Export, ...old]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exports',
          filter: channelFilter
        },
        (payload) => {
          console.log('Export updated:', payload.new);
          const updatedExport = payload.new as Export;
          const queryKey = ['exports', user.id, contentType, contentId];
          queryClient.setQueryData(queryKey, (old: Export[] = []) =>
            old.map(exp => exp.id === updatedExport.id ? updatedExport : exp)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'exports',
          filter: channelFilter
        },
        (payload) => {
          console.log('Export deleted:', payload.old);
          const queryKey = ['exports', user.id, contentType, contentId];
          queryClient.setQueryData(queryKey, (old: Export[] = []) =>
            old.filter(exp => exp.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, contentType, contentId]);

  return {
    exports,
    loading: isLoading,
    error,
    createExport: createExportMutation.mutateAsync,
    updateExport: (exportId: string, updates: Partial<Export>) => 
      updateExportMutation.mutateAsync({ exportId, updates }),
    deleteExport: deleteExportMutation.mutateAsync,
    refetch
  };
};