import { SITE_CONFIG } from '@/config/site';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const PublicBookFooter = () => {
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
      
      // Extract unique locations
      const locationIds = [...new Set(
        books
          .map(b => (b.metadata as any)?.location)
          .filter(Boolean)
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

  return (
    <footer className="border-t border-border mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  Product overview
                </Link>
              </li>
              <li>
                <Link to="/library" className="text-muted-foreground hover:text-foreground transition-colors">
                  Reading & Library
                </Link>
              </li>
              <li>
                <Link to="/habits" className="text-muted-foreground hover:text-foreground transition-colors">
                  Habits & Rewards
                </Link>
              </li>
              <li>
                <Link to="/studio" className="text-muted-foreground hover:text-foreground transition-colors">
                  AI Book Studio
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Parent Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Resorts */}
          <div>
            <h4 className="font-semibold mb-4">Resorts</h4>
            <ul className="space-y-2 text-sm">
              {resortsWithBooks && resortsWithBooks.length > 0 ? (
                resortsWithBooks.map((resort) => (
                  <li key={resort.id}>
                    <Link 
                      to={`/resorts/${resort.id.toLowerCase().replace(/_/g, '-')}`} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {resort.label}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link to="/resorts" className="text-muted-foreground hover:text-foreground transition-colors">
                      Ski Resorts
                    </Link>
                  </li>
                  <li>
                    <Link to="/resorts" className="text-muted-foreground hover:text-foreground transition-colors">
                      Mountain Destinations
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-semibold">{SITE_CONFIG.name}</p>
          <p className="text-sm text-muted-foreground">
            © {currentYear} {SITE_CONFIG.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
