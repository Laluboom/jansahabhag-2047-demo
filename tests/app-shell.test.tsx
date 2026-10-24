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

  it('renders ThreadMotif with evidence-to-action stages', () => {
    render(<ThreadMotif currentStage="evidence" />);
    expect(screen.getByText(/evidence-to-action thread/i)).toBeInTheDocument();
    expect(screen.getByText(/aarav's jaipur pedestrian safety pathway/i)).toBeInTheDocument();
  });
});
