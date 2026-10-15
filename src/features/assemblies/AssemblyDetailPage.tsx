import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import {
  Assembly,
  AssemblyRole,
  Evidence,
  Contribution,
  Proposition,
  User,
  AssemblyStage,
} from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
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
  CheckCircle2,
  MapPin,
  Clock,
  BookOpen,
} from 'lucide-react';

const ALL_STAGES: AssemblyStage[] = [
  'frame',
  'think',
  'enable',
  'troubleshoot',
  'shape',
  'final_assembly',
];

export const AssemblyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const navigate = useNavigate();

  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [userRole, setUserRole] = useState<AssemblyRole | null>(null);
  const [allRoles, setAllRoles] = useState<AssemblyRole[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id || !currentUser) return;
      setIsLoading(true);
      try {
        const [asm, r, roles, contribs, allUsers] = await Promise.all([
          demoRepository.getAssembly(id),
          demoRepository.getUserAssemblyRole(id, currentUser.id),
          demoRepository.getAssemblyRoles(id),
          demoRepository.getContributions(id),
          demoRepository.getUsers(),
        ]);
        setAssembly(asm);
        setUserRole(r);
        setAllRoles(roles);
        setContributions(contribs);

        if (asm) {
          const participantUsers = allUsers.filter((u) => asm.participantUserIds.includes(u.id));
          setParticipants(participantUsers);

          if (asm.evidenceIds.length) {
            const evs = await Promise.all(
              asm.evidenceIds.map((eid) => demoRepository.getEvidence(eid))
            );
            setEvidenceList(evs.filter((e): e is Evidence => e !== null));
          }

          if (asm.propositionId) {
            const prop = await demoRepository.getProposition(asm.propositionId);
            setProposition(prop);
          }
        }
      } catch (err) {
        console.error('Failed to load assembly details', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser, refreshKey]);

  const handleJoinAssembly = async () => {
    if (!id || !currentUser) return;
    setIsJoining(true);
    try {
      await demoRepository.joinAssembly(id, currentUser.id);
      triggerRefresh();
      navigate(`/assemblies/${id}/session`);
    } catch (err) {
      console.error('Failed to join assembly', err);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading youth assembly chamber">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  if (!assembly) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4">
        <Link
          to="/assemblies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assemblies</span>
        </Link>
        <Card className="p-8 text-center space-y-4 border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Vote className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-slate-900">Youth Assembly Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The requested deliberative assembly chamber "{id}" does not exist in the database.
          </p>
          <div className="pt-2">
            <Link to="/assemblies">
              <Button size="sm" variant="primary">
                View All Youth Assemblies
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isJoined = currentUser ? assembly.participantUserIds.includes(currentUser.id) : false;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        to="/assemblies"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assemblies</span>
      </Link>

      {/* Assembly Hero Card */}
      <Card className="border-civic-teal-200 p-6 sm:p-8 space-y-5 bg-gradient-to-br from-white via-civic-teal-50/20 to-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-teal-800 bg-civic-teal-50 px-3 py-1 rounded-full border border-civic-teal-200">
              Stage: {assembly.currentStage.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {assembly.location}
            </span>
          </div>
          <StatusChip status={assembly.status} />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
            {assembly.title}
          </h1>
          <p className="text-sm text-civic-teal-900 font-semibold mt-1">
            Deliberative Theme: {assembly.theme}
          </p>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {assembly.description}
          </p>
        </div>

        {/* Central Question Callout */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 space-y-1 shadow-2xs">
          <span className="font-bold text-civic-indigo-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-civic-indigo-600" />
            Central Deliberative Question:
          </span>
          <p className="text-sm sm:text-base text-slate-800 italic font-medium">"{assembly.question}"</p>
        </div>

        {/* 6 Stages Roadmap Timeline */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Assembly Deliberation Pathway (6 Stages)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 text-center">
            {ALL_STAGES.map((st, i) => {
              const isCurrent = assembly.currentStage === st;
              const isPassed = ALL_STAGES.indexOf(assembly.currentStage) > i;

              return (
                <div
                  key={st}
                  className={`p-2 rounded-lg text-[10px] font-medium border transition-all ${
                    isCurrent
                      ? 'bg-civic-teal-600 text-white border-civic-teal-700 font-bold shadow-xs'
                      : isPassed
                      ? 'bg-civic-teal-50 text-civic-teal-900 border-civic-teal-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  <span className="block font-bold">{i + 1}</span>
                  <span className="capitalize truncate block">{st.replace('_', ' ')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Join or Enter Action Area */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span><strong>{assembly.participantUserIds.length}</strong> Admitted Delegates</span>
            <span>&bull;</span>
            <span><strong>{evidenceList.length}</strong> Ground Evidence Records</span>
            <span>&bull;</span>
            <span><strong>{contributions.length}</strong> Chamber Contributions</span>
          </div>

          <div className="flex items-center gap-2">
            {isJoined ? (
              <Link to={`/assemblies/${assembly.id}/session`}>
                <Button size="md" variant="teal" className="shadow-xs">
                  <Vote className="w-4 h-4 mr-1.5" />
                  <span>Enter Live Deliberation Workspace</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <Button
                size="md"
                variant="primary"
                isLoading={isJoining}
                onClick={handleJoinAssembly}
                className="shadow-xs"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                <span>Join Youth Assembly (+10 Credits)</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Role Card for Participant */}
      {userRole ? (
        <Card className="border-civic-indigo-200 bg-civic-indigo-50/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-civic-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold font-heading text-civic-indigo-950">
                Your Allocated Role: {userRole.roleName}
              </h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-civic-indigo-100 text-civic-indigo-800 font-bold border border-civic-indigo-300">
              Active Chamber Role
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Key Responsibilities:
            </span>
            <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
              {userRole.responsibilities.map((resp, i) => (
                <li key={i} className="leading-relaxed">{resp}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-civic-indigo-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-civic-indigo-900">
              Deliberative Inquiry Prompts (Use in Workspace):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {userRole.promptSuggestions.map((prompt, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-white border border-civic-indigo-200 text-xs text-slate-700 italic">
                  "{prompt}"
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-amber-900 font-heading">
              You have not joined this Assembly yet
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Click below to join, receive your allocated role (e.g. Thinker), earn 10 Deliberation Credits, and enter the chamber.
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            isLoading={isJoining}
            onClick={handleJoinAssembly}
          >
            <span>Join Now (+10 Credits)</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Card>
      )}

      {/* Proposition Status Card */}
      {proposition && (
        <Card className="border-slate-200 p-6 space-y-4 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-civic-saffron-600" />
              <span>Draft Civic Proposition (v{proposition.version})</span>
            </h3>
            <div className="flex items-center gap-2">
              <Link to={`/propositions/${proposition.id}/revisions`} className="text-xs text-civic-indigo-600 font-semibold hover:underline">
                {proposition.revisions.length} Revisions
              </Link>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800 font-bold uppercase">
                {proposition.outcome}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
            {proposition.proposition}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Support: <strong>{proposition.supportProfile.stronglySupport} Strongly Support</strong></span>
              <span>&bull;</span>
              <span>Dissent: <strong>{proposition.dissent.length} Records Preserved</strong></span>
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

      {/* Two Column Grid: Deliberators & Evidence Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chamber Deliberators & Roles */}
        <Card className="border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-civic-indigo-600" />
              <span>Chamber Deliberators ({participants.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Simulated Collaboration</span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {participants.map((p) => {
              const role = allRoles.find((r) => r.userId === p.id);
              const isMe = p.id === currentUser?.id;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    isMe
                      ? 'bg-civic-indigo-50/50 border-civic-indigo-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar src={p.avatar} alt={p.name} size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-civic-indigo-600 text-white font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">{p.institutionName}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-civic-indigo-800 bg-civic-indigo-100 px-2 py-0.5 rounded border border-civic-indigo-200">
                    {role ? role.roleName : 'Delegate'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Chamber Evidence Pool */}
        <Card className="border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-civic-teal-600" />
              <span>Chamber Evidence Pool ({evidenceList.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Traceable IDs</span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-civic-teal-800 bg-civic-teal-50 px-1.5 py-0.5 rounded border border-civic-teal-200 font-bold">
                    {ev.id}
                  </span>
                  <StatusChip status={ev.verificationStatus} />
                </div>
                <h4 className="font-bold text-slate-900">{ev.title}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-2">{ev.description}</p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/60">
                  <span>Source: {ev.source}</span>
                  <span className="capitalize">Visibility: {ev.visibility}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

