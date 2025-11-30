import { useQuery } from '@tanstack/react-query';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Helmet } from 'react-helmet-async';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post-public', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <PreviewPageLayout>
        <div className="container max-w-3xl mx-auto py-12 text-center">
          Loading...
        </div>
      </PreviewPageLayout>
    );
  }

  if (error || !post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <PreviewPageLayout>
      <Helmet>
        <title>{post.seo_title || post.title}</title>
        <meta name="description" content={post.seo_description || post.excerpt || ''} />
      </Helmet>
      
      <article className="container max-w-3xl mx-auto py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-3">{post.title}</h1>
          {post.published_at && (
            <time className="text-muted-foreground">
              {format(new Date(post.published_at), 'MMMM d, yyyy')}
            </time>
          )}
        </header>

        <div className="prose prose-lg max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>
      </article>
    </PreviewPageLayout>
  );
}
