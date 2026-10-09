import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { demoRepository } from '../../services/demoRepository';
import { DemoDatabase } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, Users, Layers, AlertTriangle, FileCheck2, BarChart3, ArrowRight } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [snapshot, setSnapshot] = useState<DemoDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const snap = await demoRepository.getDatabaseSnapshot();
        setSnapshot(snap);
      } catch (err) {
        console.error('Failed to load admin snapshot', err);
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

  const openCases = snapshot.moderationCases.filter((c) => c.status === 'open' || c.status === 'under_review');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-civic-teal-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Operations & Governance Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
            JanSahabhag 2047 State Command
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Local database schema v{snapshot.schemaVersion} &bull; State Mission Cell Rajasthan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/moderation">
            <Button size="sm" variant="saffron">
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              <span>Moderation Queue ({openCases.length})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Registered Users</span>
          <span className="text-3xl font-extrabold text-slate-900 font-heading mt-1 block">
            {snapshot.users.length}
          </span>
          <span className="text-xs text-civic-teal-600 mt-1 block">Active across 3 schools</span>
        </Card>

        <Card className="p-5 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Field Evidence Records</span>
          <span className="text-3xl font-extrabold text-civic-indigo-600 font-heading mt-1 block">
            {snapshot.evidence.length}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Verified ground data</span>
        </Card>

        <Card className="p-5 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Youth Assemblies</span>
          <span className="text-3xl font-extrabold text-slate-900 font-heading mt-1 block">
            {snapshot.assemblies.length}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Deliberative bodies</span>
        </Card>

        <Card className="p-5 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Total Credit Tx</span>
          <span className="text-3xl font-extrabold text-civic-saffron-700 font-heading mt-1 block">
            {snapshot.credits.length}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Ledger entries</span>
        </Card>
      </div>

      {/* Admin Modules Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hoverable className="p-5 border-slate-200 flex flex-col justify-between">
          <div className="space-y-2">
            <Layers className="w-6 h-6 text-civic-indigo-600" />
            <CardTitle className="text-base font-bold text-slate-900">Programmes Management</CardTitle>
            <p className="text-xs text-slate-600">Review deployment of 4 state civic action tracks.</p>
          </div>
          <Link to="/admin/programmes" className="mt-4">
            <Button size="sm" variant="outline" className="w-full">Manage Programmes</Button>
          </Link>
        </Card>

        <Card hoverable className="p-5 border-slate-200 flex flex-col justify-between">
          <div className="space-y-2">
            <FileCheck2 className="w-6 h-6 text-civic-teal-600" />
            <CardTitle className="text-base font-bold text-slate-900">Content & Curriculum</CardTitle>
            <p className="text-xs text-slate-600">Manage 8 courses, modules, and assignment rubrics.</p>
          </div>
          <Link to="/admin/content" className="mt-4">
            <Button size="sm" variant="outline" className="w-full">Curriculum Hub</Button>
          </Link>
        </Card>

        <Card hoverable className="p-5 border-slate-200 flex flex-col justify-between">
          <div className="space-y-2">
            <BarChart3 className="w-6 h-6 text-civic-saffron-600" />
            <CardTitle className="text-base font-bold text-slate-900">Analytics & Insights</CardTitle>
            <p className="text-xs text-slate-600">Inspect participation trends and credit velocities.</p>
          </div>
          <Link to="/analytics" className="mt-4">
            <Button size="sm" variant="outline" className="w-full">View Analytics</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};
