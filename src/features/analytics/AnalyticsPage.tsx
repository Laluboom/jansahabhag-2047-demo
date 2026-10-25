import React, { useState, useEffect } from 'react';
import { demoRepository } from '../../services/demoRepository';
import { DemoDatabase } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import {
  BarChart3,
  Globe2,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [snapshot, setSnapshot] = useState<DemoDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'local' | 'national'>('local');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const snap = await demoRepository.getDatabaseSnapshot();
        setSnapshot(snap);
      } catch (err) {
        console.error('Failed to load analytics data', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading || !snapshot) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  // Dimension breakdown data from credits
  const dimensionCounts: Record<string, number> = {
    Learning: 0,
    Observation: 0,
    Deliberation: 0,
    Reflection: 0,
    Contribution: 0,
    'Civic Action': 0,
  };

  snapshot.credits.forEach((c) => {
    if (dimensionCounts[c.dimension] !== undefined) {
      dimensionCounts[c.dimension] += c.amount;
    }
  });

  const creditData = Object.entries(dimensionCounts).map(([name, value]) => ({
    name,
    credits: value,
  }));

  const COLORS = ['#6366f1', '#14b8a6', '#f97316', '#8b5cf6', '#3b82f6', '#ec4899'];

  // Enrolment status counts
  const enrolmentData = [
    { name: 'Completed', value: snapshot.enrolments.filter((e) => e.status === 'completed').length },
    { name: 'In Progress', value: snapshot.enrolments.filter((e) => e.status === 'in_progress').length },
    { name: 'Not Started', value: snapshot.enrolments.filter((e) => e.status === 'not_started').length },
  ];

  // National ecosystem preview data (Seeded)
  const nationalRegionalData = [
    { region: 'Northern Hub (Raj, DL, PB)', deliberators: 382000, proposals: 4920 },
    { region: 'Western Hub (MH, GJ)', deliberators: 294000, proposals: 3610 },
    { region: 'Southern Hub (KA, KL, TN)', deliberators: 320000, proposals: 3890 },
    { region: 'Eastern Hub (WB, OD, JH)', deliberators: 185000, proposals: 1720 },
    { region: 'North-East Hub (AS, ML)', deliberators: 67500, proposals: 680 },
  ];

  const nationalStateRankings = [
    { state: 'Gujarat', audits: 42100, youthCount: 98400, enactedBylaws: 74 },
    { state: 'Maharashtra', audits: 38900, youthCount: 89200, enactedBylaws: 68 },
    { state: 'Kerala', audits: 31400, youthCount: 76500, enactedBylaws: 82 },
    { state: 'Delhi NCT', audits: 29800, youthCount: 71300, enactedBylaws: 59 },
    { state: 'Karnataka', audits: 27500, youthCount: 65100, enactedBylaws: 52 },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-civic-indigo-600" />
            <span>Civic Engagement & Deliberation Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time local deliberative telemetry synchronized with statewide Mission 2047 benchmarks.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('local')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'local'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Local Institution Real-Time
          </button>
          <button
            onClick={() => setActiveTab('national')}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'national'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-civic-saffron-600" />
            <span>National 2047 Preview</span>
          </button>
        </div>
      </div>

      {activeTab === 'local' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase block">Total Participants</span>
              <span className="text-2xl font-bold text-slate-900 font-heading mt-1 block">
                {snapshot.users.filter((u) => u.role === 'participant').length}
              </span>
              <span className="text-[11px] text-civic-teal-600">Active Deliberators</span>
            </Card>

            <Card className="p-4 border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase block">Total Civic Credit Points Awarded</span>
              <span className="text-2xl font-bold text-civic-saffron-700 font-heading mt-1 block">
                {snapshot.credits.reduce((s, c) => s + c.amount, 0)}
              </span>
              <span className="text-[11px] text-slate-500">Across dimensions</span>
            </Card>

            <Card className="p-4 border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase block">Evidence Records</span>
              <span className="text-2xl font-bold text-civic-indigo-600 font-heading mt-1 block">
                {snapshot.evidence.length}
              </span>
              <span className="text-[11px] text-slate-500">
                {snapshot.evidence.filter((e) => e.verificationStatus === 'verified').length} verified ground logs
              </span>
            </Card>

            <Card className="p-4 border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase block">Propositions</span>
              <span className="text-2xl font-bold text-slate-900 font-heading mt-1 block">
                {snapshot.propositions.length}
              </span>
              <span className="text-[11px] text-slate-500">Chamber resolutions</span>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Credits by Dimension Bar Chart */}
            <Card className="border-slate-200 p-6 space-y-4">
              <CardTitle className="text-base font-bold text-slate-900 font-heading">
                Civic Credit Points Earned by Civic Dimension
              </CardTitle>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creditData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="credits" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Enrolment Status Pie Chart */}
            <Card className="border-slate-200 p-6 space-y-4">
              <CardTitle className="text-base font-bold text-slate-900 font-heading">
                Course Enrolment & Completion Distribution
              </CardTitle>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={enrolmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {enrolmentData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'national' && (
        <div className="space-y-6">
          <DemoPreviewBadge
            size="banner"
            label="National Deliberation Grid Preview (Mission 2047)"
            description="Synthetic high-volume preview modeling nationwide federation of 28 state youth deliberation cells and municipal bylaws."
          />

          {/* National KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase block">Active States / UTs</span>
              <span className="text-2xl font-bold text-slate-900 font-heading mt-1 block">28 + 8 UTs</span>
              <span className="text-[11px] text-civic-teal-600">Pan-India Deployment</span>
            </Card>

            <Card className="p-4 border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase block">National Youth Deliberators</span>
              <span className="text-2xl font-bold text-civic-saffron-700 font-heading mt-1 block">1,248,500</span>
              <span className="text-[11px] text-slate-500">Across 12,400 schools</span>
            </Card>

            <Card className="p-4 border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase block">Municipal Propositions</span>
              <span className="text-2xl font-bold text-civic-indigo-600 font-heading mt-1 block">14,820</span>
              <span className="text-[11px] text-slate-500">Tabled in local bodies</span>
            </Card>

            <Card className="p-4 border-slate-200">
              <span className="text-xs font-semibold text-slate-500 uppercase block">Enacted Safety Bylaws</span>
              <span className="text-2xl font-bold text-emerald-600 font-heading mt-1 block">842</span>
              <span className="text-[11px] text-emerald-600">Statutory amendments</span>
            </Card>
          </div>

          {/* Regional Aggregation Chart & Ranking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-slate-200 space-y-4">
              <CardTitle className="text-base font-bold text-slate-900 font-heading">
                Youth Participation by Regional Zonal Council
              </CardTitle>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nationalRegionalData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="region" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="deliberators" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 border-slate-200 space-y-4">
              <CardTitle className="text-base font-bold text-slate-900 font-heading">
                Top State Deliberation Rankings
              </CardTitle>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-bold">State</th>
                      <th className="p-2.5 font-bold">Field Audits</th>
                      <th className="p-2.5 font-bold">Youth</th>
                      <th className="p-2.5 font-bold">Bylaws</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {nationalStateRankings.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-bold text-slate-900">{row.state}</td>
                        <td className="p-2.5 text-slate-600">{row.audits.toLocaleString()}</td>
                        <td className="p-2.5 text-slate-600">{row.youthCount.toLocaleString()}</td>
                        <td className="p-2.5 font-semibold text-emerald-600">+{row.enactedBylaws}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Simulated AI Civic Intelligence Insights */}
      <Card className="p-6 border-slate-200 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-civic-indigo-600" />
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Simulated AI Civic Intelligence Synthesis
            </h3>
          </div>
          <DemoPreviewBadge size="sm" label="Simulated AI Engine" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-indigo-100 shadow-sm space-y-1.5">
            <span className="font-bold text-indigo-900 block">
              1. Consensus Velocity on Pedestrian Calming (Rajkot & Saurashtra)
            </span>
            <p className="text-slate-600 leading-relaxed">
              Synthesizing 42 assembly contributions reveals <strong>88% consensus</strong> favoring raised speed tables over traditional rumble strips due to ambulance transit comfort.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-indigo-100 shadow-sm space-y-1.5">
            <span className="font-bold text-indigo-900 block">
              2. Bottleneck Prediction: Local Freight Curfew Windows
            </span>
            <p className="text-slate-600 leading-relaxed">
              Predictive clustering indicates <strong>42% friction</strong> between market traders and school peak hours. Recommends staggered 30-minute freight loading windows.
            </p>
          </div>
        </div>

        {/* AI Disclaimer Alert */}
        <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Simulated AI Disclosure:</strong> This synthesis is generated by a simulated demonstration AI module. In JanSahabhag 2047 governance architecture, automated AI analytics serve strictly as advisory synthesis tools and <em>never make binding statutory, moderation, or democratic policy decisions</em>.
          </p>
        </div>
      </Card>
    </div>
  );
};
