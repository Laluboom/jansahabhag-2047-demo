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

export const AboutPage: React.FC = () => (
  <div className="mx-auto max-w-5xl space-y-12 pb-12 sm:space-y-16">
    <header className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-white sm:px-10 sm:py-14">
      <div aria-hidden="true" className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-civic-teal-500/10 blur-3xl" />
      <div className="relative max-w-3xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-civic-saffron-400">About JanSahabhag 2047</p>
        <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          Connecting education with citizenship.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          JanSahabhag 2047 explores how young people can learn about society and take part in it responsibly.
        </p>
        <p className="mt-6 inline-flex rounded-full border border-civic-teal-500/40 bg-civic-teal-950/60 px-3 py-1.5 text-xs font-medium text-civic-teal-200">
          Competition demo · Single-browser simulation
        </p>
      </div>
    </header>

    <section aria-labelledby="idea-heading" className="grid gap-6 border-b border-slate-200 pb-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:gap-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-civic-teal-700">The idea</p>
        <h2 id="idea-heading" className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">LOK MANCH-2047</h2>
      </div>
      <div className="space-y-4 text-sm leading-7 text-slate-700 sm:text-base">
        <p>
          LOK MANCH-2047 is a civic participation concept that connects learning, observation, dialogue and practical contribution.
        </p>
        <p>
          It envisions pathways between educational institutions, young citizens, democratic institutions and public representatives. The concept is under development; this demo does not represent an operating government platform or established institutional partnership.
        </p>
      </div>
    </section>

    <section aria-labelledby="people-heading" className="space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-civic-teal-700">People behind the work</p>
        <h2 id="people-heading" className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">The team</h2>
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="flex items-center justify-center bg-slate-100 p-4 sm:p-6 md:col-span-5 md:p-6 lg:p-8">
            <div className="aspect-square w-full max-w-sm">
              <img
                src={nazimPortrait}
                alt="Portrait of Nazim M. Sandh"
                className="h-full w-full rounded-xl object-contain"
                width="1254"
                height="1254"
              />
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-4 p-6 sm:p-7 md:col-span-7 md:p-8 lg:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-indigo-700">The Founder</p>
              <h3 className="font-heading text-2xl font-bold text-slate-900">Nazim M. Sandh</h3>
              <p className="mt-1 text-sm font-medium text-slate-600">Founder and Initiator | Independent Learner</p>
            </div>
            <details>
              <summary className="w-fit cursor-pointer rounded-md px-1 py-1 text-sm font-semibold text-civic-indigo-700 underline underline-offset-4 hover:text-civic-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 focus-visible:ring-offset-2">
                See more about Nazim
              </summary>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                <p>
                  Based in the Gir region of Gujarat, Nazim M. Sandh has an academic background in microbiology and a broader interest in education, governance, youth development, science and social responsibility.
                </p>
                <p>
                  His experiences span research-based awareness work with students, sustainable cultivation initiatives, community fitness, cultural engagement and youth development programmes. Across these different fields, a recurring interest has shaped his work: understanding how knowledge can inform decisions, influence behaviour and contribute to collective well-being.
                </p>
                <p>
                  His engagement with civic participation developed through LOK MANCH-2047, which he presented in the context of the Viksit Bharat Young Leaders Dialogue 2026. Ideas from the presentation were incorporated into the master presentation placed before the Hon’ble Prime Minister of India. This experience further informed his interest in the role young citizens can play in democratic processes and India’s development.
                </p>
                <p>
                  JanSahabhag 2047 reflects an ongoing effort to examine these questions and explore practical ways of connecting young people with civic life.
                </p>
              </div>
            </details>
            <div className="pt-2 text-sm font-semibold">
              <a
                href="mailto:nazimsandhbehappy@gmail.com"
                className="break-all text-civic-indigo-700 underline underline-offset-4 hover:text-civic-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500"
              >
                nazimsandhbehappy@gmail.com
              </a>
            </div>
          </div>
        </div>
      </article>

      <section aria-labelledby="gratitude-heading" className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-civic-teal-700">Recognition &amp; Credits</p>
          <h2 id="gratitude-heading" className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">With gratitude</h2>
        </div>

        <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
          {GRATITUDE_MESSAGE.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <p className="pt-2 font-semibold text-slate-900">— {GRATITUDE_MESSAGE.attribution}</p>
        </div>

        <div className="border-t border-slate-200 pt-8">
          <ul className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GRATITUDE_ENTRIES.map((entry) => (
              <li
                key={entry.name}
                className={`rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-colors ${entry.name === 'Visesh Akbari' ? 'grid grid-cols-[3rem_minmax(0,1fr)] content-start gap-x-3' : 'flex flex-col justify-start'}`}
              >
                {entry.name === 'Visesh Akbari' && (
                  <img
                    src={viseshPortrait}
                    alt="Portrait of Visesh Akbari"
                    className="row-span-3 h-16 w-12 rounded-md bg-slate-100 object-contain"
                    width="1122"
                    height="1402"
                    loading="lazy"
                  />
                )}
                <span className={`font-bold text-slate-900 ${entry.name === 'Visesh Akbari' ? 'col-start-2' : ''}`}>{entry.name}</span>
                {entry.role && (
                  <span className={`mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm ${entry.name === 'Visesh Akbari' ? 'col-start-2' : ''}`}>
                    {entry.role}
                  </span>
                )}
                {entry.name === 'Visesh Akbari' && (
                  <div className="col-start-2 mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold sm:text-sm">
                    <a href="https://github.com/laluboom" target="_blank" rel="noopener noreferrer" className="text-civic-indigo-700 underline underline-offset-4 hover:text-civic-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500">GitHub</a>
                    <a href="https://www.linkedin.com/in/viseshakbari/" target="_blank" rel="noopener noreferrer" className="text-civic-indigo-700 underline underline-offset-4 hover:text-civic-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500">LinkedIn</a>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-1.5 text-sm italic text-slate-600">
            {GRATITUDE_CLOSING_LINES.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>

          <p className="mt-8 border-t border-slate-100 pt-4 text-xs text-slate-500">
            {GRATITUDE_DISCLOSURE}
          </p>
        </div>
      </section>

    </section>

    <section aria-labelledby="approach-heading" className="rounded-2xl border border-slate-200 bg-white px-6 py-8 sm:px-10 sm:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-civic-teal-700">Our approach</p>
      <h2 id="approach-heading" className="mt-2 font-heading text-2xl font-bold text-slate-900">Learn. Listen. Contribute.</h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
        We value careful observation, informed dialogue, responsibility alongside rights, and participation with purpose. As India approaches 2047, the initiative explores how education can nurture informed and participating citizens.
      </p>
      <Link
        to="/welcome"
        className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-civic-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-civic-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 focus-visible:ring-offset-2"
      >
        Explore the demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  </div>
);
