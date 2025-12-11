import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '@/config/site';
import { Snowflake } from 'lucide-react';

export const AuthHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between py-2">
        <Link 
          to="/" 
          className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
        >
          {SITE_CONFIG.name}
        </Link>
        <Link 
          to="/snow" 
          className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <Snowflake className="h-4 w-4" />
          Game of Snow
        </Link>
      </div>
    </header>
  );
};
