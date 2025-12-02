import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, User, LogOut, QrCode, Settings, Users, Activity, ArrowLeft, BookOpen, Book, MessageSquare } from 'lucide-react';
import { useState } from 'react';
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
import { useAuthContext } from '@/contexts/AuthContext';
import { useBookQRCode } from '@/hooks/useBookQRCode';
import { useNavigation } from '@/hooks/useNavigation';
import { useProfile } from '@/hooks/useProfile';
import { useParentTotalPennies } from '@/hooks/useParentTotalPennies';
import { useKidProfiles } from '@/hooks/useKidProfiles';
import { AdminOnly } from '@/components/AdminOnly';
import { Container } from './Container';
import { UserProfileModal } from '@/components/profile/UserProfileModal';
import { PennyCounter } from '@/components/ui/penny-counter';
import { getDefaultRouteForRole } from '@/config/routes';

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
  /** Optional callback for mobile menu toggle (Google Chat sidebar) */
  onMobileMenuToggle?: () => void;
  /** Whether to show review outline button (Google Chat) */
  showReviewButton?: boolean;
  /** Callback for review outline button click */
  onReviewClick?: () => void;
  /** Variant for review button: 'review' or 'view-book' */
  reviewButtonVariant?: 'review' | 'view-book';
}

/**
 * Header implementation with intelligent role-based rendering and navigation.
 * Automatically detects user authentication state and role to provide the
 * appropriate interface and navigation options.
 */
