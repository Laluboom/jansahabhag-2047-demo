import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AboutPage } from '../src/features/about/AboutPage';
import {
  GRATITUDE_ENTRIES,
  GRATITUDE_CLOSING_LINES,
  GRATITUDE_DISCLOSURE,
  GRATITUDE_MESSAGE,
} from '../src/data/gratitude';

const renderPage = () => render(<MemoryRouter><AboutPage /></MemoryRouter>);

describe('AboutPage', () => {
  it('shows the selected editorial page with founder details behind See more', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Connecting education with citizenship.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Nazim M. Sandh' })).toBeInTheDocument();
    expect(screen.getByText('Founder and Initiator | Independent Learner')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Portrait of Nazim M. Sandh' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'nazimsandhbehappy@gmail.com' })).toHaveAttribute('href', 'mailto:nazimsandhbehappy@gmail.com');
    const bio = screen.getByText('See more about Nazim').closest('details');
    expect(bio).not.toHaveAttribute('open');
    expect(bio).toHaveTextContent('Viksit Bharat Young Leaders Dialogue 2026');
    expect(bio).toHaveTextContent('sustainable cultivation initiatives');
    expect(screen.getByText(/Single-browser simulation/)).toBeInTheDocument();
  });

  it('keeps all nine gratitude credits in order, including Visesh and his portrait', () => {
    const { container } = renderPage();
    const founder = container.querySelector('section[aria-labelledby="people-heading"]');
    const gratitude = container.querySelector('section[aria-labelledby="gratitude-heading"]');
    expect(founder).toBeInTheDocument();
    expect(gratitude).toBeInTheDocument();
    expect(founder?.compareDocumentPosition(gratitude!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getByRole('heading', { level: 2, name: 'With gratitude' })).toBeInTheDocument();
    for (const paragraph of GRATITUDE_MESSAGE.paragraphs) expect(screen.getByText(paragraph)).toBeInTheDocument();
    expect(screen.getByText(`— ${GRATITUDE_MESSAGE.attribution}`)).toBeInTheDocument();

    const items = gratitude?.querySelectorAll('ol li');
    expect(items).toHaveLength(11);
    GRATITUDE_ENTRIES.forEach((entry, index) => {
      expect(items?.[index]).toHaveTextContent(entry.name);
      if (entry.role) expect(items?.[index]).toHaveTextContent(entry.role);
    });
    GRATITUDE_ENTRIES.forEach((entry, index) => {
      if (!entry.role) expect(items?.[index]?.querySelector('small')).toBeNull();
    });
    const visesh = items?.[10];
    expect(visesh?.querySelector('img')).toHaveAttribute('alt', 'Portrait of Visesh Akbari');
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/laluboom');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/viseshakbari/');
    expect(screen.queryByRole('heading', { name: 'Visesh Akbari' })).not.toBeInTheDocument();
    expect(screen.queryByText('Yashvi Dalsaniya')).not.toBeInTheDocument();
    for (const line of GRATITUDE_CLOSING_LINES) expect(screen.getByText(line)).toBeInTheDocument();
    expect(screen.getByText(GRATITUDE_DISCLOSURE)).toBeInTheDocument();
  });
});
