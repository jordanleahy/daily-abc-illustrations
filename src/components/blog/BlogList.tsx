import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id} className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-1">{post.title}</h3>
              {post.excerpt && (
                <p className="text-muted-foreground mb-2">{post.excerpt}</p>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span className={`px-2 py-1 rounded ${
                  post.status === 'published' ? 'bg-green-500/10 text-green-600' :
                  post.status === 'draft' ? 'bg-yellow-500/10 text-yellow-600' :
                  'bg-gray-500/10 text-gray-600'
                }`}>
                  {post.status}
                </span>
                <span>
                  {post.published_at 
                    ? `Published: ${format(new Date(post.published_at), 'MMM d, yyyy')}`
                    : `Created: ${format(new Date(post.created_at), 'MMM d, yyyy')}`
                  }
                </span>
                <span>Slug: /{post.slug}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(post.id)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  if (confirm('Delete this post?')) onDelete(post.id);
                }}
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
