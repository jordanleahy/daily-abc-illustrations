import { Link } from 'react-router-dom';
import { SITE_CONFIG } from '@/config/site';

export const AuthHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-center py-2">
        <Link 
          to="/" 
          className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
        >
          {SITE_CONFIG.name}
        </Link>
      </div>
    </header>
  );
};
