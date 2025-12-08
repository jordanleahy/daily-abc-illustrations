import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BlogEditor } from '@/components/blog/BlogEditor';
import { BlogList } from '@/components/blog/BlogList';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageLayout } from '@/components/layout';

export default function BlogAdmin() {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
      toast({ title: 'Post deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete post', variant: 'destructive' });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-daily-blog-post');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
      toast({ title: data?.message || 'Blog post generated!' });
    },
    onError: (error: Error) => {
      toast({ title: error.message || 'Failed to generate post', variant: 'destructive' });
    },
  });

  const handleCreate = () => {
    setSelectedPostId(null);
    setIsCreating(true);
  };

  const handleEdit = (id: string) => {
    setSelectedPostId(id);
    setIsCreating(false);
  };

  const handleBack = () => {
    setSelectedPostId(null);
    setIsCreating(false);
    queryClient.invalidateQueries({ queryKey: ['blog-posts-admin'] });
  };

  if (selectedPostId || isCreating) {
    return (
      <PageLayout title="Blog Admin">
        <div className="container max-w-4xl mx-auto py-8">
          <BlogEditor postId={selectedPostId} onBack={handleBack} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Blog Admin">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Blog Posts</h1>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generateMutation.isPending ? 'Generating...' : 'Generate Daily Post'}
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>
        </div>

        <BlogList
          posts={posts || []}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      </div>
    </PageLayout>
  );
}
