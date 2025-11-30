import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';

export default function Blog() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <PreviewPageLayout>
      <div className="container max-w-4xl mx-auto py-12">
        <h1 className="text-4xl font-bold mb-8">Blog</h1>

        {isLoading && (
          <div className="text-center py-8">Loading posts...</div>
        )}

        {!isLoading && !posts?.length && (
          <div className="text-center py-12 text-muted-foreground">
            No blog posts published yet.
          </div>
        )}

        <div className="space-y-6">
          {posts?.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`}>
              <Card className="p-6 hover:shadow-lg transition-shadow">
                {post.featured_image_url && (
                  <img 
                    src={post.featured_image_url} 
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <h2 className="text-2xl font-semibold mb-2">{post.title}</h2>
                {post.excerpt && (
                  <p className="text-muted-foreground mb-3">{post.excerpt}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {post.published_at && format(new Date(post.published_at), 'MMMM d, yyyy')}
                  </div>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag}
                          className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PreviewPageLayout>
  );
}
