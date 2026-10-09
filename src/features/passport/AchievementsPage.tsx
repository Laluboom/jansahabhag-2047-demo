import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { PassportView, Reflection } from '../../types';
import { Card, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Award, Sparkles, CheckCircle2, ShieldCheck, BookOpen, Vote, FileCheck2 } from 'lucide-react';

export const AchievementsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
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
          demoRepository.getReflections(currentUser.id),
        ]);
        setPassport(p);
        setReflections(rList);
      } catch (err) {
        console.error('Failed to load achievements data', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const hasObservation = (passport?.creditsByDimension.Observation || 0) >= 5;
  const hasDeliberation = (passport?.creditsByDimension.Deliberation || 0) >= 10;
  const hasReflection = reflections.length > 0 || (passport?.creditsByDimension.Reflection || 0) >= 5;
  const hasLearning = (passport?.creditsByDimension.Learning || 0) >= 15;
  const hasCivicAction = (passport?.creditsByDimension['Civic Action'] || 0) >= 10;

  const badges = [
    {
      id: 'b1',
      title: 'Civic Field Auditor',
      desc: 'Completed verified traffic & pedestrian field count in school zone (+5 Observation).',
      earned: hasObservation,
      category: 'Observation',
      icon: FileCheck2,
    },
    {
      id: 'b2',
      title: 'Deliberation Delegate',
      desc: 'Admitted as delegate and contributed to Youth Deliberative Assembly (+10 Deliberation).',
      earned: hasDeliberation,
      category: 'Deliberation',
      icon: Vote,
    },
    {
      id: 'b3',
      title: 'Ethical & Reflective Thinker',
      desc: 'Recorded universal human values reflections in Civic Passport (+5 Reflection).',
      earned: hasReflection,
      category: 'Reflection',
      icon: Sparkles,
    },
    {
      id: 'b4',
      title: 'Universal Values Explorer',
      desc: 'Completed civic foundations and ethics learning modules (+15 Learning).',
      earned: hasLearning,
      category: 'Learning',
      icon: BookOpen,
    },
    {
      id: 'b5',
      title: 'Action Project Champion',
      desc: 'Co-authored a municipal resolution submitted to Nagar Nigam (+10 Civic Action).',
      earned: hasCivicAction,
      category: 'Civic Action',
      icon: ShieldCheck,
    },
    {
      id: 'b6',
      title: 'Master Civic Practitioner',
      desc: 'Accumulated 100+ verified Civic Credits across all 6 civic dimensions.',
      earned: (passport?.totalCredits || 0) >= 100,
      category: 'Mastery',
      icon: Award,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/passport" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Passport</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <span>Civic Badges & Institutional Honors</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified digital credentials issued for substantive civic contributions.
          </p>
        </div>

        <div className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold shrink-0">
          {badges.filter((b) => b.earned).length} / {badges.length} Badges Unlocked
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {badges.map((b) => {
          const IconComponent = b.icon;

          return (
            <Card
              key={b.id}
              className={`p-5 space-y-3 border-slate-200 transition-all ${
                b.earned ? 'bg-gradient-to-br from-white to-amber-50/40 shadow-xs' : 'opacity-60 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    b.earned ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {b.category}
                  </span>
                </div>

                {b.earned ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Unlocked
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">In Progress</span>
                )}
              </div>

              <CardTitle className="text-base font-bold text-slate-900 font-heading">
                {b.title}
              </CardTitle>

              <p className="text-xs text-slate-600 leading-relaxed">{b.desc}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

