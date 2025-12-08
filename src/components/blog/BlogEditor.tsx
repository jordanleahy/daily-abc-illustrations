import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, X } from 'lucide-react';
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setTags(post.tags || []);
      setFeaturedImageUrl(post.featured_image_url || '');
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ 
        title: 'Invalid file type', 
        description: 'Please upload an image file',
        variant: 'destructive' 
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: 'File too large', 
        description: 'Image must be less than 5MB',
        variant: 'destructive' 
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(data.path);

      setFeaturedImageUrl(publicUrl);
      toast({ title: 'Image uploaded successfully' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        title: 'Upload failed', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
        tags: tags.length > 0 ? tags : null,
        featured_image_url: featuredImageUrl || null,
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
    <div className="space-y-4 pb-24 sm:pb-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <h2 className="text-lg font-semibold truncate">
          {postId ? 'Edit Post' : 'New Post'}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Title and Slug - side by side on desktop, stacked on mobile */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title"
              className="h-11 sm:h-10"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(generateSlug(e.target.value))}
              placeholder="post-slug"
              className="h-11 sm:h-10"
            />
          </div>
        </div>

        {/* Excerpt and Status - side by side on desktop */}
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Input
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description"
              className="h-11 sm:h-10"
            />
          </div>
          <div className="sm:w-32">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as 'draft' | 'published' | 'archived')}>
              <SelectTrigger className="h-11 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content editor with Write/Preview tabs */}
        <Tabs defaultValue="write" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11 sm:h-10">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="write" className="mt-2">
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your content in Markdown..."
              className="font-mono text-sm min-h-[200px] sm:min-h-[300px] resize-y"
            />
          </TabsContent>
          <TabsContent value="preview" className="mt-2">
            <div className="prose prose-sm max-w-none p-4 border rounded-md min-h-[200px] sm:min-h-[300px] overflow-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </TabsContent>
        </Tabs>

        {/* Featured Image - compact for mobile */}
        <div className="space-y-3 pt-2 border-t">
          <Label>Featured Image</Label>
          <div className="flex flex-wrap gap-3 items-start">
            {featuredImageUrl && (
              <div className="relative">
                <img 
                  src={featuredImageUrl} 
                  alt="Featured" 
                  className="h-20 w-auto rounded-lg border object-cover"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => setFeaturedImageUrl('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex-1 min-w-[200px] space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full h-11 sm:h-10"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
              <Input
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                placeholder="Or paste image URL"
                className="h-11 sm:h-10 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Tags - horizontal scroll on mobile */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const newTag = tagInput.trim();
                if (newTag && !tags.includes(newTag)) {
                  setTags([...tags, newTag]);
                  setTagInput('');
                }
              }
            }}
            placeholder="Type tag + Enter"
            className="h-11 sm:h-10"
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="hover:text-destructive text-base leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* SEO Section - collapsed by default on mobile would be nice, but keeping simple */}
        <details className="border-t pt-3">
          <summary className="font-semibold cursor-pointer py-2">SEO Settings</summary>
          <div className="space-y-3 pt-2">
            <div>
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input
                id="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="SEO optimized title"
                className="h-11 sm:h-10"
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
                className="resize-none"
              />
            </div>
          </div>
        </details>
      </div>

      {/* Sticky save button on mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t sm:relative sm:p-0 sm:border-0 sm:bg-transparent">
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={!title || !slug || !content || saveMutation.isPending}
          className="w-full h-12 sm:h-10 text-base sm:text-sm"
        >
          {saveMutation.isPending ? 'Saving...' : (postId ? 'Update Post' : 'Create Post')}
        </Button>
      </div>
    </div>
  );
};
