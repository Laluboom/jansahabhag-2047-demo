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
    expect(screen.getByText('The Founder')).toBeInTheDocument();
    expect(screen.getByText('Founder and Initiator | Independent Learner')).toBeInTheDocument();
    const nazimImg = screen.getByRole('img', { name: 'Portrait of Nazim M. Sandh' });
    expect(nazimImg).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'nazimsandhbehappy@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:nazimsandhbehappy@gmail.com'
    );

    // Nazim full bio details across paragraphs
    const nazimBio1 = screen.getByText(/Based in the Gir region of Gujarat, Nazim M. Sandh has an academic background in microbiology/i);
    expect(nazimBio1).toBeInTheDocument();
    expect(nazimBio1.textContent).toContain('education, governance, youth development, science and social responsibility');

    const nazimBio2 = screen.getByText(/His experiences span research-based awareness work with students/i);
    expect(nazimBio2).toBeInTheDocument();
    expect(nazimBio2.textContent).toContain('sustainable cultivation initiatives, community fitness, cultural engagement and youth development programmes');
    expect(nazimBio2.textContent).toContain('understanding how knowledge can inform decisions, influence behaviour and contribute to collective well-being');

    const nazimBio3 = screen.getByText(/His engagement with civic participation developed through LOK MANCH-2047/i);
    expect(nazimBio3).toBeInTheDocument();
    expect(nazimBio3.textContent).toContain('Viksit Bharat Young Leaders Dialogue 2026');
    expect(nazimBio3.textContent).toContain('Ideas from the presentation were incorporated into the master presentation placed before the Hon’ble Prime Minister of India');
    expect(nazimBio3.textContent).toContain('role young citizens can play in democratic processes and India’s development');

    const nazimBio4 = screen.getByText(/JanSahabhag 2047 reflects an ongoing effort to examine these questions/i);
    expect(nazimBio4).toBeInTheDocument();
    expect(nazimBio4.textContent).toContain('explore practical ways of connecting young people with civic life');

    // Existing team member: Visesh Akbari (spelling preserved on card)
    expect(screen.getByRole('heading', { level: 3, name: 'Visesh Akbari' })).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    const viseshImg = screen.getByRole('img', { name: 'Portrait of Visesh Akbari' });
    expect(viseshImg).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/laluboom');
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/viseshakbari/');

    // Third team member: Yashvi Dalsaniya
    expect(screen.getByRole('heading', { level: 3, name: 'Yashvi Dalsaniya' })).toBeInTheDocument();
    expect(
      screen.getByText('Managing Partner | Student of Microbiology | Youth & Civic Engagement')
    ).toBeInTheDocument();
    const yashviImg = screen.getByRole('img', { name: 'Portrait of Yashvi Dalsaniya' });
    expect(yashviImg).toBeInTheDocument();
    expect(yashviImg).toHaveAttribute('src');

    // Yashvi bio details across full 4 paragraphs
    const bio1 = screen.getByText(/microbiology student with a growing interest/i);
    expect(bio1).toBeInTheDocument();
    expect(bio1.textContent).toContain('youth development');
    expect(bio1.textContent).toContain('education');
    expect(bio1.textContent).toContain('governance');
    expect(bio1.textContent).toContain('scientific thinking');
    expect(bio1.textContent).toContain('social responsibility');
    expect(bio1.textContent).toContain('evidence-based thinking');
    expect(bio1.textContent).toContain('entrepreneurship');
    expect(bio1.textContent).toContain('community participation');
    expect(bio1.textContent).toContain('role of young people in shaping society');

    const bio2 = screen.getByText(/brings together an interest in science, communication/i);
    expect(bio2).toBeInTheDocument();
    expect(bio2.textContent).toContain('organisational development');
    expect(bio2.textContent).toContain('initiatives that encourage young people to think critically');
    expect(bio2.textContent).toContain('meaningful development begins with informed individuals');
    expect(bio2.textContent).toContain('responsible leadership');
    expect(bio2.textContent).toContain('opportunities for young people to participate in decisions that shape their collective future');

    const bio3 = screen.getByText(/As Managing Partner of JanSahabhag 2047/i);
    expect(bio3).toBeInTheDocument();
    expect(bio3.textContent).toContain('strengthening civic awareness');
    expect(bio3.textContent).toContain('encouraging youth participation');
    expect(bio3.textContent).toContain('meaningful connections between citizens and democratic processes');
    expect(bio3.textContent).toContain('how ideas can translate into practical initiatives');
    expect(bio3.textContent).toContain("active contributors to India’s development journey");

    const bio4 = screen.getByText(/Through JanSahabhag 2047, she aims to contribute to a culture of informed participation/i);
    expect(bio4).toBeInTheDocument();
    expect(bio4.textContent).toContain('collaborative thinking and responsible citizenship');
    expect(bio4.textContent).toContain('vision of a developed India depends not only on institutions and policies');
    expect(bio4.textContent).toContain('awareness, initiative and collective responsibility of its people');

    // Verify no invented claims for Yashvi
    const allBioText = [bio1.textContent, bio2.textContent, bio3.textContent, bio4.textContent].join(' ');
    expect(allBioText).not.toMatch(/founded the idea|developed the website|built the platform/i);
  });

  it('renders Nazim and Yashvi in dedicated wide team card rows and Visesh in a centered compact card', () => {
    const { container } = render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );

    const peopleSection = container.querySelector('section[aria-labelledby="people-heading"]');
    expect(peopleSection).toBeInTheDocument();

    const articles = peopleSection?.querySelectorAll('article');
    expect(articles?.length).toBe(3);

    // Nazim is the first article, rendered as a dedicated wide team card row
    const nazimArticle = articles?.[0];
    expect(nazimArticle?.textContent).toContain('The Founder');
    expect(nazimArticle?.textContent).toContain('Nazim M. Sandh');

    // Visesh is the second article, rendered inside a centered flex wrapper
    const viseshArticle = articles?.[1];
    expect(viseshArticle?.textContent).toContain('Developer');
    expect(viseshArticle?.textContent).toContain('Visesh Akbari');
    expect(viseshArticle?.classList.contains('max-w-md')).toBe(true);
    const viseshWrapper = viseshArticle?.parentElement;
    expect(viseshWrapper?.className).toContain('flex');
    expect(viseshWrapper?.className).toContain('justify-center');

    // Yashvi is the third article, rendered as a dedicated wide team card row
    const yashviArticle = articles?.[2];
    expect(yashviArticle?.textContent).toContain('Managing Partner');
    expect(yashviArticle?.textContent).toContain('Yashvi Dalsaniya');
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
