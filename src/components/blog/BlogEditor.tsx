import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogEditorProps {
  postId: string | null;
  onBack: () => void;
}

export const BlogEditor = ({ postId, onBack }: BlogEditorProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const { data: post } = useQuery({
    queryKey: ['blog-post', postId],
    queryFn: async () => {
      if (!postId) return null;
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt || '');
      setContent(post.content);
      setStatus(post.status as 'draft' | 'published' | 'archived');
      setSeoTitle(post.seo_title || '');
      setSeoDescription(post.seo_description || '');
    }
  }, [post]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!postId && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const postData = {
        title,
        slug,
        excerpt: excerpt || null,
        content,
        status,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        author_id: user.id,
        published_at: status === 'published' ? new Date().toISOString() : null,
      };

      if (postId) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', postId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert(postData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: postId ? 'Post updated' : 'Post created' });
      onBack();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to save post', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title"
          />
        </div>

        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(generateSlug(e.target.value))}
            placeholder="post-slug"
          />
        </div>

        <div>
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief description"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as 'draft' | 'published' | 'archived')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="write" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="space-y-4">
            <div>
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your content in Markdown..."
                rows={20}
                className="font-mono"
              />
            </div>
          </TabsContent>
          <TabsContent value="preview">
            <div className="prose prose-sm max-w-none p-4 border rounded-md min-h-[500px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold">SEO</h3>
          <div>
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="SEO optimized title"
            />
          </div>
          <div>
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="SEO meta description"
              rows={2}
            />
          </div>
        </div>

        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={!title || !slug || !content || saveMutation.isPending}
          className="w-full"
        >
          {saveMutation.isPending ? 'Saving...' : (postId ? 'Update Post' : 'Create Post')}
        </Button>
      </div>
    </div>
  );
};
