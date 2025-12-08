import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ExternalLink, Calendar, FileText } from 'lucide-react';
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
  featured_image_url?: string | null;
}

interface BlogListProps {
  posts: BlogPost[];
  isLoading: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'published':
      return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">Published</Badge>;
    case 'draft':
      return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">Draft</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export const BlogList = ({ posts, isLoading, onEdit, onDelete }: BlogListProps) => {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-5 animate-pulse">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-muted rounded-lg shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <Card className="p-12 text-center">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No blog posts yet</h3>
        <p className="text-muted-foreground text-sm">Create your first post or generate one automatically!</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {posts.map((post) => (
        <Card 
          key={post.id} 
          className="group p-5 hover:shadow-md transition-all duration-200 border-border/50 hover:border-border"
        >
          <div className="flex gap-4">
            {/* Thumbnail placeholder */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
              {post.featured_image_url ? (
                <img 
                  src={post.featured_image_url} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <FileText className="w-8 h-8 text-primary/30" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                {getStatusBadge(post.status)}
              </div>

              {post.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {post.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {post.published_at 
                    ? format(new Date(post.published_at), 'MMM d, yyyy')
                    : format(new Date(post.created_at), 'MMM d, yyyy')
                  }
                </span>
                <span className="text-muted-foreground/50">•</span>
                <span className="font-mono text-xs truncate max-w-[200px]">
                  /blog/{post.slug}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => onEdit(post.id)}
                className="h-8 w-8"
              >
                <Edit className="w-4 h-4" />
              </Button>
              {post.status === 'published' && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  asChild
                  className="h-8 w-8"
                >
                  <Link to={`/blog/${post.slug}`} target="_blank">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => {
                  if (confirm('Delete this post?')) onDelete(post.id);
                }}
                className="h-8 w-8 text-destructive hover:text-destructive"
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
