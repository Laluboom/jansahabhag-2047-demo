import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { PassportView, Reflection, PassportEntry } from '../../types';
import { CreditDimension } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { VerificationBadge } from './VerificationBadge';
import { CreditAppealModal } from './CreditAppealModal';
import {
  Award,
  BookOpen,
  Vote,
  FileCheck2,
  Sparkles,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Info,
  Clock,
  History,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const ORDERED_DIMENSIONS: CreditDimension[] = [
  'Learning',
  'Observation',
  'Deliberation',
  'Contribution',
  'Collaboration',
  'Civic Action',
  'Reflection',
];

export const PassportPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const [passport, setPassport] = useState<PassportView | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appealTarget, setAppealTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const [p, rList] = await Promise.all([
          demoRepository.getPassport(currentUser.id),
          demoRepository.getCivicReflections(currentUser.id),
        ]);
        setPassport(p);
        setReflections(rList.filter((r) => r.contextType !== 'session'));
      } catch (err) {
        console.error('Failed to load passport', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser, refreshKey]);

  if (isLoading || !passport) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const pendingEntries = passport.entries.filter(
    (e) =>
      e.reviewState === 'pending' ||
      e.reviewState === 'revision_requested' ||
      (!e.isVerified && e.verificationState !== 'sample_unverified')
  );

  const verifiedEntries = passport.entries.filter(
    (e) =>
      e.isVerified ||
      e.verificationState === 'sample_unverified' ||
      (e.reviewState !== 'pending' && e.reviewState !== 'revision_requested')
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Passport Credential Header */}
      <Card className="border-civic-indigo-200 bg-gradient-to-br from-slate-900 via-civic-indigo-950 to-slate-900 text-white p-6 sm:p-8 space-y-6 shadow-xl overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar src={passport.user.avatar} alt={passport.user.name} size="xl" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-civic-saffron-300 bg-civic-saffron-950/80 px-2.5 py-0.5 rounded-full border border-civic-saffron-700">
                  Civic Passport Portfolio (Demo Simulation)
                </span>
                <span className="text-xs text-slate-400">ID: {passport.user.id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white mt-1">
                {passport.user.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {passport.user.institutionName} &bull; {passport.user.location} &bull;{' '}
                <span className="italic text-slate-400">Portfolio of evidence, not a score of moral worth</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-white/10 p-3.5 rounded-xl border border-white/10 shrink-0">
            <span className="text-xs font-semibold text-slate-300 uppercase block">
              Total Verified Credits
            </span>
            <span className="text-3xl font-extrabold font-heading text-civic-saffron-400">
              {passport.totalCredits}
            </span>
            {passport.pendingCredits !== undefined && passport.pendingCredits > 0 ? (
              <span className="text-[11px] text-amber-300 block mt-0.5 font-medium">
                +{passport.pendingCredits} pending mentor review (uncounted)
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 block mt-0.5">
                0 pending items
              </span>
            )}
          </div>
        </div>

        {/* Quick Links inside Passport */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800 text-xs">
          <Link to="/passport/credits">
            <Button size="sm" variant="outline" className="bg-slate-800/80 text-white border-slate-700 hover:bg-slate-700">
              <Award className="w-3.5 h-3.5 mr-1 text-civic-saffron-400" />
              <span>Credit Ledger</span>
            </Button>
          </Link>
          <Link to="/passport/evidence">
            <Button size="sm" variant="outline" className="bg-slate-800/80 text-white border-slate-700 hover:bg-slate-700">
              <FileCheck2 className="w-3.5 h-3.5 mr-1 text-civic-teal-400" />
              <span>Evidence Pool ({passport.verifiedEvidence.length})</span>
            </Button>
          </Link>
          <Link to="/passport/achievements">
            <Button size="sm" variant="outline" className="bg-slate-800/80 text-white border-slate-700 hover:bg-slate-700">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
              <span>Badges & Honors</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Transparent Model & Formula Explanation Callout */}
      <Card className="p-4 bg-slate-50 border-slate-200 text-xs text-slate-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Info className="w-4 h-4 text-civic-indigo-600 shrink-0" />
          <span>Evidence-Based Civic Portfolio & Transparent Demo Rules</span>
        </div>
        <p className="leading-relaxed">
          The Civic Passport is an evidence-based portfolio tracing coursework, field observations, deliberative assembly participation, substantive contributions, retained dissent, and workspace collaboration. It is <strong>not</strong> a singular rating of civic or moral worth.
        </p>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-800 block">Applied Demo Formula & Rules:</span>
          <p>
            &bull; Fixed rule awards: Newly created participants start with <strong>10 Credits</strong> (starting balance transaction). Subsequent eligible activities award <strong>1 or 2 Credits</strong>: <strong>+1 Learning</strong> (module completion), <strong>+1 Observation</strong> (verified field evidence), <strong>+2 Deliberation</strong> (assembly role admission), <strong>+1 Deliberation</strong> (substantive contribution), <strong>+1 Collaboration</strong> (workspace action), <strong>+2 Civic Action</strong> (field project milestone), <strong>+1 Reflection</strong> (civic reflection), <strong>+2 Contribution</strong> (assignment submission, pending until facilitator review). No-credit activities (private UHV reflections, retained dissent, private Debate journals) award <strong>0 Credits</strong>.
          </p>
          <p className="text-slate-500 italic">
            Notice: Multiplicative weighting formulas from the conceptual PRD are exploratory research specifications; this local demo operates solely on transparent, fixed amounts without automated algorithmic scoring.
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 space-y-1 text-[11px] text-amber-950">
          <span className="font-semibold block">Simulation & Language Notice:</span>
          <p>
            This application is a fictional single-browser simulation. Walkthroughs and review workflows demonstrate prototype capabilities locally; English demo with Hindi pending review. No production verification, external credentialing, or real-world municipal authority is claimed.
          </p>
        </div>
      </Card>

      {/* 7-Dimension Civic Credit Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold font-heading text-slate-900">
            Civic Credit Dimensions (7 PRD Dimensions)
          </h2>
          <span className="text-xs text-slate-500">Verified totals only</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {ORDERED_DIMENSIONS.map((dim) => {
            const amount = passport.creditsByDimension[dim] || 0;
            return (
              <Card key={dim} className="p-3.5 border-slate-200 text-center bg-white shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block truncate" title={dim}>
                  {dim}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 mt-1 block">
                  {amount}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Verified</span>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pending / Unverified Activity Section */}
      {pendingEntries.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-amber-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pending Review & Self-Reported Items ({pendingEntries.length})</span>
            </h2>
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Uncounted in verified balance
            </span>
          </div>

          <div className="space-y-3">
            {pendingEntries.map((entry) => (
              <Card key={entry.id} className="border-amber-200 bg-amber-50/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-300">
                    <Clock className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                        {entry.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(entry.date)}</span>
                      <VerificationBadge
                        verificationState={entry.verificationState}
                        reviewState={entry.reviewState}
                        isVerified={entry.isVerified}
                        verifier={entry.verifier}
                        organisation={entry.organisation}
                        showDetails={true}
                      />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      {entry.title}
                    </h3>
                    <p className="text-xs text-slate-600">{entry.subtitle}</p>
                    {entry.calculationExplanation && (
                      <p className="text-[11px] text-slate-500 italic">
                        Rule: {entry.calculationExplanation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200">
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 block">
                    +{entry.creditsAwarded} Pending Credits
                  </span>
                  <div className="flex items-center gap-2">
                    {entry.sourceRoute && (
                      <Link
                        to={entry.sourceRoute}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-civic-indigo-600 hover:text-civic-indigo-800 bg-white px-2 py-1 rounded border border-slate-200 shadow-2xs"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                    <button
                      onClick={() => setAppealTarget({ id: entry.id, title: entry.title })}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                    >
                      Appeal Review
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Verified Activity Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-heading text-slate-900">
            Verified Civic Activity Records ({verifiedEntries.length})
          </h2>
          <span className="text-xs text-slate-500">Source-linked & review-aware</span>
        </div>

        <div className="space-y-3">
          {verifiedEntries.map((entry) => {
            const hasSource = Boolean(entry.sourceRoute);
            return (
              <Card key={entry.id} className="border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-2xs hover:border-slate-300 transition-colors bg-white">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-civic-indigo-50 text-civic-indigo-700 flex items-center justify-center shrink-0 mt-0.5 border border-civic-indigo-200">
                    {entry.category === 'learning' && <BookOpen className="w-4 h-4" />}
                    {entry.category === 'contribution' && <FileCheck2 className="w-4 h-4" />}
                    {entry.category === 'deliberation' && <Vote className="w-4 h-4" />}
                    {entry.category === 'reflection' && <Sparkles className="w-4 h-4" />}
                    {entry.category === 'civic_action' && <ShieldCheck className="w-4 h-4" />}
                    {entry.category === 'achievement' && <Award className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-200">
                        {entry.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(entry.date)}</span>
                      <VerificationBadge
                        verificationState={entry.verificationState}
                        reviewState={entry.reviewState}
                        isVerified={entry.isVerified}
                        verifier={entry.verifier}
                        organisation={entry.organisation}
                        showDetails={true}
                      />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">
                      {entry.title}
                    </h3>
                    <p className="text-xs text-slate-600">{entry.subtitle}</p>

                    {entry.calculationExplanation && (
                      <p className="text-[11px] text-slate-500 italic">
                        Rule: {entry.calculationExplanation}
                      </p>
                    )}

                    {/* Revision history summary if present */}
                    {entry.revisionHistory && entry.revisionHistory.length > 0 && (
                      <div className="pt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                        <History className="w-3 h-3" />
                        <span>Audited: {entry.revisionHistory[entry.revisionHistory.length - 1].action} by {entry.revisionHistory[entry.revisionHistory.length - 1].actorName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-xs font-bold text-civic-saffron-700 bg-civic-saffron-50 px-2.5 py-1 rounded-md border border-civic-saffron-200 block">
                    {entry.creditsAwarded > 0 ? `+${entry.creditsAwarded} Credits` : '0 Credits (Unjudged)'}
                  </span>

                  <div className="flex items-center gap-2">
                    {hasSource && (
                      <Link
                        to={entry.sourceRoute!}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-civic-indigo-600 hover:text-civic-indigo-800 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs transition-colors"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                    <button
                      onClick={() => setAppealTarget({ id: entry.id, title: entry.title })}
                      className="text-[10px] text-slate-400 hover:text-slate-700 underline"
                      title="Request correction or human mentor review"
                    >
                      Appeal
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Reflections Section */}
      {reflections.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-slate-900">
              Civic & Ethical Reflections
            </h2>
            <span className="text-xs text-slate-500">Autonomous inquiries &bull; No civic credits</span>
          </div>

          <div className="space-y-3">
            {reflections.map((refl) => (
              <Card key={refl.id} className="border-slate-200 p-5 space-y-2 bg-white shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Context: {refl.contextType.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(refl.createdAt)}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-800 font-heading">
                  "{refl.prompt}"
                </h3>
                <p className="text-xs text-slate-700 italic leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {refl.text}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {refl.valuesHighlighted.map((v, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-civic-indigo-50 text-civic-indigo-700 font-medium">
                      #{v}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Human Appeal Modal */}
      {appealTarget && currentUser && (
        <CreditAppealModal
          userId={currentUser.id}
          targetType="passport"
          targetId={appealTarget.id}
          targetTitle={appealTarget.title}
          onClose={() => setAppealTarget(null)}
          onSuccess={() => triggerRefresh()}
        />
      )}
    </div>
  );
};
