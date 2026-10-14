import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { PassportView, Reflection } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  Award,
  BookOpen,
  Vote,
  FileCheck2,
  Sparkles,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const PassportPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey } = useAppRefreshStore();
  const [passport, setPassport] = useState<PassportView | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        setReflections(rList);
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

  const dimensions = Object.entries(passport.creditsByDimension);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Passport Credential Header */}
      <Card className="border-civic-indigo-200 bg-gradient-to-br from-slate-900 via-civic-indigo-950 to-slate-900 text-white p-6 sm:p-8 space-y-6 shadow-xl overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar src={passport.user.avatar} alt={passport.user.name} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-civic-saffron-400 bg-civic-saffron-950 px-2.5 py-0.5 rounded-full border border-civic-saffron-800">
                  Verified Civic Passport
                </span>
                <span className="text-xs text-slate-400">ID: {passport.user.id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white mt-1">
                {passport.user.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {passport.user.institutionName} &bull; {passport.user.location}
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

      {/* 5-Dimension Civic Credit Breakdown */}
      <div>
        <h2 className="text-base font-bold font-heading text-slate-900 mb-3">
          Civic Credit Dimensions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {dimensions.map(([dim, amount]) => (
            <Card key={dim} className="p-4 border-slate-200 text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase block truncate">
                {dim}
              </span>
              <span className="text-2xl font-extrabold font-heading text-slate-900 mt-1 block">
                {amount}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Verified</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Verified Activity Timeline */}
      <div className="space-y-4">
        <h2 className="text-base font-bold font-heading text-slate-900">
          Verified Civic Activity Records ({passport.entries.length})
        </h2>

        <div className="space-y-3">
          {passport.entries.map((entry) => (
            <Card key={entry.id} className="border-slate-200 p-4 sm:p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-civic-indigo-50 text-civic-indigo-700 flex items-center justify-center shrink-0 mt-0.5 border border-civic-indigo-200">
                  {entry.category === 'learning' && <BookOpen className="w-4 h-4" />}
                  {entry.category === 'contribution' && <FileCheck2 className="w-4 h-4" />}
                  {entry.category === 'deliberation' && <Vote className="w-4 h-4" />}
                  {entry.category === 'reflection' && <Sparkles className="w-4 h-4" />}
                  {entry.category === 'civic_action' && <ShieldCheck className="w-4 h-4" />}
                  {entry.category === 'achievement' && <Award className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2 py-0.2 rounded">
                      {entry.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(entry.date)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 font-heading mt-1">
                    {entry.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">{entry.subtitle}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-civic-saffron-700 bg-civic-saffron-50 px-2.5 py-1 rounded-md border border-civic-saffron-200 block">
                  +{entry.creditsAwarded} Credits
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Reflections Section */}
      {reflections.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-base font-bold font-heading text-slate-900">
            Civic & Ethical Reflections
          </h2>
          <div className="space-y-3">
            {reflections.map((refl) => (
              <Card key={refl.id} className="border-slate-200 p-5 space-y-2">
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
    </div>
  );
};
