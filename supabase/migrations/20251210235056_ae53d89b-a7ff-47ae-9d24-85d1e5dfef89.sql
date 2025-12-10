-- Insert the "Why I Built Chairlift Habits" blog post
INSERT INTO public.blog_posts (
  author_id,
  title,
  slug,
  excerpt,
  content,
  status,
  tags,
  seo_title,
  seo_description,
  published_at
)
SELECT 
  ur.user_id as author_id,
  'Why I Built Chairlift Habits for My Toddler' as title,
  'why-i-built-chairlift-habits-for-my-toddler' as slug,
  'As a parent of two, I was tired. I needed something faster. I needed something personal. I needed something built for the way toddlers learn.' as excerpt,
  '## The Problem

Most early-learning books expire fast. Your child outgrows the topic. The story stops feeling familiar. The characters stop holding their attention. You end up buying another book. The cycle repeats. Busy parents do not have time for this.

## What I Needed

I needed a way to teach my toddler using content tailored to her.

- Characters she loved
- Topics she struggled with
- Settings she recognized
- Stories that match the week she was in

The system had to create books in minutes. If a story stayed relevant for fourteen days, that was enough.

## The Breakthrough

After many trials, I started creating daily ABC illustrations. I made a new book every morning. My daughter paid attention. She practiced reading. She copied the habits her favorite characters modeled. It worked better than anything I bought.

## From Daily ABC Illustrations to Chairlift Habits

Daily ABC Illustrations grew into Chairlift Habits. The idea stayed simple. Build daily habits through personalized stories. Start with reading. Expand to the small positive actions toddlers need every day. Make it easy for parents and grandparents to stay involved.

## The Solution Today

Chairlift Habits offers:

- Daily personalized books generated automatically
- Custom stories built through simple chat
- Progress tracking
- Habit rewards that turn reading into earned screen time

## Why It Matters

Busy families need tools that match their pace. Children need repetition, relevance, and characters they trust. When those pieces line up, learning sticks.

## Closing

Chairlift Habits exists to help your toddler grow one small habit at a time. Built by a tired parent who needed a better way, shaped by real daily life, and designed to make learning personal.

If you want to follow along, you can start free and see your first daily book tomorrow morning.' as content,
  'published' as status,
  ARRAY['founder story', 'parenting', 'toddler learning', 'habits', 'personalized books'] as tags,
  'Why I Built Chairlift Habits for My Toddler | Founder Story' as seo_title,
  'A parent''s journey from buying endless books to building personalized daily stories. Learn why Chairlift Habits was created to help toddlers build habits through characters they love.' as seo_description,
  now() as published_at
FROM public.user_roles ur
WHERE ur.role = 'admin'
LIMIT 1;