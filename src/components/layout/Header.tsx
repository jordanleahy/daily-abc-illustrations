import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, QrCode, Settings, Users, Activity } from 'lucide-react';
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
import { useHasRole } from '@/hooks/useUserRole';
import { useBookQRCode } from '@/hooks/useBookQRCode';
import { AdminOnly } from '@/components/AdminOnly';
import { Container } from './Container';

/**
 * Header Component
 * 
 * The primary navigation header component that adapts its appearance and functionality
 * based on the user's authentication status and role. Serves as the main navigation
 * hub throughout the application with role-based access control.
 * 
 * Key Features:
 * - Responsive design with mobile-friendly navigation
 * - Role-based rendering (unauthenticated, regular user, admin)
 * - Admin-specific styling with gradient background and special indicators
 * - QR code sharing functionality for content
 * - Contextual navigation based on user permissions
 * - Sticky positioning for persistent navigation access
 * 
 * Authentication States:
 * - **Unauthenticated**: Shows public branding with sign-in/sign-up options
 * - **Regular User**: Shows library navigation with user profile controls
 * - **Admin User**: Enhanced UI with admin panel access and special styling
 * 
 * @component
 * @example
 * // Basic usage for authenticated users
 * <Header title="My Library" />
 * 
 * @example
 * // With book sharing functionality  
 * <Header 
 *   title="Book Details"
 *   subtitle="Chapter 1: Getting Started"
 *   bookId="book-123"
 *   showQRCode={true}
 * />
 * 
 * @example
 * // With back navigation
 * <Header 
 *   title="Edit Mode"
 *   onBack={() => history.goBack()}
 * />
 */
interface HeaderProps {
  /** Header title text - defaults to "ABC Cards Platform" */
  title?: string;
  /** Optional subtitle text displayed below the main title */
  subtitle?: string;
  /** Book ID for QR code generation and content sharing */
  bookId?: string;
  /** Whether to show the QR code sharing functionality */
  showQRCode?: boolean;
  /** Handler for back navigation - shows back button when provided */
  onBack?: () => void;
}

/**
 * Header implementation with intelligent role-based rendering and navigation.
 * Automatically detects user authentication state and role to provide the
 * appropriate interface and navigation options.
 */
export function Header({
  title = "ABC Cards Platform",
  subtitle,
  bookId,
  showQRCode = true,
  onBack
}: HeaderProps) {
  const { isAuthenticated, user, signOut } = useAuth();
  const isAdmin = useHasRole('admin');
  const { qrCodeData } = useBookQRCode(bookId || '');
  const navigate = useNavigate();
  const location = useLocation();

  /** Sign out handler with automatic redirect to authentication page */
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  /** 
   * Smart title click navigation based on user state and context
   * Prioritizes back navigation, then role-appropriate default routes
   */
  const handleTitleClick = () => {
    if (onBack) {
      onBack();
    } else if (isAdmin) {
      navigate('/agents'); // Admin default route
    } else if (isAuthenticated) {
      navigate('/library');
    } else {
      navigate('/');
    }
  };

  /** Navigation configuration for regular authenticated users */
  const regularNavigation = [
    { name: 'Library', href: '/library' },
  ];

  /** Extended navigation menu for admin users with full system access */
  const adminNavigation = [
    { name: 'Chat', href: '/' },
    { name: 'My Books', href: '/books' },
    { name: 'Agents', href: '/agents' },
    { name: 'Daily Pub Schedule', href: '/daily-published-schedule' },
  ];


  // UNAUTHENTICATED STATE: Public header with authentication prompts
  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container>
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-foreground">{title}</span>
            </Link>

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
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex md:items-center md:space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link to="/auth">Create Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </header>
    );
  }

  // AUTHENTICATED STATE: Smart header with role-based styling and functionality
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-14 items-center justify-between">
          {/* Left section: Back navigation + Admin indicator */}
          <div className="flex items-center gap-3">
            {onBack && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack} 
                className={`p-2 h-8 rounded border ${isAdmin ? 'border-primary/30 hover:bg-primary/10' : 'border-border hover:bg-muted'}`}
              >
                <span className="text-xs">← Back</span>
              </Button>
            )}
            {isAdmin && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-primary">ADMIN</span>
              </div>
            )}
          </div>
          
          {/* Middle section: Title and subtitle */}
          <div className="flex flex-col items-center">
            {subtitle && (
              <div className="text-xs text-muted-foreground">
                {subtitle}
              </div>
            )}
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {isAdmin ? (
              <>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  Home
                </Link>
                {regularNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </nav>
          
          {/* Right section: Admin controls + QR button */}
          <div className="flex items-center gap-2">

            {/* Mobile Menu for authenticated users */}
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
                  {/* Regular User Navigation Links */}
                  {regularNavigation.map((item) => (
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
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop User Menu */}
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

            {/* QR Code Button */}
            {showQRCode && bookId && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1 h-8 w-8 rounded border border-border hover:bg-muted">
                    <QrCode className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader>
                    <SheetTitle>Share to Share</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <div className="w-64 h-64 rounded-lg flex items-center justify-center">
                      {qrCodeData.isLoading ? (
                        <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                          <QrCode className="w-16 h-16 text-muted-foreground animate-pulse" />
                        </div>
                      ) : qrCodeData.qrCodeImage ? (
                        <img 
                          src={qrCodeData.qrCodeImage} 
                          alt="QR Code for sharing this content"
                          className="w-64 h-64 rounded-lg"
                        />
                      ) : (
                        <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                          <QrCode className="w-16 h-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
        </Container>
      </header>
    );
  }