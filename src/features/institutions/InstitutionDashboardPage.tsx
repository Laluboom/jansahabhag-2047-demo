import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Institution, User, Programme, Enrolment, Evidence } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  Building2,
  Users,
  Layers,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  FileCheck2,
  Sparkles,
  ExternalLink,
  Search,
} from 'lucide-react';

export const InstitutionDashboardPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey } = useAppRefreshStore();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const instId = currentUser?.institutionId || 'inst_navchetna_jaipur';
        const [inst, allUsers, progs, allEv] = await Promise.all([
          demoRepository.getInstitution(instId),
          demoRepository.getUsers(),
          demoRepository.getProgrammes(),
          demoRepository.getEvidenceList(),
        ]);
        setInstitution(inst);
        const instParticipants = allUsers.filter((u) => u.institutionId === instId);
        setParticipants(instParticipants);
        setProgrammes(progs.filter((p) => p.institutionIds.includes(instId)));

        const instUserIds = instParticipants.map((u) => u.id);
        setEvidenceList(allEv.filter((e) => instUserIds.includes(e.ownerId)));
      } catch (err) {
        console.error('Failed to load institution dashboard', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser, refreshKey]);

  if (isLoading || !institution) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const totalCohortCredits = participants.reduce((sum, u) => sum + u.totalCredits, 0);
  const verifiedCohortEvidence = evidenceList.filter((e) => e.verificationStatus === 'verified').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-civic-teal-700 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Institutional Oversight Hub</span>
            <span className="text-slate-400 font-normal">&bull; Role View: Institution Admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            {institution.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Institution Code: <strong>{institution.code}</strong> &bull; District: {institution.district}, {institution.state}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/institution/participants">
            <Button size="sm" variant="outline">
              <Users className="w-4 h-4 mr-1.5" />
              <span>Cohort Roster ({participants.length})</span>
            </Button>
          </Link>
          <Link to="/institution/programmes">
            <Button size="sm" variant="primary">
              <Layers className="w-4 h-4 mr-1.5" />
              <span>Manage Programmes</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Role Notice */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-civic-indigo-600 shrink-0" />
          <span>
            Viewing institutional records as <strong>{currentUser?.name || 'Institution Admin'}</strong>. State synchronization is active across all participant and teacher interactions.
          </span>
        </div>
        <span className="text-[10px] text-slate-400 hidden sm:inline">Demo RBAC Simulation</span>
      </div>

      {/* Real Calculated Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Registered Cohort</span>
          <span className="text-3xl font-extrabold text-slate-900 font-heading mt-1 block">
            {participants.length}
          </span>
          <span className="text-xs text-civic-teal-600 font-medium mt-1 block">
            {participants.filter((u) => u.role === 'participant').length} Students &bull; {participants.filter((u) => u.role === 'teacher').length} Faculty
          </span>
        </Card>

        <Card className="p-5 border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Cohort Civic Credits</span>
          <span className="text-3xl font-extrabold text-civic-saffron-700 font-heading mt-1 block">
            {totalCohortCredits}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Accumulated across ledger</span>
        </Card>

        <Card className="p-5 border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Verified Evidence</span>
          <span className="text-3xl font-extrabold text-civic-indigo-600 font-heading mt-1 block">
            {verifiedCohortEvidence}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Of {evidenceList.length} total field audits</span>
        </Card>

        <Card className="p-5 border-slate-200 bg-white shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Active Programmes</span>
          <span className="text-3xl font-extrabold text-slate-900 font-heading mt-1 block">
            {programmes.length}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Term 1 Deployments</span>
        </Card>
      </div>

      {/* Cohort Deliberators & Field Auditors */}
      <Card className="border-slate-200 p-6 space-y-4 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-civic-teal-600" />
              <span>Institutional Cohort Roster ({participants.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live student and faculty profiles registered under {institution.name}.
            </p>
          </div>

          <Link to="/institution/participants">
            <Button size="sm" variant="outline" className="text-xs">
              <span>Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {participants.map((u) => (
            <div
              key={u.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={u.avatar} alt={u.name} size="md" />
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 font-heading block truncate">
                    {u.name}
                  </span>
                  <span className="text-[11px] text-slate-500 capitalize">
                    {u.role.replace('_', ' ')} &bull; {u.location}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-civic-saffron-700 block">
                  {u.totalCredits} Credits
                </span>
                <span className="text-[10px] text-slate-400">
                  {u.badgeCount} Badges
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Programmes Overview */}
      <Card className="border-slate-200 p-6 space-y-4 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-civic-indigo-600" />
            <span>Deployed Civic Programmes ({programmes.length})</span>
          </h2>
          <Link to="/institution/programmes">
            <Button size="sm" variant="outline" className="text-xs">
              <span>View All</span>
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {programmes.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 font-heading">{p.title}</span>
                  <StatusChip status={p.status} />
                </div>
                <p className="text-slate-600 mt-1 line-clamp-1">{p.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                  <span>Theme: <strong>{p.theme}</strong></span>
                  <span>&bull;</span>
                  <span>{p.courseIds.length} Curriculum Courses</span>
                </div>
              </div>

              <Link to="/institution/programmes" className="shrink-0">
                <Button size="sm" variant="outline" className="text-xs">
                  <span>Programme Details</span>
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
