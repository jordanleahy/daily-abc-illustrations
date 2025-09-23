import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { AdminOnly } from '@/components/AdminOnly';
import { Container } from './Container';

interface PageHeaderProps {
  title?: string;
}

export const PageHeader = ({ title = "ABC Cards Platform" }: PageHeaderProps) => {
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navigation = [
    { name: 'Chat', href: '/' },
    { name: 'My Books', href: '/books' },
  ];

  const adminNavigation = [
    { name: 'Agents', href: '/agents' },
    { name: 'Daily Pub Schedule', href: '/daily-published-schedule' },
  ];

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
            <AdminOnly>
              {adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.name}
                </Link>
              ))}
            </AdminOnly>
          </nav>

          {/* Mobile Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {/* Mobile Side Panel */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>{title}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {/* Navigation Links */}
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                  
                  {/* Admin Navigation Links */}
                  <AdminOnly>
                    {adminNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </AdminOnly>
                  
                  {/* User Section */}
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/profile"
                        className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full text-left rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/auth"
                        className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/auth"
                        className="flex items-center rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop User Menu */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative hidden md:flex">
                    <User className="h-4 w-4" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Desktop Auth Buttons */}
            {!isAuthenticated && (
              <div className="hidden md:flex md:items-center md:space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link to="/auth">Create Account</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
};