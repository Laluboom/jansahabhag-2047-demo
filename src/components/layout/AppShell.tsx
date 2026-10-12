import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DesktopSidebar } from './DesktopSidebar';
import { TopUtilityBar } from './TopUtilityBar';
import { MobileBottomNav } from './MobileBottomNav';

export const AppShell: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close drawer automatically on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen flex bg-slate-50 antialiased overflow-x-hidden">
      {/* Desktop Sidebar (hidden on screens < 1024px) */}
      <DesktopSidebar />

      {/* Mobile Drawer Overlay (for screens < 1024px) */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
          className="fixed inset-0 z-50 lg:hidden flex"
          data-testid="mobile-navigation-drawer"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
            data-testid="mobile-drawer-backdrop"
          />

          {/* Drawer container (max 280px to safely fit 320px viewports without horizontal overflow) */}
          <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-slate-900 shadow-xl z-10 h-full animate-in slide-in-from-left duration-200">
            <DesktopSidebar
              isMobile
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0 overflow-x-hidden">
        <TopUtilityBar
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          <Suspense
            fallback={
              <div
                className="flex items-center justify-center min-h-[400px]"
                role="status"
                aria-label="Loading page content"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Quick access) */}
      <MobileBottomNav />
    </div>
  );
};
