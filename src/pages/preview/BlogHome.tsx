import { PreviewPageLayout } from '@/components/preview/layout/PreviewPageLayout';
import { PreviewSection } from '@/components/preview/layout/PreviewSection';

const BlogHome = () => {
  const categories = [
    'Reading habits',
    'Parent scripts and routines',
    'Rewards and motivation',
    'Screen-time tradeoffs',
    'Chairlift product tips'
  ];

  const featuredPosts = [
    {
      title: 'How to start a daily reading habit with your toddler',
      excerpt: 'Short, practical guidance for parents who want stronger reading habits at home.',
      category: 'Reading habits',
      readTime: '5 min read'
    },
    {
      title: 'The coin system: Making rewards feel fair for kids',
      excerpt: 'Learn how to use Chairlift\'s coin and rewards system to motivate consistent reading.',
      category: 'Rewards and motivation',
      readTime: '4 min read'
    },
    {
      title: '5 parent scripts for bedtime reading resistance',
      excerpt: 'What to say when your child doesn\'t want to read before bed.',
      category: 'Parent scripts and routines',
      readTime: '6 min read'
    }
  ];

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

      {/* Featured Posts */}
      <PreviewSection variant="feature" className="bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">Featured articles</h2>
          <div className="space-y-6">
            {featuredPosts.map((post, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.readTime}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {post.title}
                </h3>
                <p className="text-muted-foreground">
                  {post.excerpt}
                </p>
              </div>
            ))}
          </div>
        </div>
      </PreviewSection>

      {/* Coming Soon */}
      <PreviewSection variant="default">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-muted-foreground">
            More articles coming soon. Check back regularly for new content on building reading habits with your family.
          </p>
        </div>
      </PreviewSection>
    </PreviewPageLayout>
  );
};

export default BlogHome;
