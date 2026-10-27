import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChaupalRing } from '../src/components/brand/ChaupalRing';
import { BrandLockup } from '../src/components/brand/BrandLockup';
import { DesktopSidebar } from '../src/components/layout/DesktopSidebar';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';
import { DEMO_COLLEGE_FULL_NAME } from '../src/data/seed/institutions';

describe('Brand Mark & Wordmark: Chaupal Ring and Shirorekha Table', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  describe('ChaupalRing Component', () => {
    it('renders 11 ring dots plus one entering dot', () => {
      const { container } = render(<ChaupalRing size={48} />);

      // Exactly 12 dots total (circles only)
      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(12);

      // 11 ring dots in navy (#06038D)
      const navyDots = Array.from(circles).filter(
        (c) => c.getAttribute('fill') === '#06038D'
      );
      expect(navyDots).toHaveLength(11);

      // 1 entering dot in saffron (#FF671F)
      const saffronDots = Array.from(circles).filter(
        (c) => c.getAttribute('fill') === '#FF671F'
      );
      expect(saffronDots).toHaveLength(1);

      // Entering dot is slightly larger than the ring dots
      const ringRadius = Number(navyDots[0].getAttribute('r'));
      const enteringRadius = Number(saffronDots[0].getAttribute('r'));
      expect(enteringRadius).toBeGreaterThan(ringRadius);
    });

    it('with a title exposes an image role with that accessible name; without one it is aria-hidden and exposes no role', () => {
      // With title
      const { unmount } = render(<ChaupalRing title="Chaupal Ring Symbol" />);
      const img = screen.getByRole('img', { name: 'Chaupal Ring Symbol' });
      expect(img).toBeInTheDocument();
      expect(img).not.toHaveAttribute('aria-hidden');
      expect(img.querySelector('title')).toHaveTextContent('Chaupal Ring Symbol');
      unmount();

      // Without title
      const { container } = render(<ChaupalRing />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).not.toHaveAttribute('role');
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(svg?.querySelector('title')).toBeNull();
    });

    it('the monochrome variant renders no saffron fill', () => {
      const { container } = render(<ChaupalRing variant="monochrome" />);

      const saffronElements = container.querySelectorAll('[fill="#FF671F"]');
      expect(saffronElements).toHaveLength(0);

      // In monochrome, all 12 dots are navy, keeping the entering dot legible via size
      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(12);
      circles.forEach((circle) => {
        expect(circle.getAttribute('fill')).toBe('#06038D');
      });
    });
  });

  describe('BrandLockup Component', () => {
    it('renders जनसहभाग as text content, so a shaping-capable renderer gets real characters', () => {
      const { container } = render(<BrandLockup showRing />);

      // Real DOM text for Devanagari script
      const devanagariElement = screen.getByText('जनसहभाग');
      expect(devanagariElement).toBeInTheDocument();
      expect(devanagariElement.tagName.toLowerCase()).toBe('span');

      // Latin wordmark and 2047 modular tag
      expect(screen.getByText('JanSahabhag')).toBeInTheDocument();
      expect(screen.getByText('2047')).toBeInTheDocument();

      // Includes ChaupalRing when showRing is true
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('DesktopSidebar Brand Header Integration', () => {
    it('the sidebar brand link still routes to the dashboard and still shows the institution name', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DesktopSidebar />
        </MemoryRouter>
      );

      // Brand link pointing to /dashboard
      const dashboardLinks = screen.getAllByRole('link', { name: /jansahabhag/i });
      const brandHeaderLink = dashboardLinks.find((link) =>
        link.getAttribute('href') === '/dashboard'
      );
      expect(brandHeaderLink).toBeInTheDocument();

      // Shows the institution name
      expect(screen.getByText(DEMO_COLLEGE_FULL_NAME)).toBeInTheDocument();

      // ChaupalRing is rendered inside the brand link instead of the old gradient tile
      const circlesInBrandLink = brandHeaderLink?.querySelectorAll('circle');
      expect(circlesInBrandLink?.length).toBe(12);
    });
  });
});
