import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import nazimPortrait from '../../assets/about/nazim-sandh.jpeg';
import viseshPortrait from '../../assets/about/visesh-akbari.jpg';
import {
  GRATITUDE_MESSAGE,
  GRATITUDE_ENTRIES,
  GRATITUDE_CLOSING_LINES,
  GRATITUDE_DISCLOSURE,
} from '../../data/gratitude';
import './AboutPage.css';

export const AboutPage: React.FC = () => (
  <article className="about-editorial" aria-label="About JanSahabhag 2047">
    <div className="about-editorial__masthead">
      <strong>JanSahabhag 2047</strong>
      <span>About the work</span>
    </div>

    <header className="about-editorial__hero">
      <p className="about-editorial__kicker">The idea behind the work</p>
      <h1>Connecting education with citizenship.</h1>
      <p>JanSahabhag 2047 explores how young people can learn about society and take part in it responsibly.</p>
      <p className="about-editorial__hero-nav">
        <Link to="/lok-manch" className="about-editorial__hero-link">
          The Idea: LOK MANCH-2047 <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </p>
      <span className="about-editorial__demo">Competition demo · Single-browser simulation</span>
    </header>

    <section className="about-editorial__founder" aria-labelledby="people-heading">
      <figure>
        <img src={nazimPortrait} alt="Portrait of Nazim M. Sandh" width="1254" height="1254" />
        <figcaption>Founder and Initiator · Gir region, Gujarat</figcaption>
      </figure>
      <div className="about-editorial__founder-copy">
        <p className="about-editorial__kicker">The Founder</p>
        <h2 id="people-heading">Nazim M. Sandh</h2>
        <p className="about-editorial__role">Founder and Initiator | Independent Learner</p>
        <details className="about-editorial__bio">
          <summary>See more about Nazim</summary>
          <div>
            <p>Based in the Gir region of Gujarat, Nazim M. Sandh has an academic background in microbiology and a broader interest in education, governance, youth development, science and social responsibility.</p>
            <p>His experiences span research-based awareness work with students, sustainable cultivation initiatives, community fitness, cultural engagement and youth development programmes. Across these different fields, a recurring interest has shaped his work: understanding how knowledge can inform decisions, influence behaviour and contribute to collective well-being.</p>
            <p>His engagement with civic participation developed through LOK MANCH-2047, which he presented in the context of the Viksit Bharat Young Leaders Dialogue 2026. Ideas from the presentation were incorporated into the master presentation placed before the Hon’ble Prime Minister of India. This experience further informed his interest in the role young citizens can play in democratic processes and India’s development.</p>
            <p>JanSahabhag 2047 reflects an ongoing effort to examine these questions and explore practical ways of connecting young people with civic life.</p>
          </div>
        </details>
        <a className="about-editorial__contact" href="mailto:nazimsandhbehappy@gmail.com">nazimsandhbehappy@gmail.com</a>
      </div>
    </section>

    <hr className="about-editorial__rule" />

    <section className="about-editorial__gratitude" aria-labelledby="gratitude-heading">
      <p className="about-editorial__kicker">The people who helped</p>
      <h2 id="gratitude-heading">With gratitude</h2>
      <div className="about-editorial__letter">
        {GRATITUDE_MESSAGE.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <p className="about-editorial__signature">— {GRATITUDE_MESSAGE.attribution}</p>
      </div>
      <ol className="about-editorial__credits">
        {GRATITUDE_ENTRIES.map((entry, index) => (
          <li key={entry.name}>
            <span className="about-editorial__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            {entry.name === 'Visesh Akbari' ? (
              <div className="about-editorial__credit-with-photo">
                <img src={viseshPortrait} alt="Portrait of Visesh Akbari" width="1122" height="1402" loading="lazy" />
                <div>
                  <strong>{entry.name}</strong>
                  {entry.role && <small>{entry.role}</small>}
                  <div className="about-editorial__links">
                    <a href="https://github.com/laluboom" target="_blank" rel="noopener noreferrer">GitHub</a>
                    <a href="https://www.linkedin.com/in/viseshakbari/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <strong>{entry.name}</strong>
                {entry.role && <small>{entry.role}</small>}
              </div>
            )}
          </li>
        ))}
      </ol>
      <div className="about-editorial__closing">
        {GRATITUDE_CLOSING_LINES.map((line) => <p key={line}>{line}</p>)}
      </div>
    </section>

    <footer className="about-editorial__footer">
      <p>{GRATITUDE_DISCLOSURE}</p>
      <p>LOK MANCH-2047 is a concept under development. This demo does not represent an operating government platform.</p>
      <Link to="/welcome">Explore the demo <ArrowRight size={16} aria-hidden="true" /></Link>
    </footer>
  </article>
);
