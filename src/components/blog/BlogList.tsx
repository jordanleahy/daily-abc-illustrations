import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  created_at: string;
  published_at: string | null;
}

interface BlogListProps {
  posts: BlogPost[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const BlogList = ({ posts, isLoading, onEdit, onDelete }: BlogListProps) => {
  if (isLoading) {
    return <div className="text-center py-8">Loading posts...</div>;
  }

  if (!posts.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No blog posts yet. Create your first one!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Card key={post.id} className="p-4">
          {/* Mobile-first stacked layout */}
          <div className="space-y-3">
            {/* Title and status row */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold line-clamp-2 flex-1">{post.title}</h3>
              <span className={`shrink-0 text-xs px-2 py-1 rounded font-medium ${
                post.status === 'published' ? 'bg-green-500/10 text-green-600' :
                post.status === 'draft' ? 'bg-yellow-500/10 text-yellow-600' :
                'bg-gray-500/10 text-gray-600'
              }`}>
                {post.status}
              </span>
            </div>

            {/* Excerpt - truncated on mobile */}
            {post.excerpt && (
              <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
            )}

            {/* Meta info - stacked on mobile, inline on larger screens */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                {post.published_at 
                  ? format(new Date(post.published_at), 'MMM d, yyyy')
                  : `Draft: ${format(new Date(post.created_at), 'MMM d, yyyy')}`
                }
              </span>
              <span className="truncate max-w-[150px] sm:max-w-none">/{post.slug}</span>
            </div>

            {/* Action buttons - larger touch targets for mobile */}
            <div className="flex gap-2 pt-1">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onEdit(post.id)}
                className="flex-1 sm:flex-none h-10 sm:h-9"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {post.status === 'published' && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  asChild
                  className="flex-1 sm:flex-none h-10 sm:h-9"
                >
                  <Link to={`/blog/${post.slug}`} target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </Link>
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  if (confirm('Delete this post?')) onDelete(post.id);
                }}
                className="h-10 sm:h-9 px-3"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
