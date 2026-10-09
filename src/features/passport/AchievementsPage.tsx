import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Award, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export const AchievementsPage: React.FC = () => {
  const { currentUser } = useAuthStore();

  const badges = [
    {
      id: 'b1',
      title: 'Civic Field Auditor',
      desc: 'Completed verified traffic & pedestrian field count in school zone.',
      earned: true,
      category: 'Observation',
    },
    {
      id: 'b2',
      title: 'Deliberation Delegate',
      desc: 'Appointed and contributed substantive inquiry to Youth Assembly.',
      earned: true,
      category: 'Deliberation',
    },
    {
      id: 'b3',
      title: 'Universal Values Explorer',
      desc: 'Graduated from self-growth and empathy leadership course.',
      earned: currentUser?.role === 'participant' && currentUser?.id === 'user_meera',
      category: 'UHV',
    },
    {
      id: 'b4',
      title: 'Action Project Champion',
      desc: 'Co-authored a municipal resolution submitted to Nagar Nigam.',
      earned: currentUser?.role === 'participant' && currentUser?.id === 'user_meera',
      category: 'Civic Action',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/passport" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Passport</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          <span>Civic Badges & Institutional Honors</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verified digital credentials issued for substantive civic contributions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {badges.map((b) => (
          <Card
            key={b.id}
            className={`p-5 space-y-3 border-slate-200 ${
              b.earned ? 'bg-gradient-to-br from-white to-amber-50/30' : 'opacity-60 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {b.category}
              </span>
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
        ))}
      </div>
    </div>
  );
};
