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

    // Get books created on the target date
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, book_name, book_description, category, created_at')
      .gte('created_at', `${targetDate}T00:00:00`)
      .lt('created_at', `${targetDate}T23:59:59`)
      .order('created_at', { ascending: true });

    if (booksError) {
      console.error('Error fetching books:', booksError);
      throw new Error(`Failed to fetch books: ${booksError.message}`);
    }

    if (!books || books.length === 0) {
      console.log('No books found for this date');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No books created on this date' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${books.length} books`);

    // Get images for each book (pages 1, 2, 3)
    const booksWithImages: BookWithImages[] = [];

    for (const book of books) {
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

    // Generate blog post content
    const title = `Daily Update: ${formattedDate}`;
    const slug = `daily-update-${targetDate}`;

    let content = `# 📚 ${booksWithImages.length} Books Created Today\n\n`;
    content += `*${formattedDate}*\n\n---\n\n`;

    for (const book of booksWithImages) {
      content += `## ${book.book_name}\n\n`;
      
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

      content += `---\n\n`;
    }

    // Summary stats
    const categories = booksWithImages.reduce((acc, book) => {
      const cat = book.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    content += `## 📊 Summary\n\n`;
    content += `- **Total Books:** ${booksWithImages.length}\n`;
    for (const [cat, count] of Object.entries(categories)) {
      content += `- **${cat}:** ${count}\n`;
    }

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

    // Check if post already exists for this date
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single();

    let result;

    if (existingPost) {
      // Update existing post
      const { data, error } = await supabase
        .from('blog_posts')
        .update({
          title,
          content,
          excerpt: `${booksWithImages.length} new books created on ${formattedDate}`,
          featured_image_url: booksWithImages[0]?.coverImage || null,
          tags: ['daily-update', ...Object.keys(categories)],
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPost.id)
        .select()
        .single();

      if (error) throw error;
      result = { ...data, action: 'updated' };
      console.log(`Updated existing blog post: ${slug}`);
    } else {
      // Create new post and publish it
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title,
          slug,
          content,
          excerpt: `${booksWithImages.length} new books created on ${formattedDate}`,
          featured_image_url: booksWithImages[0]?.coverImage || null,
          author_id: authorId,
          status: 'published',
          published_at: new Date().toISOString(),
          tags: ['daily-update', ...Object.keys(categories)],
          seo_title: title,
          seo_description: `Daily update from Chairlift Habits: ${booksWithImages.length} new educational books created on ${formattedDate}`,
        })
        .select()
        .single();

      if (error) throw error;
      result = { ...data, action: 'created' };
      console.log(`Created new blog post: ${slug}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      post: result,
      booksProcessed: booksWithImages.length,
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
