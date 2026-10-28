import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './AboutPage.css';

export const LokManchPage: React.FC = () => (
  <article className="about-editorial" aria-label="The Idea: LOK MANCH-2047">
    <div className="about-editorial__masthead">
      <strong>JanSahabhag 2047</strong>
      <span>LOK MANCH-2047</span>
    </div>

    <header className="about-editorial__hero">
      <p className="about-editorial__kicker">The idea behind the initiative</p>
      <h1>The Idea: LOK MANCH-2047</h1>
      <p>From learning about society to participating responsibly in it.</p>
    </header>

    <div className="about-editorial__content">
      <section className="about-editorial__prose" aria-label="About JanSahabhag 2047">
        <p>
          A democracy depends not only on its institutions, but also on the understanding, judgement and participation of its citizens. Yet the relationship between education and democratic life deserves greater attention: how do young people move from learning about society to participating responsibly in it?
        </p>
        <p>JanSahabhag 2047 begins with this question.</p>
        <p>
          The initiative seeks to explore ways of connecting education with civic understanding, constructive dialogue and meaningful democratic participation. It envisions young people who can understand public institutions, recognise concerns within their communities, engage with different perspectives and contribute thoughtfully to the society of which they are a part.
        </p>
      </section>

      <section className="about-editorial__prose about-editorial__section" aria-label="The Idea: LOK MANCH-2047">
        <p>
          LOK MANCH-2047 is the civic participation concept at the heart of this initiative. It envisions a connection between educational institutions, young citizens, democratic institutions and public representatives—creating pathways through which students can move beyond awareness towards informed participation.
        </p>
        <p>
          The purpose is not simply to encourage young people to speak, but to help them understand what they are speaking about, listen to others, examine problems carefully and contribute constructively.
        </p>
        <p>
          The larger question is whether civic understanding and responsibility can become a more integral part of education, rather than remain confined to occasional activities or formal occasions.
        </p>
      </section>

      <section className="about-editorial__section" aria-labelledby="principles-heading">
        <h2 id="principles-heading">Our Principles</h2>
        <ul className="about-editorial__principles">
          <li>
            <strong>Understanding before action.</strong> Meaningful participation begins with careful observation, informed judgement and an effort to understand the issue at hand.
          </li>
          <li>
            <strong>Dialogue before assumption.</strong> Different perspectives deserve to be heard and examined with respect.
          </li>
          <li>
            <strong>Responsibility alongside rights.</strong> Citizenship involves not only the ability to express concerns, but also the responsibility to understand their context and contribute constructively.
          </li>
          <li>
            <strong>Education connected with life.</strong> Learning gains social relevance when it helps people understand their relationships, institutions and responsibilities.
          </li>
          <li>
            <strong>Participation with purpose.</strong> The value of participation lies not merely in being present, but in contributing thoughtfully and responsibly.
          </li>
        </ul>
      </section>

      <section className="about-editorial__prose about-editorial__section" aria-labelledby="looking-towards-heading">
        <h2 id="looking-towards-heading">Looking Towards 2047</h2>
        <p>
          As India approaches the centenary of its independence, development invites reflection on more than economic progress and institutional growth. It also raises a question about the kind of citizenship that will sustain the country&apos;s future.
        </p>
        <p>
          JanSahabhag 2047 seeks to contribute to this larger conversation by exploring how education can help nurture informed, responsible and participating citizens.
        </p>
        <p>
          The aim is to bring learning closer to public life—and citizenship closer to everyday practice.
        </p>
      </section>
    </div>

    <footer className="about-editorial__footer">
      <p>LOK MANCH-2047 is a concept under development. This demo does not represent an operating government platform.</p>
      <Link to="/about">
        <ArrowLeft size={16} aria-hidden="true" /> Back to About
      </Link>
    </footer>
  </article>
);
