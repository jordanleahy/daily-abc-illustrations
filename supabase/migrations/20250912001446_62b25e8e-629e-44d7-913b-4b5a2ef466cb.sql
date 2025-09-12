-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_name TEXT NOT NULL,
  category TEXT,
  book_description TEXT,
  total_pages INTEGER DEFAULT 26,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pages table
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  letter TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, page_number)
);

-- Enable Row Level Security
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create policies for books table
CREATE POLICY "Users can view their own books" 
ON public.books 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own books" 
ON public.books 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books" 
ON public.books 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books" 
ON public.books 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all books" 
ON public.books 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all books" 
ON public.books 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all books" 
ON public.books 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for pages table
CREATE POLICY "Users can view pages of their own books" 
ON public.pages 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.books WHERE books.id = pages.book_id AND books.user_id = auth.uid()));

CREATE POLICY "Users can create pages for their own books" 
ON public.pages 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.books WHERE books.id = pages.book_id AND books.user_id = auth.uid()));

CREATE POLICY "Users can update pages of their own books" 
ON public.pages 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.books WHERE books.id = pages.book_id AND books.user_id = auth.uid()));

CREATE POLICY "Users can delete pages of their own books" 
ON public.pages 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.books WHERE books.id = pages.book_id AND books.user_id = auth.uid()));

CREATE POLICY "Admins can view all pages" 
ON public.pages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all pages" 
ON public.pages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all pages" 
ON public.pages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates on books
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on pages
CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_books_user_id ON public.books(user_id);
CREATE INDEX idx_books_created_at ON public.books(created_at DESC);
CREATE INDEX idx_pages_book_id ON public.pages(book_id);
CREATE INDEX idx_pages_letter ON public.pages(letter);
CREATE INDEX idx_pages_page_number ON public.pages(page_number);