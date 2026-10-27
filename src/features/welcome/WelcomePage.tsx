import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Disclosure } from '../../components/ui/Disclosure';
import { DEMO_COLLEGE_FULL_NAME } from '../../data/seed/institutions';
import { seedEvents, seedSessions } from '../../data/seed/events';
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
  MessageSquare,
  Landmark,
  FolderGit2,
  FileCheck2,
  Layers,
  Users2,
  Calendar,
  Clock,
  MapPin,
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

interface IconTile {
  id: string;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  description: string;
  colorClasses: {
    bg: string;
    text: string;
    borderHover: string;
  };
}

const ICON_TILES: IconTile[] = [
  {
    id: 'learn',
    label: 'Learn',
    to: '/learn',
    icon: BookOpen,
    description: 'Civic Academy',
    colorClasses: { bg: 'bg-indigo-50', text: 'text-indigo-700', borderHover: 'hover:border-indigo-400' },
  },
  {
    id: 'debate',
    label: 'Debate',
    to: '/debate-room',
    icon: MessageSquare,
    description: 'Deliberation Room',
    colorClasses: { bg: 'bg-cyan-50', text: 'text-cyan-700', borderHover: 'hover:border-cyan-400' },
  },
  {
    id: 'assembly',
    label: 'Assembly',
    to: '/assemblies',
    icon: Vote,
    description: 'Youth Assembly',
    colorClasses: { bg: 'bg-amber-50', text: 'text-amber-800', borderHover: 'hover:border-amber-400' },
  },
  {
    id: 'parliament',
    label: 'Parliament',
    to: '/parliament',
    icon: Landmark,
    description: 'Youth Parliament',
    colorClasses: { bg: 'bg-purple-50', text: 'text-purple-700', borderHover: 'hover:border-purple-400' },
  },
  {
    id: 'projects',
    label: 'Projects',
    to: '/projects',
    icon: FolderGit2,
    description: 'Labs & Civic Action',
    colorClasses: { bg: 'bg-rose-50', text: 'text-rose-700', borderHover: 'hover:border-rose-400' },
  },
  {
    id: 'uhv',
    label: 'UHV/Jeevan Vidya',
    to: '/uhv',
    icon: HeartHandshake,
    description: 'Independent Stream',
    colorClasses: { bg: 'bg-teal-50', text: 'text-teal-700', borderHover: 'hover:border-teal-400' },
  },
  {
    id: 'assignments',
    label: 'Assignments',
    to: '/assignments',
    icon: FileCheck2,
    description: 'Field Evidence',
    colorClasses: { bg: 'bg-emerald-50', text: 'text-emerald-700', borderHover: 'hover:border-emerald-400' },
  },
  {
    id: 'workspace',
    label: 'Workspace',
    to: '/workspace',
    icon: Layers,
    description: 'Team Drafting',
    colorClasses: { bg: 'bg-sky-50', text: 'text-sky-700', borderHover: 'hover:border-sky-400' },
  },
  {
    id: 'community',
    label: 'Community',
    to: '/community',
    icon: Users2,
    description: 'Peer Circles',
    colorClasses: { bg: 'bg-violet-50', text: 'text-violet-700', borderHover: 'hover:border-violet-400' },
  },
  {
    id: 'passport',
    label: 'Civic Passport',
    to: '/passport',
    icon: Award,
    description: 'Your Record',
    colorClasses: { bg: 'bg-orange-50', text: 'text-orange-700', borderHover: 'hover:border-orange-400' },
  },
];

interface CreditPointStep {
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  iconBg: string;
  iconColor: string;
}

const CREDIT_POINT_STEPS: CreditPointStep[] = [
  {
    title: 'Take part',
    detail: 'Join an assembly, submit field evidence, or contribute to a debate.',
    icon: Users,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-700',
  },
  {
    title: 'Earn civic credit points',
    detail: 'Each verified contribution adds points to your record.',
    icon: Sparkles,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-800',
  },
  {
    title: 'Build your Civic Passport',
    detail: 'A portfolio of what you did, not a score of your worth.',
    icon: Award,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
  },
];

const parseEventStartUtc = (dateStr: string, timeStr?: string): number => {
  const [year, month, day] = dateStr.split('-').map(Number);
  let hours = 0;
  let minutes = 0;
  if (timeStr) {
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const ampm = match[3] ? match[3].toUpperCase() : null;
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
  }
  return Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
};

