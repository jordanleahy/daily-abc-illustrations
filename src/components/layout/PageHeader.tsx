import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useClerkAuth';
import { SignInButton, UserButton } from '@clerk/clerk-react';
import { Container } from './Container';

interface PageHeaderProps {
  title?: string;
}

export const PageHeader = ({ title = "ABC Illustrations" }: PageHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const navigation = user ? [
    { name: 'Canvas', href: '/' },
  ] : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-foreground">{title}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>

                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8"
                    }
                  }}
                />
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Mobile Panel */}
            <div className="fixed top-14 left-0 right-0 bg-background border-b border-border shadow-lg z-50 md:hidden">
              <div className="px-4 py-6 space-y-6">
                {user ? (
                  <>
                    {/* User Navigation */}
                    <nav className="space-y-1">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className="flex items-center px-3 py-2 text-base font-medium text-foreground rounded-md hover:bg-muted transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </nav>
                    
                    {/* Future Navigation Items */}
                    <nav className="space-y-1 border-t border-border pt-4">
                      <h3 className="px-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Platform
                      </h3>
                      <Link
                        to="/newsletter"
                        className="flex items-center px-3 py-2 text-base font-medium text-foreground rounded-md hover:bg-muted transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Newsletter
                      </Link>
                      <Link
                        to="/archive"
                        className="flex items-center px-3 py-2 text-base font-medium text-foreground rounded-md hover:bg-muted transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Archive
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center px-3 py-2 text-base font-medium text-foreground rounded-md hover:bg-muted transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile
                      </Link>
                    </nav>

                    {/* User Account */}
                    <div className="border-t border-border pt-4">
                      <div className="px-3">
                        <UserButton 
                          afterSignOutUrl="/"
                          appearance={{
                            elements: {
                              avatarBox: "w-8 h-8"
                            }
                          }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Guest Navigation */}
                    <nav className="space-y-1">
                      <h3 className="px-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Discover
                      </h3>
                      <Link
                        to="/about"
                        className="flex items-center px-3 py-2 text-base font-medium text-foreground rounded-md hover:bg-muted transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        About ABC
                      </Link>
                      <Link
                        to="/newsletter"
                        className="flex items-center px-3 py-2 text-base font-medium text-foreground rounded-md hover:bg-muted transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Newsletter
                      </Link>
                      <Link
                        to="/archive"
                        className="flex items-center px-3 py-2 text-base font-medium text-foreground rounded-md hover:bg-muted transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Archive
                      </Link>
                    </nav>

                    {/* Sign In CTA */}
                    <div className="border-t border-border pt-4">
                      <div className="px-3">
                        <SignInButton>
                          <Button className="w-full" size="lg">
                            Sign In with Google
                          </Button>
                        </SignInButton>
                        <p className="text-sm text-muted-foreground text-center mt-2">
                          Get access to premium features
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </Container>
    </header>
  );
};