import { SITE_CONFIG } from '@/config/site';
import { Link } from 'react-router-dom';

export const PublicBookFooter = () => {
  const currentYear = new Date().getFullYear();

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

          {/* Families */}
          <div>
            <h4 className="font-semibold mb-4">Families</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/for-toddlers" className="text-muted-foreground hover:text-foreground transition-colors">
                  For toddlers
                </Link>
              </li>
              <li>
                <Link to="/for-early-readers" className="text-muted-foreground hover:text-foreground transition-colors">
                  For early readers
                </Link>
              </li>
              <li>
                <Link to="/for-busy-parents" className="text-muted-foreground hover:text-foreground transition-colors">
                  For busy parents
                </Link>
              </li>
              <li>
                <Link to="/for-grandparents" className="text-muted-foreground hover:text-foreground transition-colors">
                  For grandparents
                </Link>
              </li>
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
