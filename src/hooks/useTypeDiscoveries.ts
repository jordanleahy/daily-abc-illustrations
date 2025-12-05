import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface DiscoveryOption {
  key: string;
  label: string;
}

export interface TypeSpecificDiscovery {
  id: string;
  agent_type: string;
  question_key: string;
  question_text: string;
  options: DiscoveryOption[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTypeDiscoveries = (agentType?: string) => {
  return useQuery({
    queryKey: ['type-discoveries', agentType],
    queryFn: async () => {
      let query = supabase
        .from('type_specific_discoveries')
        .select('*')
        .order('agent_type', { ascending: true })
        .order('sort_order', { ascending: true });

      if (agentType) {
        query = query.eq('agent_type', agentType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        options: (d.options as unknown as DiscoveryOption[]) || []
      })) as TypeSpecificDiscovery[];
    },
  });
};

export const useTypeDiscoveryMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (discovery: Omit<TypeSpecificDiscovery, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('type_specific_discoveries')
        .insert({
          agent_type: discovery.agent_type,
          question_key: discovery.question_key,
          question_text: discovery.question_text,
          options: discovery.options as unknown as Json,
          sort_order: discovery.sort_order,
          is_active: discovery.is_active,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['type-discoveries'] });
      toast.success('Discovery question created');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TypeSpecificDiscovery> & { id: string }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      
      if (updates.agent_type !== undefined) updateData.agent_type = updates.agent_type;
      if (updates.question_key !== undefined) updateData.question_key = updates.question_key;
      if (updates.question_text !== undefined) updateData.question_text = updates.question_text;
      if (updates.options !== undefined) updateData.options = updates.options as unknown as Json;
      if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

      const { data, error } = await supabase
        .from('type_specific_discoveries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['type-discoveries'] });
      toast.success('Discovery question updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('type_specific_discoveries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['type-discoveries'] });
      toast.success('Discovery question deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
  };
};
