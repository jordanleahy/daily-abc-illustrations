import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';

const BlogHome = () => {
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

  // Extract unique tags from all posts for categories
  const categories = posts
    ? [...new Set(posts.flatMap(post => post.tags || []))]
    : [];

  return (
    <PreviewPageLayout>
      {/* Hero */}
      <PreviewSection variant="hero">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Chairlift Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Short, practical guidance for parents who want stronger reading habits at home.
          </p>
        </div>
      </PreviewSection>

      {/* Categories */}
      {categories.length > 0 && (
        <PreviewSection variant="default">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">Categories</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <div
                  key={category}
                  className="px-4 py-2 rounded-full border border-border bg-card hover:bg-accent transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-foreground">{category}</span>
                </div>
              ))}
            </div>
          </div>
        </PreviewSection>
      )}

      {/* Blog Posts */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">Latest articles</h2>
          
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
          )}

          {!isLoading && !posts?.length && (
            <div className="text-center py-12 text-muted-foreground">
              No blog posts published yet. Check back soon!
            </div>
          )}

          <div className="space-y-6">
            {posts?.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`}>
                <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow cursor-pointer">
                  {post.featured_image_url && (
                    <img 
                      src={post.featured_image_url} 
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    {post.tags && post.tags[0] && (
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        {post.tags[0]}
                      </span>
                    )}
                    {post.published_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(post.published_at), 'MMMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-muted-foreground">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </PreviewSection>
    </PreviewPageLayout>
  );
};

export default BlogHome;
