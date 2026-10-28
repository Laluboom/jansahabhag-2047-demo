import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import fs from 'fs';
import path from 'path';
import { ThreadMotif, CANONICAL_PRODUCT_METHOD_STAGES } from '../src/components/layout/ThreadMotif';
import { AssemblySessionPage } from '../src/features/assemblies/AssemblySessionPage';
import { EvidencePage } from '../src/features/passport/EvidencePage';
import { ParticipantDashboardPage } from '../src/features/dashboard/ParticipantDashboardPage';
import { AssembliesPage } from '../src/features/assemblies/AssembliesPage';
import { PersistenceService } from '../src/services/persistence';
import { demoRepository } from '../src/services/demoRepository';
import { useAuthStore } from '../src/stores/authStore';

describe('Reference Reconciliation 2026-10-27 Repairs', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  describe('1. Canonical Five-Stage Product Method Banner (ThreadMotif)', () => {
    it('defines canonical stages Learn -> Observe -> Deliberate -> Propose -> Reflect', () => {
      expect(CANONICAL_PRODUCT_METHOD_STAGES).toEqual([
        { key: 'learn', label: '1. Learn' },
        { key: 'observe', label: '2. Observe' },
        { key: 'deliberate', label: '3. Deliberate' },
        { key: 'propose', label: '4. Propose' },
        { key: 'reflect', label: '5. Reflect' },
      ]);
    });

    it('renders with accessible name Five-Stage Product Method and role region', () => {
      render(<ThreadMotif currentStage="observe" />);
      const region = screen.getByRole('region', { name: /five-stage product method/i });
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute('aria-label', 'Five-Stage Product Method');
    });

    it('highlights active stage and preserves story context', () => {
      render(<ThreadMotif currentStage="observe" />);
      expect(screen.getByText('2. Observe')).toBeInTheDocument();
      expect(screen.getByTestId('product-method-stage-observe')).toHaveAttribute('aria-current', 'step');
      expect(screen.getByTestId('product-method-stage-learn')).not.toHaveAttribute('aria-current');

      // Preserves Ankita Rajkot story subtitle
      expect(screen.getByText(/Ankita's Rajkot Pedestrian Safety Pathway/i)).toBeInTheDocument();
    });

    it('caller props: ParticipantDashboardPage renders ThreadMotif with observe stage active', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ParticipantDashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const observeStep = screen.getByTestId('product-method-stage-observe');
        expect(observeStep).toBeInTheDocument();
        expect(observeStep).toHaveAttribute('aria-current', 'step');
      });
    });

    it('caller props: AssembliesPage renders ThreadMotif with deliberate stage active', async () => {
      render(
        <MemoryRouter initialEntries={['/assemblies']}>
          <AssembliesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const deliberateStep = screen.getByTestId('product-method-stage-deliberate');
        expect(deliberateStep).toBeInTheDocument();
        expect(deliberateStep).toHaveAttribute('aria-current', 'step');
      });
    });
  });

  describe('2. Accessible Neutral Temporary Favicon', () => {
    const faviconPath = path.resolve(__dirname, '../public/favicon.svg');
    const indexHtmlPath = path.resolve(__dirname, '../index.html');

    it('supplies public/favicon.svg with accessible SVG markup', () => {
      expect(fs.existsSync(faviconPath)).toBe(true);
      const svgContent = fs.readFileSync(faviconPath, 'utf8');

      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('viewBox="0 0 32 32"');
      expect(svgContent).toContain('role="img"');
      expect(svgContent).toContain('aria-label=');
      expect(svgContent).toContain('<title>');
      expect(svgContent).toContain('<desc>');
    });

    it('carries the approved Chaupal Ring mark with brand colors', () => {
      const svgContent = fs.readFileSync(faviconPath, 'utf8');

      // Brand colors: navy (#06038D) and saffron (#FF671F)
      expect(svgContent).toContain('#06038D');
      expect(svgContent).toContain('#FF671F');

      // Restraint: mark contains no chakra, pillar, or mandala
      expect(svgContent.toLowerCase()).not.toContain('chakra');
      expect(svgContent.toLowerCase()).not.toContain('pillar');
      expect(svgContent.toLowerCase()).not.toContain('mandala');
      expect(svgContent.toLowerCase()).not.toContain('torch');
    });

    it('verifies index.html references /favicon.svg', () => {
      const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      expect(indexHtml).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg"');
    });
  });

  describe('3. Narrow-Phone Responsive Wrapping (320px & 375px)', () => {
    it('renders AssemblySessionPage with responsive wrapping safeguards for narrow viewports', async () => {
      await demoRepository.joinAssembly('assembly_jaipur_pedestrian_2026', 'VSC-S-001');

      const { container } = render(
        <MemoryRouter initialEntries={['/assemblies/assembly_jaipur_pedestrian_2026/session']}>
          <Routes>
            <Route path="/assemblies/:id/session" element={<AssemblySessionPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Youth Chamber in Session/i)).toBeInTheDocument();
      });

      // Top session header has min-w-0 and flex-wrap badges
      // Several header blocks now carry .min-w-0.flex-1; assert the one holding the badges.
      const headerWrappers = [...container.querySelectorAll('.min-w-0.flex-1')];
      expect(headerWrappers.length).toBeGreaterThan(0);

      const badgeContainer = headerWrappers
        .map((w) => w.querySelector('.flex.flex-wrap.items-center.gap-2'))
        .find((el) => el !== null);
      expect(badgeContainer).not.toBeNull();

      // Workspace cards have min-w-0
      const workspaceColumn = container.querySelector('.lg\\:col-span-8');
      expect(workspaceColumn?.className).toContain('min-w-0');

      const queueColumn = container.querySelector('.lg\\:col-span-4');
      expect(queueColumn?.className).toContain('min-w-0');
    });

    it('renders EvidencePage with responsive wrapping on cards, badges, and search bar', async () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/passport/evidence']}>
          <EvidencePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Verifiable Evidence Repository/i })).toBeInTheDocument();
      });

      // Header actions have self-start sm:self-auto and shrink-0 to prevent narrow overflow
      const recordBadge = screen.getByText(/Traceable Records/i);
      expect(recordBadge.className).toContain('shrink-0');

      // Search bar wrapper expands safely on narrow widths
      const searchInput = screen.getByPlaceholderText(/Search evidence or ID/i);
      const searchWrapper = searchInput.parentElement;
      expect(searchWrapper?.className).toContain('w-full');
      expect(searchWrapper?.className).toContain('sm:w-auto');

      // Evidence cards have min-w-0 and break-words on titles and descriptions
      const cards = container.querySelectorAll('.border-slate-200');
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach((card) => {
        if (card.querySelector('h3, [class*="font-heading"]')) {
          expect(card.className).toContain('min-w-0');
        }
      });
    });
  });
});
