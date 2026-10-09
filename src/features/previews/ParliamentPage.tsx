import React, { useState } from 'react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import {
  Landmark,
  Users,
  Vote,
  Sparkles,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Volume2,
} from 'lucide-react';

export const ParliamentPage: React.FC = () => {
  const [selectedMotionModal, setSelectedMotionModal] = useState<boolean>(false);

  const motions = [
    {
      id: 'MOT-RAJ-07',
      state: 'Rajasthan',
      title: 'Mandatory 25 km/h Safe School Perimeter Zones & Raised Crosswalk Standards',
      sponsor: 'Priya Sharma (Youth Delegate, Jaipur)',
      status: 'Tabled in Apex Chamber',
      support: '89% State Deliberation Consensus',
      synopsis:
        'Statutory mandate requiring urban local bodies to install physical speed tables and continuous 1.8m footpaths outside high-density educational corridors.',
    },
    {
      id: 'MOT-MAH-12',
      state: 'Maharashtra',
      title: 'Urban School Bus Staggering & Non-Motorised Freight Windows',
      sponsor: 'Rahul Deshmukh (Youth Delegate, Pune)',
      status: 'Under Committee Review',
      support: '78% State Deliberation Consensus',
      synopsis:
        'Designation of zero-emission student walking zones during 07:30-08:30 and 14:00-15:00 peak hours.',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DemoPreviewBadge
        size="banner"
        label="National Youth Parliament Preview"
        description="National apex deliberative chamber aggregating verified state assembly propositions into unified parliamentary submissions."
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-civic-saffron-600" />
            <span>National Youth Parliament 2047</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Apex youth assembly tabling grassroots civic propositions from 28 State Deliberation Grids.
          </p>
        </div>

        <Button
          size="sm"
          variant="saffron"
          onClick={() => setSelectedMotionModal(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          <span>Inspect Rajasthan Motion #07</span>
        </Button>
      </div>

      {/* Chamber Header Card */}
      <Card className="p-8 border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono text-civic-saffron-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WINTER SESSION 2026 IN PLENARY</span>
          </div>
          <DemoPreviewBadge size="sm" label="Simulated Apex Chamber" />
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-white">
            Special Plenary: Child & Pedestrian Urban Transit Protection
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Presiding Speaker: Youth Advisory Panel &bull; 540 Youth Parliamentarians representing all States & UTs.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Motions Tabled</span>
            <span className="text-lg font-bold text-white font-heading mt-0.5 block">24</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Verified Audits</span>
            <span className="text-lg font-bold text-civic-saffron-400 font-heading mt-0.5 block">42,100</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Apex Consensus</span>
            <span className="text-lg font-bold text-emerald-400 font-heading mt-0.5 block">84.2%</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Target Ministry</span>
            <span className="text-xs font-semibold text-slate-200 font-heading mt-1 block">MoHUA & MoRTH</span>
          </div>
        </div>
      </Card>

      {/* Motions Order of Business */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
          <Vote className="w-5 h-5 text-civic-indigo-600" />
          <span>Tabled Motions on the Order Paper</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {motions.map((m) => (
            <Card key={m.id} className="p-6 border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-civic-indigo-600 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100">
                    {m.id} &bull; {m.state}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {m.status}
                  </span>
                </div>

                <CardTitle className="text-base font-bold text-slate-900">{m.title}</CardTitle>
                <p className="text-xs text-slate-600 leading-relaxed">{m.synopsis}</p>
                <div className="pt-1 text-[11px] text-slate-500">
                  <span>Lead Sponsor: <strong>{m.sponsor}</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-civic-teal-700">{m.support}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedMotionModal(true)}
                  className="text-xs"
                >
                  View Motion Brief
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Motion Detail Modal */}
      {selectedMotionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-civic-saffron-600 uppercase">
                  Rajasthan State Motion #07
                </span>
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Safe School Perimeter Zone Standards (2026)
                </h3>
              </div>
              <button
                onClick={() => setSelectedMotionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 text-xs text-slate-600 flex-1 pr-1">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <span className="font-bold block">Statutory Tabling Summary</span>
                <p className="leading-relaxed text-[11px]">
                  Originating from the Jaipur Pedestrian Safety Youth Assembly (#assembly_jaipur_pedestrian_2026), this resolution unifies audit findings from 12 Jaipur and Kota schools into a national standard.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-900 uppercase tracking-wider block text-[10px]">
                  Key Legislative Clauses
                </span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  <li>Mandatory speed tables reducing vehicular approach velocity to 25 km/h within 200m of schools.</li>
                  <li>Continuous 1.8m grade-separated pedestrian footpaths with unobstructed curb cuts.</li>
                  <li>Installation of solar-powered amber flashers active during bell transition periods.</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                <strong>Simulated Preview Context:</strong> In the full Mission 2047 platform, passed apex motions are transmitted electronically to the parliamentary e-Gazette and municipal standing committee portal.
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedMotionModal(false)}
              >
                Close Motion Brief
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
