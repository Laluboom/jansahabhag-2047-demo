import React, { useState, useEffect } from 'react';
import { demoRepository } from '../../services/demoRepository';
import { DemoDatabase } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { BarChart3, TrendingUp, Users, Award, ShieldCheck } from 'lucide-react';
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

  const COLORS = ['#6366f1', '#14b8a6', '#f97316', '#8b5cf6', '#ec4899'];

  // Enrolment status counts
  const enrolmentData = [
    { name: 'Completed', value: snapshot.enrolments.filter((e) => e.status === 'completed').length },
    { name: 'In Progress', value: snapshot.enrolments.filter((e) => e.status === 'in_progress').length },
    { name: 'Not Started', value: snapshot.enrolments.filter((e) => e.status === 'not_started').length },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-civic-indigo-600" />
          <span>Civic Engagement & Deliberation Analytics</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Calculated locally from active submissions, assembly participation, and credit transactions.
        </p>
      </div>

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
          <span className="text-xs font-semibold text-slate-500 uppercase block">Total Credits Awarded</span>
          <span className="text-2xl font-bold text-civic-saffron-700 font-heading mt-1 block">
            {snapshot.credits.reduce((s, c) => s + c.amount, 0)}
          </span>
          <span className="text-[11px] text-slate-500">Across 5 dimensions</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Evidence Records</span>
          <span className="text-2xl font-bold text-civic-indigo-600 font-heading mt-1 block">
            {snapshot.evidence.length}
          </span>
          <span className="text-[11px] text-slate-500">Verified & under review</span>
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
            Credits Earned by Civic Dimension
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
            Course Completion Distribution
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
  );
};
