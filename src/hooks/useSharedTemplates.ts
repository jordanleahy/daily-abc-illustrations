import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SharedTemplate {
  id: string;
  template_key: string;
  version_number: number;
  content: string;
  is_latest: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  change_notes: string | null;
}

export const useSharedTemplates = () => {
  return useQuery({
    queryKey: ['shared-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_page_templates')
        .select('*')
        .eq('is_latest', true)
        .order('template_key');

      if (error) throw error;
      return data as SharedTemplate[];
    },
  });
};

export const useSharedTemplateVersions = (templateKey: string) => {
  return useQuery({
    queryKey: ['shared-template-versions', templateKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_page_templates')
        .select('*')
        .eq('template_key', templateKey)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data as SharedTemplate[];
    },
    enabled: !!templateKey,
  });
};

export const useUpdateSharedTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateKey,
      content,
      changeNotes,
    }: {
      templateKey: string;
      content: string;
      changeNotes?: string;
    }) => {
      // Get current version
      const { data: current, error: fetchError } = await supabase
        .from('shared_page_templates')
        .select('version_number')
        .eq('template_key', templateKey)
        .eq('is_latest', true)
        .single();

      if (fetchError) throw fetchError;

      const newVersion = (current?.version_number || 0) + 1;

      // Mark old version as not latest
      const { error: updateError } = await supabase
        .from('shared_page_templates')
        .update({ is_latest: false })
        .eq('template_key', templateKey)
        .eq('is_latest', true);

      if (updateError) throw updateError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Insert new version
      const { data, error: insertError } = await supabase
        .from('shared_page_templates')
        .insert({
          template_key: templateKey,
          version_number: newVersion,
          content,
          is_latest: true,
          is_active: true,
          created_by: user?.id,
          change_notes: changeNotes || `Updated to v${newVersion}`,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-templates'] });
      queryClient.invalidateQueries({ queryKey: ['shared-template-versions'] });
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update template:', error);
      toast.error('Failed to update template');
    },
  });
};

export const useRestoreTemplateVersion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateKey,
      versionToRestore,
    }: {
      templateKey: string;
      versionToRestore: SharedTemplate;
    }) => {
      // Get current latest version number
      const { data: current, error: fetchError } = await supabase
        .from('shared_page_templates')
        .select('version_number')
        .eq('template_key', templateKey)
        .eq('is_latest', true)
        .single();

      if (fetchError) throw fetchError;

      const newVersion = (current?.version_number || 0) + 1;

      // Mark old version as not latest
      await supabase
        .from('shared_page_templates')
        .update({ is_latest: false })
        .eq('template_key', templateKey)
        .eq('is_latest', true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Insert restored version as new latest
      const { data, error: insertError } = await supabase
        .from('shared_page_templates')
        .insert({
          template_key: templateKey,
          version_number: newVersion,
          content: versionToRestore.content,
          is_latest: true,
          is_active: true,
          created_by: user?.id,
          change_notes: `Restored from v${versionToRestore.version_number}`,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-templates'] });
      queryClient.invalidateQueries({ queryKey: ['shared-template-versions'] });
      toast.success('Template version restored');
    },
    onError: (error) => {
      console.error('Failed to restore template:', error);
      toast.error('Failed to restore template version');
    },
  });
};
