import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ThreadMotif } from '../../components/layout/ThreadMotif';
import {
  Sparkles,
  BookOpen,
  Vote,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';

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
            A frontend-first interactive demo of the National Youth Civic Engagement Platform. Walk alongside <strong>Aarav Sharma (17, Jaipur)</strong> as field evidence leads to democratic deliberation, municipal policy, and a verified Civic Passport.
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
          <Link
            to="/about"
            className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-civic-saffron-300 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-saffron-400"
          >
            About the people behind JanSahabhag <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-civic-indigo-500/10 blur-3xl" />
        <div className="absolute -right-4 top-0 w-64 h-64 rounded-full bg-civic-saffron-500/10 blur-3xl" />
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
              Complete structured lessons on field observation, pedestrian flow desire lines, and Universal Human Values (UHV).
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
