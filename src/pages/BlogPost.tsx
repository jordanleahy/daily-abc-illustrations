import { useQuery } from '@tanstack/react-query';
import { useParams, Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Calculate reading time based on word count
const calculateReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

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
        <div className="container max-w-4xl mx-auto py-12">
          {/* Loading skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
            <div className="space-y-3">
              <div className="h-10 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          </div>
        </div>
      </PreviewPageLayout>
    );
  }

  if (error || !post) {
    return <Navigate to="/blog" replace />;
  }

  const readingTime = calculateReadingTime(post.content);

  return (
    <PreviewPageLayout>
      <Helmet>
        <title>{post.seo_title || post.title}</title>
        <meta name="description" content={post.seo_description || post.excerpt || ''} />
      </Helmet>
      
      <article className="pb-16">
        {/* Back navigation */}
        <div className="container max-w-4xl mx-auto pt-6 px-4">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>

        {/* Featured image hero */}
        {post.featured_image_url && (
          <div className="container max-w-5xl mx-auto mt-6 px-4">
            <div className="relative aspect-[21/9] overflow-hidden rounded-2xl shadow-lg">
              <img 
                src={post.featured_image_url} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          </div>
        )}

        {/* Header section */}
        <header className="container max-w-4xl mx-auto px-4 mt-8 mb-10">
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag: string) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="text-xs font-medium"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
            {post.title}
          </h1>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 mt-5 text-muted-foreground text-sm">
            {post.published_at && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <time>{format(new Date(post.published_at), 'MMMM d, yyyy')}</time>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min read</span>
            </div>
          </div>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed border-l-4 border-primary/30 pl-4 italic">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Content */}
        <div className="container max-w-4xl mx-auto px-4">
          <div className="prose prose-lg max-w-none
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground prose-strong:font-semibold
            prose-ul:my-4 prose-li:text-muted-foreground prose-li:my-1
            prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
            prose-img:rounded-xl prose-img:shadow-md prose-img:my-6
          ">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ node, ...props }) => (
                  <figure className="my-8">
                    <img 
                      {...props} 
                      className="w-full rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
                      loading="lazy"
                    />
                    {props.alt && props.alt !== 'image' && (
                      <figcaption className="text-center text-sm text-muted-foreground mt-3 italic">
                        {props.alt}
                      </figcaption>
                    )}
                  </figure>
                ),
                h2: ({ node, children, ...props }) => (
                  <h2 {...props} className="text-2xl font-bold mt-12 mb-4 pb-2 border-b border-border text-foreground">
                    {children}
                  </h2>
                ),
                h3: ({ node, children, ...props }) => (
                  <h3 {...props} className="text-xl font-semibold mt-8 mb-3 text-foreground">
                    {children}
                  </h3>
                ),
                p: ({ node, children, ...props }) => {
                  // Check if paragraph only contains an image
                  const hasOnlyImage = node?.children?.length === 1 && 
                    node?.children[0]?.type === 'element' && 
                    (node?.children[0] as any)?.tagName === 'img';
                  
                  if (hasOnlyImage) {
                    return <>{children}</>;
                  }
                  
                  return (
                    <p {...props} className="text-muted-foreground leading-relaxed my-4">
                      {children}
                    </p>
                  );
                },
                ul: ({ node, children, ...props }) => (
                  <ul {...props} className="my-4 space-y-2 list-disc list-inside text-muted-foreground">
                    {children}
                  </ul>
                ),
                li: ({ node, children, ...props }) => (
                  <li {...props} className="text-muted-foreground">
                    {children}
                  </li>
                ),
                blockquote: ({ node, children, ...props }) => (
                  <blockquote {...props} className="border-l-4 border-primary bg-muted/30 py-3 px-5 rounded-r-lg my-6 text-muted-foreground">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <footer className="container max-w-4xl mx-auto px-4 mt-16 pt-8 border-t border-border">
          <Link 
            to="/blog" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            View all posts
          </Link>
        </footer>
      </article>
    </PreviewPageLayout>
  );
}
