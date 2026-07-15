import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse } from '../_shared/response.ts';

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

Deno.serve(createHandler({
  name: 'generate-daily-blog-post',
  clientMode: 'service',
  requireAuth: false, // Cron job - no auth required
}, async ({ supabase, req }) => {
  // Parse request body for optional date override
  let targetDate = new Date().toISOString().split('T')[0];
  try {
    const body = await req.json();
    if (body.date) {
      targetDate = body.date;
    }
  } catch {
    // No body provided, use today's date
  }

  console.log(`Generating daily blog post for date: ${targetDate}`);

  // Calculate date 7 days ago for expired book filtering
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString();

  // SAFETY: Get books that are ACTIVELY published OR recently expired (within 7 days)
  const { data: activePublished, error: activeError } = await supabase
    .from('daily_published')
    .select('book_id, status, updated_at')
    .eq('status', 'active');

  const { data: expiredPublished, error: expiredError } = await supabase
    .from('daily_published')
    .select('book_id, status, updated_at')
    .eq('status', 'expired')
    .gte('updated_at', sevenDaysAgoStr);

  if (activeError) throw new Error(`Failed to fetch active published: ${activeError.message}`);
  if (expiredError) throw new Error(`Failed to fetch expired published: ${expiredError.message}`);

  const allPublished = [...(activePublished || []), ...(expiredPublished || [])];
  const allBookIds = [...new Set(allPublished.map(p => p.book_id))];
  
  console.log(`Found ${activePublished?.length || 0} active + ${expiredPublished?.length || 0} recently expired = ${allBookIds.length} unique books`);

  if (allBookIds.length === 0) {
    console.log('No published books found (active or recently expired)');
    return successResponse({ 
      success: false, 
      message: 'No published books in the library' 
    });
  }

  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id, book_name, book_description, category, created_at')
    .in('id', allBookIds)
    .order('created_at', { ascending: true });

  if (booksError) throw new Error(`Failed to fetch books: ${booksError.message}`);

  if (!books || books.length === 0) {
    return successResponse({ 
      success: false, 
      message: 'No books found for published entries' 
    });
  }

  console.log(`Processing ${books.length} books`);

  // DEDUPLICATION: Check if a blog post with the same title already exists
  const bookTitles = books.map(b => b.book_name);
  const { data: existingPosts } = await supabase
    .from('blog_posts')
    .select('title')
    .in('title', bookTitles);

  const existingTitles = new Set((existingPosts || []).map(p => p.title));
  const newBooks = books.filter(b => !existingTitles.has(b.book_name));
  
  if (newBooks.length === 0) {
    return successResponse({ 
      success: false, 
      message: 'All published books already have blog posts' 
    });
  }

  console.log(`${newBooks.length} new books to create posts for (${books.length - newBooks.length} already have posts)`);

  // Get images for each book (pages 1, 2, 3)
  const booksWithImages: BookWithImages[] = [];

  for (const book of newBooks) {
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, page_number')
      .eq('book_id', book.id)
      .in('page_number', [1, 2, 3]);

    if (pagesError) {
      console.error(`Error fetching pages for book ${book.id}:`, pagesError);
      continue;
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

    booksWithImages.push({
      ...book,
      coverImage: pageImages[1],
      educationalImage: pageImages[2],
      page3Image: pageImages[3],
    });
  }

  // Get admin user for author_id
  const { data: adminRole } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  const authorId = adminRole?.user_id;
  if (!authorId) throw new Error('No admin user found to set as author');

  // Create individual blog posts for each new book
  const createdPosts = [];

  for (const book of booksWithImages) {
    const baseSlug = book.book_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60)
      .replace(/-$/, '');

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

    let content = `## ${book.book_name}\n\n`;
    
    if (book.book_description) {
      content += `${book.book_description}\n\n`;
    }

    if (book.category) {
      content += `**Category:** ${book.category}\n\n`;
    }

    const images = [
      { label: 'Cover', url: book.coverImage },
      { label: 'Educational Focus', url: book.educationalImage },
      { label: 'Sample Page', url: book.page3Image },
    ].filter(img => img.url);

    if (images.length > 0) {
      content += `| ${images.map(img => img.label).join(' | ')} |\n`;
      content += `| ${images.map(() => '---').join(' | ')} |\n`;
      content += `| ${images.map(img => `![${img.label}](${img.url})`).join(' | ')} |\n\n`;
    }

    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: book.book_name,
        slug,
        content,
        excerpt: book.book_description || `New educational book: ${book.book_name}`,
        featured_image_url: book.coverImage || null,
        author_id: authorId,
        status: 'published',
        published_at: new Date().toISOString(),
        tags: ['library', book.category || 'educational'].filter(Boolean),
        seo_title: book.book_name,
        seo_description: book.book_description || `Explore ${book.book_name} - an educational book from Shelly & Thatch`,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`Error creating blog post for ${book.book_name}:`, insertError);
      continue;
    }

    createdPosts.push(post);
    console.log(`Created blog post: ${book.book_name} (${slug})`);
  }

  return successResponse({ 
    success: true, 
    postsCreated: createdPosts.length,
    posts: createdPosts,
    skippedDuplicates: books.length - newBooks.length,
  });
}));
