import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DesktopSidebar } from './DesktopSidebar';
import { TopUtilityBar } from './TopUtilityBar';
import { MobileBottomNav } from './MobileBottomNav';

export const AppShell: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  // Close drawer automatically on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Focus management and focus trap for mobile drawer dialog
  useEffect(() => {
    if (isMobileMenuOpen) {
      wasOpenRef.current = true;
      previouslyFocusedElementRef.current = (document.activeElement as HTMLElement) || null;

      // Focus close control or first focusable control inside the drawer on open
      const focusInitial = () => {
        if (!drawerRef.current) return;
        const closeBtn = drawerRef.current.querySelector<HTMLElement>('button[aria-label="Close navigation menu"]');
        if (closeBtn) {
          closeBtn.focus();
        } else {
          const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
            'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
      };

      const timer = setTimeout(focusInitial, 16);

      // Trap Tab key within drawer
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsMobileMenuOpen(false);
          return;
        }

        if (e.key === 'Tab') {
          if (!drawerRef.current) return;
          const focusables = Array.from(
            drawerRef.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.getAttribute('aria-hidden') !== 'true');

          if (focusables.length === 0) {
            e.preventDefault();
            return;
          }

          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey) {
            // Shift + Tab: if on first element or outside, wrap to last
            if (document.activeElement === first || !drawerRef.current.contains(document.activeElement)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            // Tab: if on last element or outside, wrap to first
            if (document.activeElement === last || !drawerRef.current.contains(document.activeElement)) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      // Restore focus to toggle button or previously focused element on close
      const candidate = previouslyFocusedElementRef.current;
      const restoreTarget =
        candidate && candidate !== document.body && document.body.contains(candidate)
          ? candidate
          : document.getElementById('mobile-menu-toggle');
      restoreTarget?.focus();
    }
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
          ref={drawerRef}
          id="mobile-navigation-drawer"
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
