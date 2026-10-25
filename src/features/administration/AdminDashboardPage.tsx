import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { DemoDatabase } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  ShieldCheck,
  Users,
  Layers,
  AlertTriangle,
  FileCheck2,
  BarChart3,
  MapPin,
  Flame,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey } = useAppRefreshStore();
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
  }, [refreshKey]);

  if (isLoading || !snapshot) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const openCases = snapshot.moderationCases.filter(
    (c) => c.status === 'open' || c.status === 'under_review'
  );
  const verifiedEvidenceCount = snapshot.evidence.filter(
    (e) => e.verificationStatus === 'verified'
  ).length;
  const activeProgrammesCount = snapshot.programmes.filter(
    (p) => p.status === 'active'
  ).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Role & Security Simulation Banner */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold">
            Simulated Session Role: Platform Admin ({currentUser?.name || 'Administrator'})
          </p>
          <p className="text-amber-800/90 leading-relaxed">
            Role switching in this prototype simulates role-based UI perspectives and permissions. In a production deployment, role enforcement is backed by cryptographic tokens and server-side RBAC guards.
          </p>
        </div>
      </div>

      {/* Main Header */}
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
            State Mission Cell &bull; Gujarat Urban Mobility Initiative &bull; Schema v{snapshot.schemaVersion}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/moderator-grants">
            <Button size="sm" variant="outline" className="border-civic-teal-700 text-civic-teal-300 hover:bg-slate-800">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-civic-teal-400" />
              <span>Scoped Grants ({snapshot.scopedModeratorGrants?.length || 0})</span>
            </Button>
          </Link>
          <Link to="/admin/moderation">
            <Button size="sm" variant="saffron">
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              <span>Moderation Queue ({openCases.length})</span>
            </Button>
          </Link>
          <Link to="/analytics">
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800">
              <BarChart3 className="w-4 h-4 mr-1.5" />
              <span>Analytics</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Calculated Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Registered Users</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 font-heading mt-2 block">
            {snapshot.users.length}
          </span>
          <span className="text-xs text-civic-teal-600 mt-1 block font-medium">
            Across {snapshot.institutions.length} partner institutions
          </span>
        </Card>

        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Verified Evidence</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-3xl font-extrabold text-civic-indigo-600 font-heading mt-2 block">
            {verifiedEvidenceCount} <span className="text-sm font-normal text-slate-400">/ {snapshot.evidence.length}</span>
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Audit photos & telemetry
          </span>
        </Card>

        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Youth Assemblies</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-3xl font-extrabold text-slate-900 font-heading mt-2 block">
            {snapshot.assemblies.length}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {snapshot.propositions.length} active propositions
          </span>
        </Card>

        <Card className="p-5 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Danger Hotspots</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-3xl font-extrabold text-rose-600 font-heading mt-2 block">
            {snapshot.civicIssues?.length || 0}
          </span>
          <span className="text-xs text-rose-600 mt-1 block font-medium">
            Community reported spots
          </span>
        </Card>
      </div>

      {/* Admin Modules Quick Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverable className="p-5 border-slate-200 flex flex-col justify-between">
          <div className="space-y-2">
            <Layers className="w-6 h-6 text-civic-indigo-600" />
            <CardTitle className="text-base font-bold text-slate-900">Programmes Management</CardTitle>
            <p className="text-xs text-slate-600">
              Deploy and configure statewide civic tracks ({activeProgrammesCount} active, {snapshot.programmes.length} total).
            </p>
          </div>
          <Link to="/admin/programmes" className="mt-4">
            <Button size="sm" variant="outline" className="w-full">Manage Programmes</Button>
          </Link>
        </Card>

        <Card hoverable className="p-5 border-slate-200 flex flex-col justify-between">
          <div className="space-y-2">
            <ShieldCheck className="w-6 h-6 text-civic-teal-600" />
            <CardTitle className="text-base font-bold text-slate-900">Scoped Moderator Grants</CardTitle>
            <p className="text-xs text-slate-600">
              Founder-held time-bounded delegations for assignments, memberships, or sessions ({snapshot.scopedModeratorGrants?.length || 0} grants).
            </p>
          </div>
          <Link to="/admin/moderator-grants" className="mt-4">
            <Button size="sm" variant="outline" className="w-full">Manage Delegations</Button>
          </Link>
        </Card>

        <Card hoverable className="p-5 border-slate-200 flex flex-col justify-between">
          <div className="space-y-2">
            <FileCheck2 className="w-6 h-6 text-civic-teal-600" />
            <CardTitle className="text-base font-bold text-slate-900">Content & Curriculum</CardTitle>
            <p className="text-xs text-slate-600">
              Manage {snapshot.courses.length} courses, {snapshot.lessons.length} lessons, and field assignments.
            </p>
          </div>
          <Link to="/admin/content" className="mt-4">
            <Button size="sm" variant="outline" className="w-full">Curriculum Hub</Button>
          </Link>
        </Card>

        <Card hoverable className="p-5 border-slate-200 flex flex-col justify-between">
          <div className="space-y-2">
            <BarChart3 className="w-6 h-6 text-civic-saffron-600" />
            <CardTitle className="text-base font-bold text-slate-900">Analytics & Insights</CardTitle>
            <p className="text-xs text-slate-600">
              Inspect state participation trends, credit velocity, and 2047 national vision metrics.
            </p>
          </div>
          <Link to="/analytics" className="mt-4">
            <Button size="sm" variant="outline" className="w-full">View Analytics</Button>
          </Link>
        </Card>
      </div>

      {/* Recent Activity & Moderation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pending Moderation Cases */}
        <Card className="p-5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 font-heading">Moderation Flags</h3>
            </div>
            <Link to="/admin/moderation" className="text-xs font-semibold text-civic-indigo-600 hover:underline">
              View All ({snapshot.moderationCases.length})
            </Link>
          </div>

          <div className="space-y-2.5">
            {snapshot.moderationCases.slice(0, 3).map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500">{c.id}</span>
                  <StatusChip status={c.status} />
                </div>
                <p className="text-xs font-semibold text-slate-900">{c.reason}</p>
                <span className="text-[10px] text-slate-500 block">
                  Target: {c.targetType} ({c.targetId}) &bull; Severity: {c.severity}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Reported Pedestrian Hazards */}
        <Card className="p-5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 font-heading">Recent Danger Spots</h3>
            </div>
            <Link to="/issues" className="text-xs font-semibold text-civic-indigo-600 hover:underline">
              Civic Map &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {(snapshot.civicIssues || []).slice(0, 3).map((issue) => (
              <div key={issue.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{issue.title}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      issue.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800'
                        : issue.severity === 'high'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {issue.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-1">{issue.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-0.5">
                  <span>{issue.ward || issue.location}</span>
                  <span>&bull;</span>
                  <span>{issue.reportsCount} youth endorsements</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
