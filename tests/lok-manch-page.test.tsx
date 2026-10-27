import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LokManchPage } from '../src/features/about/LokManchPage';

const renderPage = () =>
  render(
    <MemoryRouter>
      <LokManchPage />
    </MemoryRouter>
  );

describe('LokManchPage', () => {
  it('renders headings for the idea, the principles and the 2047 closing', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'The Idea: LOK MANCH-2047' })
    ).toBeInTheDocument();
    expect(screen.getByText('The idea behind the initiative')).toBeInTheDocument();
    expect(
      screen.getByText('From learning about society to participating responsibly in it.')
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Our Principles' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Looking Towards 2047' })
    ).toBeInTheDocument();
  });

  it('renders all five principles as list items', () => {
    renderPage();

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(5);

    expect(items[0]).toHaveTextContent(
      'Understanding before action. Meaningful participation begins with careful observation, informed judgement and an effort to understand the issue at hand.'
    );
    expect(items[1]).toHaveTextContent(
      'Dialogue before assumption. Different perspectives deserve to be heard and examined with respect.'
    );
    expect(items[2]).toHaveTextContent(
      'Responsibility alongside rights. Citizenship involves not only the ability to express concerns, but also the responsibility to understand their context and contribute constructively.'
    );
    expect(items[3]).toHaveTextContent(
      'Education connected with life. Learning gains social relevance when it helps people understand their relationships, institutions and responsibilities.'
    );
    expect(items[4]).toHaveTextContent(
      'Participation with purpose. The value of participation lies not merely in being present, but in contributing thoughtfully and responsibly.'
    );

    // Verify short names are in bold
    const boldTexts = within(list).getAllByText(/^[A-Z][a-z]+ before|^Responsibility alongside|^Education connected|^Participation with/);
    expect(boldTexts).toHaveLength(5);
    boldTexts.forEach((el) => {
      expect(el.tagName.toLowerCase()).toBe('strong');
    });
  });

  it('renders the concept-under-development notice', () => {
    renderPage();

    expect(
      screen.getByText(
        'LOK MANCH-2047 is a concept under development. This demo does not represent an operating government platform.'
      )
    ).toBeInTheDocument();
  });

  it('renders the back link pointing to /about', () => {
    renderPage();

    const backLink = screen.getByRole('link', { name: /back to about/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/about');
  });

  it('renders the verbatim body copy for JanSahabhag 2047, LOK MANCH-2047 and Looking Towards 2047', () => {
    renderPage();

    expect(
      screen.getByText(
        /A democracy depends not only on its institutions, but also on the understanding, judgement and participation of its citizens\./
      )
    ).toBeInTheDocument();
    expect(screen.getByText('JanSahabhag 2047 begins with this question.')).toBeInTheDocument();
    expect(
      screen.getByText(
        /The initiative seeks to explore ways of connecting education with civic understanding, constructive dialogue and meaningful democratic participation\./
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /LOK MANCH-2047 is the civic participation concept at the heart of this initiative\./
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The purpose is not simply to encourage young people to speak, but to help them understand what they are speaking about, listen to others, examine problems carefully and contribute constructively.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The larger question is whether civic understanding and responsibility can become a more integral part of education, rather than remain confined to occasional activities or formal occasions.'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /As India approaches the centenary of its independence, development invites reflection on more than economic progress and institutional growth\./
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'JanSahabhag 2047 seeks to contribute to this larger conversation by exploring how education can help nurture informed, responsible and participating citizens.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The aim is to bring learning closer to public life—and citizenship closer to everyday practice.'
      )
    ).toBeInTheDocument();
  });
});
