import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../src/components/ui/Button';
import { DemoPreviewBadge } from '../src/components/ui/DemoPreviewBadge';
import { StatusChip } from '../src/components/ui/StatusChip';
import { ThreadMotif } from '../src/components/layout/ThreadMotif';

describe('UI & Layout Components', () => {
  it('renders Button with variants and accessible focus styles', () => {
    render(<Button variant="primary">Submit Evidence</Button>);
    const btn = screen.getByRole('button', { name: /submit evidence/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('bg-civic-indigo-600');
  });

  it('renders StatusChip correctly for various status unions', () => {
    const { rerender } = render(<StatusChip status="verified" />);
    expect(screen.getByText(/verified/i)).toBeInTheDocument();

    rerender(<StatusChip status="revision_requested" />);
    expect(screen.getByText(/revision requested/i)).toBeInTheDocument();

    rerender(<StatusChip status="under_review" />);
    expect(screen.getByText(/under review/i)).toBeInTheDocument();
  });

  it('renders DemoPreviewBadge clearly indicating simulated features', () => {
    render(<DemoPreviewBadge label="Demo Preview" />);
    expect(screen.getByText(/demo preview/i)).toBeInTheDocument();
  });

  it('renders ThreadMotif with canonical five-stage product method', () => {
    const { rerender } = render(<ThreadMotif currentStage="observe" />);

    // Accessible name and landmark role
    const region = screen.getByRole('region', { name: /five-stage product method/i });
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-label', 'Five-Stage Product Method');

    // Title and story context preserved
    expect(screen.getByText(/five-stage product method/i)).toBeInTheDocument();
    expect(screen.getByText(/evidence-to-action thread/i)).toBeInTheDocument();
    expect(screen.getByText(/ankita's rajkot pedestrian safety pathway/i)).toBeInTheDocument();

    // Canonical stages from Master PRD opening §1 / Part A §A3
    expect(screen.getByText('1. Learn')).toBeInTheDocument();
    expect(screen.getByText('2. Observe')).toBeInTheDocument();
    expect(screen.getByText('3. Deliberate')).toBeInTheDocument();
    expect(screen.getByText('4. Propose')).toBeInTheDocument();
    expect(screen.getByText('5. Reflect')).toBeInTheDocument();

    // Active stage indicator
    const observeStep = screen.getByTestId('product-method-stage-observe');
    expect(observeStep).toHaveAttribute('aria-current', 'step');
    expect(observeStep.className).toContain('bg-civic-indigo-600');

    // Inactive stage does not have aria-current step
    const learnStep = screen.getByTestId('product-method-stage-learn');
    expect(learnStep).not.toHaveAttribute('aria-current');

    // Switching active stage updates aria-current and highlighting
    rerender(<ThreadMotif currentStage="deliberate" />);
    const deliberateStep = screen.getByTestId('product-method-stage-deliberate');
    expect(deliberateStep).toHaveAttribute('aria-current', 'step');
    expect(observeStep).not.toHaveAttribute('aria-current');
  });
});
