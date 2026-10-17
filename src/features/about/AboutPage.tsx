import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import nazimPortrait from '../../assets/about/nazim-sandh.jpeg';
import viseshPortrait from '../../assets/about/visesh-akbari.jpg';

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

    <section aria-labelledby="people-heading" className="space-y-7">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-civic-teal-700">People behind the work</p>
        <h2 id="people-heading" className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">The founder and the technical builder</h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="aspect-square bg-slate-100 p-3 sm:p-4">
            <img
              src={nazimPortrait}
              alt="Portrait of Nazim M. Sandh"
              className="h-full w-full rounded-xl object-contain"
              width="1254"
              height="1254"
            />
          </div>
          <div className="space-y-2 p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-indigo-700">Founder and Initiator</p>
            <h3 className="font-heading text-2xl font-bold text-slate-900">Nazim M. Sandh</h3>
            <p className="text-sm leading-6 text-slate-700">
              Nazim founded JanSahabhag 2047 and initiated its civic participation concept.
            </p>
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="aspect-square bg-slate-100 p-3 sm:p-4">
            <img
              src={viseshPortrait}
              alt="Portrait of Visesh Akbari"
              className="h-full w-full rounded-xl object-contain"
              width="1122"
              height="1402"
            />
          </div>
          <div className="space-y-2 p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-civic-teal-700">Developer</p>
            <h3 className="font-heading text-2xl font-bold text-slate-900">Visesh Akbari</h3>
            <p className="text-sm leading-6 text-slate-700">
              Visesh independently built the website and technical system for this demo.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-sm font-semibold">
              <a href="https://github.com/laluboom" target="_blank" rel="noopener noreferrer" className="text-civic-indigo-700 underline underline-offset-4 hover:text-civic-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500">
                GitHub
              </a>
              <a href="https://www.linkedin.com/in/viseshakbari/" target="_blank" rel="noopener noreferrer" className="text-civic-indigo-700 underline underline-offset-4 hover:text-civic-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500">
                LinkedIn
              </a>
            </div>
          </div>
        </article>
      </div>
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
