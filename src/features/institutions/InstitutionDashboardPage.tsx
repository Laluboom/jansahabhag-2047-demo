import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { Institution, User, Programme } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Building2, Users, Layers, Award, ArrowRight, ShieldCheck } from 'lucide-react';

export const InstitutionDashboardPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const instId = currentUser?.institutionId || 'inst_navchetna_jaipur';
        const [inst, allUsers, progs] = await Promise.all([
          demoRepository.getInstitution(instId),
          demoRepository.getUsers(),
          demoRepository.getProgrammes(),
        ]);
        setInstitution(inst);
        setParticipants(allUsers.filter((u) => u.institutionId === instId));
        setProgrammes(progs.filter((p) => p.institutionIds.includes(instId)));
      } catch (err) {
        console.error('Failed to load institution dashboard', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser]);

  if (isLoading || !institution) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-civic-teal-700 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Institutional Oversight Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            {institution.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Code: {institution.code} &bull; {institution.district}, {institution.state}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/institution/participants">
            <Button size="sm" variant="outline">
              <Users className="w-4 h-4 mr-1.5" />
              <span>Cohort Roster ({participants.length})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Active Student Cohort</span>
          <span className="text-3xl font-extrabold text-slate-900 font-heading mt-1 block">
            {institution.activeParticipantsCount}
          </span>
          <span className="text-xs text-civic-teal-600 font-medium mt-1 block">Enrolled in Term 1</span>
        </Card>

        <Card className="p-5 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Active Programmes</span>
          <span className="text-3xl font-extrabold text-slate-900 font-heading mt-1 block">
            {programmes.length}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Civic & Safe Streets</span>
        </Card>

        <Card className="p-5 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase block">Civic Accreditation</span>
          <span className="text-3xl font-extrabold text-civic-indigo-600 font-heading mt-1 block">
            Level 2
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Verified by State Mission</span>
        </Card>
      </div>

      {/* Cohort Highlights */}
      <Card className="border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold font-heading text-slate-900">
          Student Deliberators & Field Auditors ({participants.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {participants.map((u) => (
            <div key={u.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900 font-heading block">{u.name}</span>
                <span className="text-[11px] text-slate-500">{u.role} &bull; {u.totalCredits} Credits</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-civic-indigo-50 text-civic-indigo-700 font-semibold">
                {u.badgeCount} Badges
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
