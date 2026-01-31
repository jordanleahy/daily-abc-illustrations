import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';

interface BookWithImages {
  id: string;
  book_name: string;
  book_description: string | null;
  category: string | null;
  created_at: string;
  coverImage: string | null;
  educationalImage: string | null;
  page3Image: string | null;
}

interface RequestBody {
  bookId: string;
  title?: string;
  description?: string;
}

Deno.serve(createHandler({
  name: 'generate-blog-post-for-book',
  clientMode: 'service',
  requireAuth: false,
  methods: ['POST'],
}, async ({ supabase, req }) => {
  const { bookId, title, description } = await parseBody<RequestBody>(req);

  if (!bookId) {
    return errors.badRequest('bookId is required');
  }

  console.log(`[GENERATE-BLOG-POST] Generating blog post for book: ${bookId}`);

  // Check if blog post already exists for this book title
  if (title) {
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id, title')
      .eq('title', title)
      .single();

    if (existingPost) {
      console.log(`[GENERATE-BLOG-POST] Blog post already exists for "${title}"`);
      return successResponse({ 
        success: false, 
        message: 'Blog post already exists for this book',
        existingPostId: existingPost.id
      });
    }
  }

  // Get book details
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id, book_name, book_description, category, created_at')
    .eq('id', bookId)
    .single();

  if (bookError || !book) {
    console.error('[GENERATE-BLOG-POST] Error fetching book:', bookError);
    return errors.notFound('Book not found');
  }

  // Get pages for this book (pages 1, 2, 3)
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('id, page_number')
    .eq('book_id', bookId)
    .in('page_number', [1, 2, 3]);

  if (pagesError) {
    console.error('[GENERATE-BLOG-POST] Error fetching pages:', pagesError);
  }

  const pageImages: { [key: number]: string | null } = { 1: null, 2: null, 3: null };

  for (const page of pages || []) {
    const { data: imageData } = await supabase
      .from('page_image_urls')
      .select('image_url')
      .eq('page_id', page.id)
      .eq('is_latest', true)
      .single();

    if (imageData?.image_url) {
      pageImages[page.page_number] = imageData.image_url;
    }
  }

  const bookWithImages: BookWithImages = {
    ...book,
    coverImage: pageImages[1],
    educationalImage: pageImages[2],
    page3Image: pageImages[3],
  };

  // Get admin user for author_id
  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  const authorId = adminRole?.user_id;

  if (!authorId) {
    throw new Error('No admin user found to set as author');
  }

  // Generate unique slug from book name
  const baseSlug = book.book_name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
    .replace(/-$/, '');

  // Check for slug uniqueness
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Build content for this book
  let content = `## ${bookWithImages.book_name}\n\n`;
  
  if (bookWithImages.book_description) {
    content += `${bookWithImages.book_description}\n\n`;
  }

  if (bookWithImages.category) {
    content += `**Category:** ${bookWithImages.category}\n\n`;
  }

  // Add images in a row
  const images = [
    { label: 'Cover', url: bookWithImages.coverImage },
    { label: 'Educational Focus', url: bookWithImages.educationalImage },
    { label: 'Sample Page', url: bookWithImages.page3Image },
  ].filter(img => img.url);

  if (images.length > 0) {
    content += `| ${images.map(img => img.label).join(' | ')} |\n`;
    content += `| ${images.map(() => '---').join(' | ')} |\n`;
    content += `| ${images.map(img => `![${img.label}](${img.url})`).join(' | ')} |\n\n`;
  }

  // Insert blog post
  const { data: post, error: insertError } = await supabase
    .from('blog_posts')
    .insert({
      title: title || book.book_name,
      slug,
      content,
      excerpt: description || book.book_description || `New educational book: ${book.book_name}`,
      featured_image_url: bookWithImages.coverImage || null,
      author_id: authorId,
      status: 'published',
      published_at: new Date().toISOString(),
      tags: ['library', book.category || 'educational'].filter(Boolean),
      seo_title: book.book_name,
      seo_description: description || book.book_description || `Explore ${book.book_name} - an educational book from Daily ABC Illustrations`,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[GENERATE-BLOG-POST] Error creating blog post:', insertError);
    throw new Error(`Failed to create blog post: ${insertError.message}`);
  }

  console.log(`[GENERATE-BLOG-POST] Created blog post: ${book.book_name} (${slug})`);

  return successResponse({ 
    success: true, 
    post,
    slug,
  });
}));