// eslint-disable-next-line react-refresh/only-export-components
export const getEarliestFutureRajkotEvent = (now: Date = new Date()) => {
  const nowUtc = now.getTime();
  const rajkotEvents = seedEvents.filter(
    (e) => (e.location.includes('Rajkot') || e.title.includes('Rajkot')) && e.status === 'upcoming'
  );
  const future = rajkotEvents
    .filter((e) => parseEventStartUtc(e.date, e.startTime) > nowUtc)
    .sort((a, b) => {
      const diff = parseEventStartUtc(a.date, a.startTime) - parseEventStartUtc(b.date, b.startTime);
      if (diff !== 0) return diff;
      return a.id.localeCompare(b.id);
    });

  if (future.length > 0) {
    return future[0];
  }
  return undefined;
};

const formatEventDate = (dateStr: string) => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const WelcomePage: React.FC = () => {
  const { switchPersona, currentUser } = useAuthStore();
  const navigate = useNavigate();

  const handleEnterPlatform = async () => {
    if (!currentUser) {
      await switchPersona('VSC-S-001');
    }
    navigate('/dashboard');
  };

  const upcomingEvent = getEarliestFutureRajkotEvent();
  const matchingSession = upcomingEvent ? seedSessions.find((s) => s.eventId === upcomingEvent.id) : undefined;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-civic-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-civic-saffron-500/20 border border-civic-saffron-400/40 text-civic-saffron-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-civic-saffron-400" />
            Fictional single-browser simulation
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
            JanSahabhag <span className="text-civic-saffron-400">2047</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-civic-saffron-200/90 tracking-wide">
            {DEMO_COLLEGE_FULL_NAME}
          </p>
          <p className="text-lg sm:text-xl font-medium text-slate-200 tracking-wide">
            Learn. Deliberate. Lead.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Button
              size="lg"
              variant="saffron"
              onClick={handleEnterPlatform}
              data-testid="enter-platform-button"
            >
              <span>Enter the platform</span>
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

      {/* Five-step Civic Loop Strip (shown once beneath the hero) */}
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

      {/* Linked icon tiles covering every area of the platform */}
      <section aria-label="Core Platform Modules" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Core Platform Modules
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Direct navigation
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {ICON_TILES.map((tile) => (
            <Link
              key={tile.id}
              to={tile.to}
              data-testid={`welcome-tile-${tile.id}`}
              className={`group flex flex-col items-center text-center p-3.5 rounded-xl border border-slate-200 bg-white ${tile.colorClasses.borderHover} hover:shadow-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500`}
            >
              <div
                className={`w-10 h-10 rounded-xl ${tile.colorClasses.bg} ${tile.colorClasses.text} flex items-center justify-center mb-2 transition-transform group-hover:scale-105`}
              >
                <tile.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold text-slate-900 group-hover:text-civic-indigo-700 leading-snug">
                {tile.label}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                {tile.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How participation is recorded */}
      <section
        aria-label="How participation is recorded"
        data-testid="welcome-credit-points"
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h2 className="text-sm font-bold font-heading text-slate-900">
            How participation is recorded
          </h2>
          <Link
            to="/passport"
            data-testid="welcome-credit-points-passport-link"
            className="inline-flex items-center gap-1 text-xs font-semibold text-civic-indigo-700 hover:text-civic-indigo-900 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 rounded"
          >
            <span>See the Civic Passport</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {CREDIT_POINT_STEPS.map((step) => (
            <li
              key={step.title}
              className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60"
            >
              <span className={`w-8 h-8 rounded-lg ${step.iconBg} ${step.iconColor} flex items-center justify-center shrink-0`}>
                <step.icon className="w-4 h-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-900 leading-snug">
                  {step.title}
                </span>
                <span className="block text-xs text-slate-600 leading-snug mt-0.5">
                  {step.detail}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Real Upcoming Session Card derived from earliest future fictional Rajkot event */}
      {upcomingEvent && (
        <section aria-label="Upcoming Session" data-testid="welcome-upcoming-session-card">
          <Card className="border-slate-200 bg-white overflow-hidden p-0 shadow-xs">
            <div className="bg-gradient-to-r from-civic-indigo-900 to-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-civic-saffron-500/20 text-civic-saffron-300 border border-civic-saffron-400/30">
                  Upcoming Event
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Rajkot Civic Demo
                </span>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-heading text-slate-900">
                  {upcomingEvent.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {upcomingEvent.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-civic-indigo-600 shrink-0" aria-hidden="true" />
                  <span>{formatEventDate(upcomingEvent.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-civic-indigo-600 shrink-0" aria-hidden="true" />
                  <span>{upcomingEvent.startTime} – {upcomingEvent.endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-civic-indigo-600 shrink-0" aria-hidden="true" />
                  <span className="truncate">{upcomingEvent.location}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  {matchingSession?.assemblyId ? (
                    <>
                      <Link to={`/assemblies/${matchingSession.assemblyId}/session`}>
                        <Button size="sm" variant="primary">
                          <span>Open Assembly Session</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                      <Link to={`/events/${upcomingEvent.id}`}>
                        <Button size="sm" variant="outline">
                          <span>Event Details</span>
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link to={`/events/${upcomingEvent.id}`}>
                      <Button size="sm" variant="primary">
                        <span>View Event Details</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
                <span className="text-xs text-slate-500 italic">
                  Capacity: {upcomingEvent.capacity} participants • 33% Platform Rule applies
                </span>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* 33% Platform Rule Banner */}
      <div
        data-testid="welcome-reservation-policy-banner"
        className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-950 flex flex-col gap-3 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold text-xs bg-amber-200 text-amber-900 shrink-0">
              33% Platform Rule
            </span>
            <p className="text-slate-800 leading-snug">
              At least one-third of limited seats and named roles are reserved for women.
            </p>
          </div>
          <Link
            to="/help"
            className="inline-flex items-center gap-1 font-semibold text-civic-indigo-700 hover:text-civic-indigo-900 underline shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 rounded"
          >
            <span>View Rules</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
        <Disclosure
          summary="What this rule covers"
          testId="welcome-reservation-policy-details"
          className="border-amber-200 bg-white/70"
        >
          <p className="text-slate-800 leading-snug">
            <strong>Platform Rule:</strong> At least one-third of limited seats and named roles, rounded up separately for each allocation, are reserved for women. Open participation slots are unreserved. This simulation rule is a platform policy rather than statutory law. Documented exceptions require recorded administrative approval.
          </p>
        </Disclosure>
      </div>

      {/* Distinct UHV Stream Notice */}
      <div
        data-testid="uhv-distinct-stream-notice"
        className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 sm:p-4 text-xs sm:text-sm text-teal-950 flex flex-col gap-3 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <HeartHandshake className="w-4 h-4 text-teal-700 shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
            <p className="text-slate-800 leading-snug">
              <strong>Universal Human Values (UHV / Jeevan Vidya)</strong>
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
        <Disclosure
          summary="How this stream fits in"
          testId="uhv-distinct-stream-details"
          className="border-teal-200 bg-white/70"
        >
          <p className="text-slate-800 leading-snug">
            An independent exploratory study track kept distinct from the 5-step civic deliberation loop.
          </p>
        </Disclosure>
      </div>

      {/* Reviewer Quick Guide */}
      <Card className="bg-slate-50 border-slate-200 p-5">
        <h3 className="text-sm font-bold font-heading text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-civic-indigo-600" />
          Reviewer Quick Guide
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-civic-teal-600 shrink-0 mt-0.5" />
            <span>Switch to <strong>Teacher Shri Mayur Parmar</strong> to review Ankita's submitted assignments.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-civic-teal-600 shrink-0 mt-0.5" />
            <span>Switch to <strong>Moderator Yashvi Dalsaniya</strong> or <strong>Dilip Sandhar</strong> to manage flagged content under scoped grants.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-civic-teal-600 shrink-0 mt-0.5" />
            <span>Switch to <strong>Principal Shri Dr. K. D. Ladwa</strong> or <strong>Special Guest Shri Param Pujya Tyagvallabh Swamiji</strong> (view-only).</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-civic-teal-600 shrink-0 mt-0.5" />
            <span>Use <strong>Reset Demo Data</strong> from the Profile or Top Bar to restore initial state.</span>
          </li>
        </ul>
      </Card>

      {/* Welcome Page Footer */}
      <footer
        role="contentinfo"
        aria-label="Welcome page footer"
        className="border-t border-slate-200 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
          <span className="font-semibold text-slate-700">JanSahabhag 2047</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="text-slate-500">Demo institution, not an official partnership</span>
        </div>
        <nav aria-label="Footer links" className="flex items-center gap-6">
          <Link
            to="/help"
            className="font-medium text-slate-600 hover:text-civic-indigo-600 transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 rounded"
          >
            Rules
          </Link>
          <Link
            to="/about"
            className="font-medium text-slate-600 hover:text-civic-indigo-600 transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 rounded"
          >
            About Us
          </Link>
          <a
            href="mailto:nazimsandhbehappy@gmail.com"
            className="font-medium text-slate-600 hover:text-civic-indigo-600 transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 rounded"
          >
            Contact
          </a>
        </nav>
      </footer>
    </div>
  );
};
