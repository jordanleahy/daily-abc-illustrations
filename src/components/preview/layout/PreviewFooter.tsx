import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const PreviewFooter = () => {
  const currentYear = new Date().getFullYear();

  // Fetch resorts that have books
  const { data: resortsWithBooks } = useQuery({
    queryKey: ['footer-resorts-with-books'],
    queryFn: async () => {
      // Get distinct locations from books metadata
      const { data: books } = await supabase
        .from('books')
        .select('metadata')
        .not('metadata->location', 'is', null)
        .eq('status', 'published')
        .limit(100);
      
      if (!books) return [];
      
      // Extract unique locations (excluding skip-location)
      const locationIds = [...new Set(
        books
          .map(b => (b.metadata as any)?.location)
          .filter(loc => loc && loc !== 'skip-location')
      )];
      
      if (locationIds.length === 0) return [];
      
      // Fetch location details
      const { data: locations } = await supabase
        .from('locations')
        .select('id, label')
        .in('id', locationIds)
        .eq('is_active', true)
        .order('sort_order')
        .limit(4);
      
      return locations || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const staticSections = [
    {
      title: 'Categories',
      links: [
        { label: 'ABC Books', href: '/abc-books' },
        { label: 'Rhyming Books', href: '/rhyming' },
        { label: 'Numbers Books', href: '/numbers' },
        { label: 'Opposites Books', href: '/opposites' },
        { label: 'All Categories', href: '/library' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '/blog-home' },
        { label: 'Pricing', href: '/pricing-info' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms', href: '/terms-of-service' },
        { label: 'Privacy', href: '/privacy-policy' }
      ]
    }
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Product Section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {staticSections[0].title}
            </h3>
            <ul className="space-y-3">
              {staticSections[0].links.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resorts Section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Resorts
            </h3>
            <ul className="space-y-3">
              {resortsWithBooks && resortsWithBooks.length > 0 ? (
                resortsWithBooks.map((resort) => (
                  <li key={resort.id}>
                    <Link 
                      to={`/resorts/${resort.id.toLowerCase().replace(/_/g, '-')}`}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {resort.label}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link to="/resorts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Ski Resorts
                    </Link>
                  </li>
                  <li>
                    <Link to="/resorts" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Mountain Destinations
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {staticSections[1].title}
            </h3>
            <ul className="space-y-3">
              {staticSections[1].links.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {staticSections[2].title}
            </h3>
            <ul className="space-y-3">
              {staticSections[2].links.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-foreground">Chairlift Habits</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {currentYear} Chairlift Habits. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