export function Header({
  title = "Chairlift Education",
  subtitle,
  bookId,
  showQRCode = true,
  onMobileMenuToggle,
  showReviewButton,
  onReviewClick,
  reviewButtonVariant
}: HeaderProps) {
  const { isAuthenticated, user, signOut } = useAuthContext();
  const { routes, isRouteActive, navigateToRoute, isAdmin } = useNavigation();
  const { qrCodeData } = useBookQRCode(bookId || '');
  const { data: profile } = useProfile();
  const { totalPennies } = useParentTotalPennies();
  const { data: kidProfiles } = useKidProfiles();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Display name strategy: Use kid's name if only one kid exists, otherwise use parent's name
  // This matches the pattern used in ReadingHeader, Index, LibraryBookView, and Rewards pages
  const displayName = kidProfiles?.length === 1 
    ? kidProfiles[0].first_name
    : profile?.first_name || user?.email?.split('@')[0] || 'User';

  /** Sign out handler with automatic redirect to authentication page */
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  /** Navigate back one path in browser history */
  const handleBackNavigation = () => {
    navigate(-1);
  };

  /** 
   * Smart title click navigation based on user state and context
   * Routes to role-appropriate default routes
   */
  const handleTitleClick = () => {
    navigate(getDefaultRouteForRole(isAdmin, isAuthenticated));
  };


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
                      to="/auth?mode=signup"
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
                  <Link to="/auth?mode=signup">Create Account</Link>
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
          {/* Left section: Mobile hamburger + Review button + Mobile user info + Desktop back button + Subtitle */}
          <div className="flex items-center gap-2">
            {/* Mobile Chat Sessions Menu - Google Chat only */}
            {onMobileMenuToggle && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={onMobileMenuToggle}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            )}
            
            {/* Review/View Book Button - Google Chat only, mobile only */}
            {showReviewButton && onReviewClick && (
              <Button
                onClick={onReviewClick}
                className="md:hidden h-8"
                size="sm"
              >
                {reviewButtonVariant === 'view-book' ? (
                  <>
                    <Book className="h-4 w-4 mr-1" />
                    View Book
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-1" />
                    Review
                  </>
                )}
              </Button>
            )}
            
            {/* Mobile User Info - Hidden on google-chat page */}
            {location.pathname !== '/google-chat' && (
              <div className="flex md:hidden items-center gap-2">
                <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                  {displayName}
                </Link>
                <span className="text-muted-foreground text-xs">·</span>
                <PennyCounter pennies={totalPennies} size="sm" showLabel={false} />
              </div>
            )}
            
            {/* Desktop Back Button - Only on library detail pages */}
            {location.pathname.includes('/library/') && location.pathname.includes('/detail') && (
              <Button
                onClick={() => navigate('/library')}
                variant="ghost"
                size="sm"
                className="hidden md:flex gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Library
              </Button>
            )}
            
            {/* Subtitle */}
            {subtitle && (
              <div className="text-xs text-muted-foreground">
                {subtitle}
              </div>
            )}
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {routes.map((route) => {
              const isActive = isRouteActive(route);
              
              return (
                <Link
                  key={route.name}
                  to={route.path}
                  onClick={(e) => navigateToRoute(route, e)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {route.name}
                </Link>
              );
            })}
          </nav>
          
          {/* Right section: Review button + Admin controls + QR button */}
          <div className="flex items-center gap-2">
            {/* Desktop Review/View Book Button - Google Chat only */}
            {showReviewButton && onReviewClick && (
              <Button
                onClick={onReviewClick}
                className="hidden md:flex"
                size="sm"
                variant="default"
              >
                {reviewButtonVariant === 'view-book' ? (
                  <>
                    <Book className="h-4 w-4 mr-2" />
                    View Book
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Review Outline
                  </>
                )}
              </Button>
            )}

            {/* Mobile Menu for authenticated users */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
                <div className="flex items-center justify-between px-6 py-3 border-b">
                  <span className="text-base font-semibold">{displayName}</span>
                  <PennyCounter pennies={totalPennies} size="sm" showLabel={false} />
                </div>
                <div className="mt-6 space-y-2">
                  {/* Navigation Links */}
                  {routes.map((route) => {
                    const isActive = isRouteActive(route);
                    
                    return (
                      <Link
                        key={route.name}
                        to={route.path}
                        onClick={(e) => {
                          setIsSheetOpen(false);
                          navigateToRoute(route, e);
                        }}
                        className={`flex items-center rounded-md px-3 py-2 text-base font-medium transition-all duration-150 active:scale-[0.98] ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80'
                        }`}
                      >
                        {route.icon && <route.icon className="mr-2 h-4 w-4" />}
                        {route.name}
                      </Link>
                    );
                  })}
                  
                  {/* Admin User Activity Link */}
                  <AdminOnly>
                    <Link
                      to="/admin/user-activity"
                      onClick={() => setIsSheetOpen(false)}
                      className={`flex items-center rounded-md px-3 py-2 text-base font-medium transition-all duration-150 active:scale-[0.98] ${
                        location.pathname === '/admin/user-activity'
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80'
                      }`}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      User Activity
                    </Link>
                  </AdminOnly>
                  
                  {/* User Section */}
                  <button
                    onClick={() => {
                      setTimeout(() => {
                        setIsSheetOpen(false);
                        navigate('/word-progress');
                      }, 100);
                    }}
                    className="flex items-center w-full text-left rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 active:scale-[0.98] active:bg-muted/80"
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    Word Progress
                  </button>
                  <button
                    onClick={() => {
                      setTimeout(() => {
                        setIsSheetOpen(false);
                        setIsProfileModalOpen(true);
                      }, 100);
                    }}
                    className="flex items-center w-full text-left rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 active:scale-[0.98] active:bg-muted/80"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsSheetOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center w-full text-left rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 active:scale-[0.98] active:bg-muted/80"
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
                <Button variant="ghost" size="sm" className="relative hidden md:flex items-center gap-2 px-3">
                  <span className="text-sm font-medium">{displayName}</span>
                  <span className="text-muted-foreground text-sm">·</span>
                  <PennyCounter pennies={totalPennies} size="sm" showLabel={false} />
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-between gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <PennyCounter pennies={totalPennies} size="sm" showLabel={false} />
                </div>
                <DropdownMenuSeparator />
                <AdminOnly>
                  <DropdownMenuItem onClick={() => navigate('/admin/user-activity')}>
                    <Users className="mr-2 h-4 w-4" />
                    User Activity
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </AdminOnly>
                <DropdownMenuItem onClick={() => navigate('/word-progress')}>
                  <Activity className="mr-2 h-4 w-4" />
                  Word Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
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
      
      <UserProfileModal 
        open={isProfileModalOpen} 
        onOpenChange={setIsProfileModalOpen} 
      />
    </header>
    );
  }