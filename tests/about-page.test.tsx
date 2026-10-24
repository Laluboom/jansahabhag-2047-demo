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

describe('AboutPage', () => {
  it('renders all three core team member cards with accurate details and portraits', () => {
    render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );

    // Existing team member: Nazim M. Sandh
    expect(screen.getByRole('heading', { level: 3, name: 'Nazim M. Sandh' })).toBeInTheDocument();
    expect(screen.getByText('Founder and Initiator')).toBeInTheDocument();
    const nazimImg = screen.getByRole('img', { name: 'Portrait of Nazim M. Sandh' });
    expect(nazimImg).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'nazimsandhbehappy@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:nazimsandhbehappy@gmail.com'
    );

    // Existing team member: Visesh Akbari (spelling preserved on card)
    expect(screen.getByRole('heading', { level: 3, name: 'Visesh Akbari' })).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    const viseshImg = screen.getByRole('img', { name: 'Portrait of Visesh Akbari' });
    expect(viseshImg).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/laluboom');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/viseshakbari/');

    // Third team member: Yashvi Dalsaniya
    expect(screen.getByRole('heading', { level: 3, name: 'Yashvi Dalsaniya' })).toBeInTheDocument();
    expect(screen.getByText('Managing Partner')).toBeInTheDocument();
    const yashviImg = screen.getByRole('img', { name: 'Portrait of Yashvi Dalsaniya' });
    expect(yashviImg).toBeInTheDocument();
    expect(yashviImg).toHaveAttribute('src');

    // Yashvi bio details across readable paragraphs
    const bio = screen.getByText(/microbiology student/i);
    expect(bio).toBeInTheDocument();
    expect(bio.textContent).toContain('youth development');
    expect(bio.textContent).toContain('education');
    expect(bio.textContent).toContain('governance');
    expect(bio.textContent).toContain('scientific thinking');
    expect(bio.textContent).toContain('social responsibility');
    expect(bio.textContent).toContain('entrepreneurship');
    expect(bio.textContent).toContain('communication');
    expect(bio.textContent).toContain('organisational development');
    expect(bio.textContent).toContain('community participation');
    expect(bio.textContent).toContain('how ideas turn into practical initiatives');

    const secondBio = screen.getByText(/developed-country vision/i);
    expect(secondBio).toBeInTheDocument();
    expect(secondBio.textContent).toContain('civic awareness');
    expect(secondBio.textContent).toContain('youth participation');
    expect(secondBio.textContent).toContain('citizen-democratic-process');
    expect(secondBio.textContent).toContain("India's developed-country vision");
    expect(secondBio.textContent).toContain("people's awareness");
    expect(secondBio.textContent).toContain('collective responsibility');
    expect(secondBio.textContent).toContain(
      "young people's opportunities to participate in decisions shaping their collective future"
    );

    // Verify no invented claims for Yashvi
    expect(bio.textContent).not.toMatch(/founded the idea|developed the website|built the platform/i);
    expect(secondBio.textContent).not.toMatch(/founded the idea|developed the website|built the platform/i);
  });

  it('renders Nazim and Visesh in a two-column grid and Yashvi in a dedicated wide team card row', () => {
    const { container } = render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );

    const peopleSection = container.querySelector('section[aria-labelledby="people-heading"]');
    expect(peopleSection).toBeInTheDocument();

    const articles = peopleSection?.querySelectorAll('article');
    expect(articles?.length).toBe(3);

    // First two articles (Nazim & Visesh) are in the 2-column grid
    const topGrid = peopleSection?.querySelector('div.grid.md\\:grid-cols-2');
    expect(topGrid).toBeInTheDocument();
    expect(topGrid?.querySelectorAll('article').length).toBe(2);

    // Yashvi article is outside topGrid, directly under section
    const yashviArticle = articles?.[2];
    expect(topGrid?.contains(yashviArticle!)).toBe(false);
  });

  it('renders "With gratitude" section with Nazim message, 9 styled names in stated order, closing lines, and demo disclosure', () => {
    const { container } = render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );

    // Section heading
    expect(screen.getByRole('heading', { level: 2, name: 'With gratitude' })).toBeInTheDocument();

    // Draft message in Nazim's voice
    for (const paragraph of GRATITUDE_MESSAGE.paragraphs) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
    expect(screen.getByText(`— ${GRATITUDE_MESSAGE.attribution}`)).toBeInTheDocument();

    // 9 entries in separate data module rendered in exact order
    const listItems = container.querySelectorAll('section[aria-labelledby="gratitude-heading"] li');
    expect(listItems.length).toBe(9);

    GRATITUDE_ENTRIES.forEach((entry, index) => {
      const item = listItems[index];
      expect(item.textContent).toContain(entry.name);
      if (entry.role) {
        expect(item.textContent).toContain(entry.role);
      }
    });

    // Shri Dadubhai Sandhar is first
    expect(listItems[0].textContent).toContain('Shri Dadubhai Sandhar');
    expect(listItems[0].textContent).toContain('स्वर्गीय। मार्गदर्शक एवं प्रेरणास्रोत');

    // Ganesh Bagadia ji and Rasida ben Sandh have no invented roles
    const ganeshItem = listItems[2];
    expect(ganeshItem.textContent).toBe('Ganesh Bagadia ji');

    const rasidaItem = listItems[5];
    expect(rasidaItem.textContent).toBe('Rasida ben Sandh');

    // Developer public spelling confirmed as Visesh Akbari
    const viseshGratitudeItem = listItems[8];
    expect(viseshGratitudeItem.textContent).toContain('Visesh Akbari');
    expect(viseshGratitudeItem.textContent).not.toContain('Vishesh');

    // Closing lines
    for (const line of GRATITUDE_CLOSING_LINES) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }

    // Disclosure
    expect(screen.getByText(GRATITUDE_DISCLOSURE)).toBeInTheDocument();
  });

  it('preserves section order: team before gratitude, and gratitude before approach', () => {
    const { container } = render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );

    const sections = Array.from(container.querySelectorAll('section'));
    const sectionIds = sections.map((s) => s.getAttribute('aria-labelledby'));

    const peopleIndex = sectionIds.indexOf('people-heading');
    const gratitudeIndex = sectionIds.indexOf('gratitude-heading');
    const approachIndex = sectionIds.indexOf('approach-heading');

    expect(peopleIndex).toBeGreaterThan(-1);
    expect(gratitudeIndex).toBeGreaterThan(peopleIndex);
    expect(approachIndex).toBeGreaterThan(gratitudeIndex);
  });
});
