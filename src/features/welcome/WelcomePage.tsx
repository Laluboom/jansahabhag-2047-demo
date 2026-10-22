import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ThreadMotif } from '../../components/layout/ThreadMotif';
import {
  Sparkles,
  BookOpen,
  Eye,
  Vote,
  FileText,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  HeartHandshake,
} from 'lucide-react';

interface CivicLoopStep {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  subtitle: string;
  iconBg: string;
  iconColor: string;
}

const CIVIC_LOOP_STEPS: CivicLoopStep[] = [
  {
    name: 'Learn',
    to: '/learn',
    icon: BookOpen,
    subtitle: 'Civic Academy',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-700',
  },
  {
    name: 'Observe',
    to: '/assignments',
    icon: Eye,
    subtitle: 'Field Evidence',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-700',
  },
  {
    name: 'Deliberate',
    to: '/assemblies',
    icon: Vote,
    subtitle: 'Youth Assembly',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-800',
  },
  {
    name: 'Propose',
    to: '/projects',
    icon: FileText,
    subtitle: 'Labs & Projects',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-700',
  },
  {
    name: 'Reflect',
    to: '/passport',
    icon: Award,
    subtitle: 'Civic Passport',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
  },
];

export const WelcomePage: React.FC = () => {
  const { switchPersona } = useAuthStore();
  const navigate = useNavigate();

  const handleStartAaravJourney = async () => {
    await switchPersona('user_aarav');
    navigate('/dashboard');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-civic-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-civic-saffron-500/20 border border-civic-saffron-400/40 text-civic-saffron-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-civic-saffron-400" />
            Civic Participation Demo
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
            JanSahabhag <span className="text-civic-saffron-400">2047</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            An interactive single-browser simulation of the National Youth Civic Engagement Platform. Walk alongside <strong>Aarav Sharma (18, Jaipur)</strong> as field evidence leads to democratic deliberation, municipal policy, and a verified Civic Passport.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <Button size="lg" variant="saffron" onClick={handleStartAaravJourney}>
              <span>Begin Aarav's Journey</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Link to="/demo-login">
              <Button size="lg" variant="outline" className="bg-slate-800/80 text-white border-slate-700 hover:bg-slate-700">
                <Users className="w-4 h-4 mr-2" />
                <span>Explore All Personas</span>
              </Button>
            </Link>
          </div>
          <div>
            <Link
              to="/about"
              className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-civic-saffron-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-saffron-400"
            >
              About the people behind JanSahabhag <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-civic-indigo-500/10 blur-3xl" />
        <div className="absolute -right-4 top-0 w-64 h-64 rounded-full bg-civic-saffron-500/10 blur-3xl" />
      </div>

      {/* Five-step Civic Loop Strip */}
      <nav
        aria-label="Five-step civic loop"
        data-testid="welcome-civic-loop"
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Civic Method
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Five-step continuous cycle
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium" aria-hidden="true">
            Learn &rarr; Observe &rarr; Deliberate &rarr; Propose &rarr; Reflect
          </span>
        </div>

        <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {CIVIC_LOOP_STEPS.map((step, idx) => (
            <li key={step.name} className="flex flex-col">
              <Link
                to={step.to}
                data-testid={`civic-loop-step-${step.name.toLowerCase()}`}
                className="group flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-civic-indigo-400 hover:shadow-xs transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500"
              >
                <div
                  className={`w-9 h-9 rounded-lg ${step.iconBg} ${step.iconColor} flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105`}
                >
                  <step.icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Step {idx + 1}
                </span>
                <span className="text-sm font-bold text-slate-900 group-hover:text-civic-indigo-700">
                  {step.name}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {step.subtitle}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      {/* 33% Women's Reservation Policy Notice */}
      <div
        data-testid="welcome-reservation-policy-banner"
        className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold text-xs bg-amber-200 text-amber-900 shrink-0">
            33% Policy
          </span>
          <p className="text-slate-800 leading-snug">
            <strong>Policy in this fictional demo:</strong> at least 33% of applicable allocated seats and named roles, rounded up separately for each allocation, are reserved for women. Documented exceptions require recorded administrative approval.
          </p>
        </div>
        <Link
          to="/help"
          className="inline-flex items-center gap-1 font-semibold text-civic-indigo-700 hover:text-civic-indigo-900 underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 rounded"
        >
          <span>View Rulebook</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Distinct UHV Stream Notice */}
      <div
        data-testid="uhv-distinct-stream-notice"
        className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 sm:p-4 text-xs sm:text-sm text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <HeartHandshake className="w-4 h-4 text-teal-700 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <p className="text-slate-800 leading-snug">
            <strong>Universal Human Values (UHV / Jeevan Vidya):</strong> An independent exploratory study track kept distinct from the 5-step civic deliberation loop.
          </p>
        </div>
        <Link
          to="/uhv"
          className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
        >
          <span>Open UHV Stream</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Thread Motif */}
      <ThreadMotif currentStage="evidence" />

      {/* Journey Stages Grid */}
      <div>
        <h2 className="text-xl font-bold font-heading text-slate-900 mb-4">
          The 5 Pillars of the Participant Journey
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-civic-indigo-100 text-civic-indigo-700 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-heading text-slate-900">1. Civic Academy</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Complete structured lessons on field observation, pedestrian flow desire lines, and foundational civic competencies.
            </p>
          </Card>

          <Card className="border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-civic-teal-100 text-civic-teal-700 flex items-center justify-center mb-3">
              <Vote className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-heading text-slate-900">2. Youth Assembly</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Deliberate with assigned roles (Questioner, Evidence Analyst, Synthesiser) to build a consensus proposition with preserved dissent.
            </p>
          </Card>

          <Card className="border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-civic-saffron-100 text-civic-saffron-800 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-heading text-slate-900">3. Civic Passport</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Every verified observation, reflection, and assembly contribution earns transparent Civic Credits and verifiable passport credentials.
            </p>
          </Card>
        </div>
      </div>

      {/* Reviewer Guidance */}
      <Card className="bg-slate-50 border-slate-200 p-6">
        <h3 className="text-sm font-bold font-heading text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-civic-indigo-600" />
          Reviewer Quick Guide
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-civic-teal-600 shrink-0 mt-0.5" />
            <span>Switch to <strong>Teacher Kavita Rao</strong> at any time to review Aarav's submitted assignments.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-civic-teal-600 shrink-0 mt-0.5" />
            <span>Switch to <strong>Facilitator Rohan Mehta</strong> to advance Assembly stages and finalize propositions.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-civic-teal-600 shrink-0 mt-0.5" />
            <span>Switch to <strong>Admin Dev Patel</strong> or <strong>Ananya Verma</strong> to review institutional metrics.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-civic-teal-600 shrink-0 mt-0.5" />
            <span>Use <strong>Reset Demo Data</strong> from the Profile or Top Bar whenever you wish to restart.</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};
