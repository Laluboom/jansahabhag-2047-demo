import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HelpRulebooksPage } from '../src/components/layout/HelpRulebooksPage';

describe('HelpRulebooksPage - AI Boundaries Policy Panel', () => {
  it('renders the AI boundaries policy panel with clear boundaries and policy disclosures', () => {
    render(
      <MemoryRouter>
        <HelpRulebooksPage />
      </MemoryRouter>
    );

    // Header and core premise
    expect(screen.getByRole('heading', { name: /AI Boundaries: Policy & Principles/i })).toBeInTheDocument();
    expect(screen.getAllByText(/AI assists, people decide\./i).length).toBeGreaterThanOrEqual(1);

    // Permitted assistance items
    expect(screen.getByText(/Where AI may assist \(if built\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Suggest practice prompts for mock deliberations\./i)).toBeInTheDocument();
    expect(screen.getByText(/Draft candidate agendas for assembly sessions\./i)).toBeInTheDocument();
    expect(screen.getByText(/Summarise public discussions into concise overviews\./i)).toBeInTheDocument();
    expect(screen.getByText(/Explain rulebook and procedural guidelines in plain language\./i)).toBeInTheDocument();

    // Prohibited actions
    expect(screen.getByText(/Strictly prohibited \(AI must not\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Award civic credits or change passport status\./i)).toBeInTheDocument();
    expect(screen.getByText(/Verify field evidence or audit submissions\./i)).toBeInTheDocument();
    expect(screen.getByText(/Rank, score, or profile participants\./i)).toBeInTheDocument();
    expect(screen.getByText(/Choose speakers or allocate turns during assembly\./i)).toBeInTheDocument();
    expect(screen.getByText(/Moderate discussions autonomously or issue disciplinary actions\./i)).toBeInTheDocument();
    expect(screen.getByText(/Access or ingest private UHV reflections\./i)).toBeInTheDocument();

    // Safeguards, appealability, and policy/demo disclosures
    expect(screen.getByText(/Safeguards, Output Handling & Appeals/i)).toBeInTheDocument();
    expect(screen.getByText(/All AI-generated content must be clearly labelled, reviewable, and freely editable or discardable/i)).toBeInTheDocument();
    expect(screen.getByText(/AI never decides credit awards, evidence verification, moderation actions, or appeals\./i)).toBeInTheDocument();
    expect(screen.getByText(/Routine credits may be awarded automatically by deterministic system rules/i)).toBeInTheDocument();
    expect(screen.getByText(/human review and appeals remaining available where implemented\./i)).toBeInTheDocument();
    expect(screen.getByText(/No generative AI features or commercial model providers are currently active or operating in this fictional browser demo\./i)).toBeInTheDocument();
  });
});
