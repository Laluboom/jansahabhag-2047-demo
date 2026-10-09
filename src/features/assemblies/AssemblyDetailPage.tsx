import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Assembly, AssemblyRole, Evidence, Contribution, Proposition } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  ArrowLeft,
  ArrowRight,
  Vote,
  Users,
  Calendar,
  HelpCircle,
  FileCheck2,
  Sparkles,
  Layers,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export const AssemblyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey } = useAppRefreshStore();
  const navigate = useNavigate();

  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [userRole, setUserRole] = useState<AssemblyRole | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id || !currentUser) return;
      setIsLoading(true);
      try {
        const [asm, r, contribs] = await Promise.all([
          demoRepository.getAssembly(id),
          demoRepository.getUserAssemblyRole(id, currentUser.id),
          demoRepository.getContributions(id),
        ]);
        setAssembly(asm);
        setUserRole(r);
        setContributions(contribs);

        if (asm?.evidenceIds.length) {
          const evs = await Promise.all(
            asm.evidenceIds.map((eid) => demoRepository.getEvidence(eid))
          );
          setEvidenceList(evs.filter((e): e is Evidence => e !== null));
        }

        if (asm?.propositionId) {
          const prop = await demoRepository.getProposition(asm.propositionId);
          setProposition(prop);
        }
      } catch (err) {
        console.error('Failed to load assembly details', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser, refreshKey]);

  if (isLoading || !assembly) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const isFacilitator = currentUser?.role === 'facilitator' || currentUser?.id === assembly.facilitatorId;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/assemblies" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assemblies</span>
      </Link>

      {/* Assembly Banner */}
      <Card className="border-civic-teal-200 p-6 sm:p-8 space-y-4 bg-gradient-to-br from-white via-civic-teal-50/20 to-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-teal-800 bg-civic-teal-50 px-2.5 py-1 rounded-full border border-civic-teal-200">
              Stage: {assembly.currentStage.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-500">
              {assembly.location}
            </span>
          </div>
          <StatusChip status={assembly.status} />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            {assembly.title}
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {assembly.description}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 space-y-1 shadow-2xs">
          <span className="font-semibold text-civic-indigo-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-civic-indigo-600" />
            Central Deliberative Question
          </span>
          <p className="text-sm text-slate-700 italic font-medium">"{assembly.question}"</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>{assembly.participantUserIds.length} Deliberators</span>
            <span>&bull;</span>
            <span>{evidenceList.length} Evidence Records</span>
            <span>&bull;</span>
            <span>{contributions.length} Chamber Contributions</span>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`/assemblies/${assembly.id}/session`}>
              <Button size="md" variant="teal">
                <Vote className="w-4 h-4 mr-1.5" />
                <span>Enter Live Deliberation Workspace</span>
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Role Card for Participant */}
      {userRole && (
        <Card className="border-civic-indigo-200 bg-civic-indigo-50/40 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-civic-indigo-600" />
              <h2 className="text-base font-bold font-heading text-civic-indigo-950">
                Your Assigned Role: {userRole.roleName}
              </h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-civic-indigo-100 text-civic-indigo-800 font-semibold">
              Deliberator
            </span>
          </div>

          <p className="text-xs text-slate-600">
            As a <strong>{userRole.roleName}</strong>, your responsibility is to ensure critical inquiries and risk mitigations are incorporated into the proposition.
          </p>

          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Role Inquiry Prompts:
            </span>
            <ul className="space-y-1 text-xs text-slate-700">
              {userRole.promptSuggestions.map((prompt, i) => (
                <li key={i} className="p-2 rounded-lg bg-white border border-slate-200 italic">
                  "{prompt}"
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Proposition Status Summary Card */}
      {proposition && (
        <Card className="border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-civic-saffron-600" />
              <span>Draft Civic Proposition (v{proposition.version})</span>
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 border text-slate-700 font-bold uppercase">
              Outcome: {proposition.outcome}
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-700">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 whitespace-pre-line leading-relaxed">
              {proposition.proposition}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Support: <strong>{proposition.supportProfile.stronglySupport} Strongly Support</strong></span>
              <span>&bull;</span>
              <span>Dissent records: <strong>{proposition.dissent.length}</strong></span>
            </div>

            <Link to={`/propositions/${proposition.id}`}>
              <Button size="sm" variant="outline">
                <span>View Full Proposition & Dissent</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};
