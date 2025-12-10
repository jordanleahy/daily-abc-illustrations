import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // SAFETY: Only get books that are ACTIVELY published in daily_published
    // This ensures we only blog about books users can actually see in the library
    const { data: activePublished, error: publishedError } = await supabase
      .from('daily_published')
      .select('book_id')
      .eq('status', 'active');

    if (publishedError) {
      console.error('Error fetching active published books:', publishedError);
      throw new Error(`Failed to fetch active published: ${publishedError.message}`);
    }

    const activeBookIds = (activePublished || []).map(p => p.book_id);
    
    if (activeBookIds.length === 0) {
      console.log('No actively published books found');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No actively published books in the library' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${activeBookIds.length} actively published book(s)`);

    // Get full book details for the active published books
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, book_name, book_description, category, created_at')
      .in('id', activeBookIds)
      .order('created_at', { ascending: true });

    if (booksError) {
      console.error('Error fetching books:', booksError);
      throw new Error(`Failed to fetch books: ${booksError.message}`);
    }

    if (!books || books.length === 0) {
      console.log('No books found for active published entries');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No books found for active published entries' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
    
    // Filter out books that already have blog posts
    const newBooks = books.filter(b => !existingTitles.has(b.book_name));
    
    if (newBooks.length === 0) {
      console.log('All books already have blog posts');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'All actively published books already have blog posts' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`${newBooks.length} new books to create posts for (${books.length - newBooks.length} already have posts)`);

    // Get images for each book (pages 1, 2, 3)
    const booksWithImages: BookWithImages[] = [];

    for (const book of newBooks) {
      // Get pages for this book
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

    // Format the date nicely
    const dateObj = new Date(targetDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

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

    // Create individual blog posts for each new book
    const createdPosts = [];

    for (const book of booksWithImages) {
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
      let content = `## ${book.book_name}\n\n`;
      
      if (book.book_description) {
        content += `${book.book_description}\n\n`;
      }

      if (book.category) {
        content += `**Category:** ${book.category}\n\n`;
      }

      // Add images in a row
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

      // Insert blog post
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
          seo_description: book.book_description || `Explore ${book.book_name} - an educational book from Chairlift Habits`,
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

    return new Response(JSON.stringify({ 
      success: true, 
      postsCreated: createdPosts.length,
      posts: createdPosts,
      skippedDuplicates: books.length - newBooks.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating daily blog post:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
