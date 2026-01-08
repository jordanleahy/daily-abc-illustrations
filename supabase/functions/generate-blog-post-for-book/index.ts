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

    // Parse request body
    const { bookId, title, description } = await req.json();

    if (!bookId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'bookId is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating blog post for book: ${bookId}`);

    // Check if blog post already exists for this book title
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id, title')
      .eq('title', title)
      .single();

    if (existingPost) {
      console.log(`Blog post already exists for "${title}"`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Blog post already exists for this book',
        existingPostId: existingPost.id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, book_name, book_description, category, created_at')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      console.error('Error fetching book:', bookError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Book not found' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get pages for this book (pages 1, 2, 3)
    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, page_number')
      .eq('book_id', bookId)
      .in('page_number', [1, 2, 3]);

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
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
        title: book.book_name,
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
      console.error('Error creating blog post:', insertError);
      throw new Error(`Failed to create blog post: ${insertError.message}`);
    }

    console.log(`Created blog post: ${book.book_name} (${slug})`);

    return new Response(JSON.stringify({ 
      success: true, 
      post,
      slug,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating blog post for book:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
