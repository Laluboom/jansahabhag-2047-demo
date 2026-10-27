import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Assembly, AssemblyRole } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { PointOfUseRulesButton } from '../../components/ui/PointOfUseRulesButton';
import { ThreadMotif } from '../../components/layout/ThreadMotif';
import {
  Vote,
  Users,
  Calendar,
  ArrowRight,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Scale,
} from 'lucide-react';

export const AssembliesPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const navigate = useNavigate();

  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [roles, setRoles] = useState<Record<string, AssemblyRole>>({});
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'concluded'>('all');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const list = await demoRepository.getAssemblies();
        setAssemblies(list);

        // Fetch user roles for all assemblies
        const rolesMap: Record<string, AssemblyRole> = {};
        for (const asm of list) {
          const r = await demoRepository.getUserAssemblyRole(asm.id, currentUser.id);
          if (r) rolesMap[asm.id] = r;
        }
        setRoles(rolesMap);
      } catch (err) {
        console.error('Failed to load assemblies', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser, refreshKey]);

  const handleJoin = async (asmId: string) => {
    if (!currentUser) return;
    setJoiningId(asmId);
    try {
      await demoRepository.joinAssembly(asmId, currentUser.id);
      triggerRefresh();
      navigate(`/assemblies/${asmId}/session`);
    } catch (err) {
      console.error('Failed to join assembly', err);
    } finally {
      setJoiningId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const filteredAssemblies = assemblies.filter((asm) => {
    if (filter === 'all') return true;
    if (filter === 'active') return asm.status === 'deliberating' || asm.status === 'active';
    if (filter === 'upcoming') return asm.status === 'upcoming';
    if (filter === 'concluded') return asm.status === 'concluded';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Five-Stage Product Method Banner */}
      <ThreadMotif currentStage="deliberate" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-civic-teal-700 uppercase tracking-wider mb-1">
            <Vote className="w-4 h-4" />
            <span>Deliberative Democracy Chambers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Youth Deliberative Assemblies
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Take a seat in a chamber, weigh what your field work found, and agree on one proposal to put to the city. Pick an assembly below to join.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
          <PointOfUseRulesButton
            moduleName="Youth Assembly"
            triggerText="Assembly Rules"
            modalTitle="Youth Assembly Procedural & Representation Rules"
            description="Standing orders governing deliberation stages, role quotas, speaking queues, and dissent."
            hasSeatQuotaRule={true}
            quotaContext="Named Deliberative Roles"
            rules={[
              {
                title: 'Canonical Six Stages',
                description: 'Assemblies advance sequentially through Frame, Think, Enable, Troubleshoot, Shape, and Final Assembly. Skipping stages is denied.',
              },
              {
                title: 'Four Core Deliberative Roles',
                description: 'Chambers guarantee balanced coverage of Thinkers, Enablers, Troubleshooters, and Shapers. Singular chair roles require explicit confirmation.',
              },
              {
                title: 'Dissent Retention & Transparency',
                description: 'Consensus is never forced. Split votes and minority reservations remain permanently recorded in the published outcome.',
              },
              {
                title: 'Speaking Queue & Recognition',
                description: 'Speaking turns are ordered and moderated by the Chair to ensure equitable participation across cohorts.',
              },
            ]}
            testId="assemblies-rules-btn"
          />
          <div className="flex items-center gap-2 bg-civic-teal-50 px-3.5 py-2 rounded-xl border border-civic-teal-200 text-xs text-civic-teal-900">
            <Sparkles className="w-4 h-4 text-civic-teal-600" />
            <span>Earn <strong>+2 Civic Credit Points</strong> on Joining & <strong>+1</strong> per Contribution</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {(['all', 'active', 'upcoming', 'concluded'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === tab
                ? 'bg-civic-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab === 'active' ? 'Active Deliberations' : tab}
          </button>
        ))}
      </div>

      {/* Assembly Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssemblies.map((asm) => {
          const userRole = roles[asm.id];
          const isJoined = currentUser ? asm.participantUserIds.includes(currentUser.id) : false;

          return (
            <Card
              key={asm.id}
              hoverable
              className="flex flex-col justify-between border-slate-200 bg-white"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-civic-teal-800 bg-civic-teal-50 px-2.5 py-0.5 rounded-full border border-civic-teal-200">
                    Stage: {asm.currentStage.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {asm.roleAllocations && (
                      <span className="text-[10px] font-bold text-civic-indigo-800 bg-civic-indigo-50 px-2 py-0.5 rounded-full border border-civic-indigo-200 flex items-center gap-1" data-testid="assembly-reservation-pill">
                        <Scale className="w-3 h-3 text-civic-indigo-600" />
                        <span>33% Role Reservation</span>
                      </span>
                    )}
                    <StatusChip status={asm.status} />
                  </div>
                </div>

                <div>
                  <CardTitle className="text-lg font-bold font-heading text-slate-900">
                    {asm.title}
                  </CardTitle>
                  <p className="text-xs text-civic-indigo-600 font-medium mt-0.5">
                    Theme: {asm.theme}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-civic-indigo-600" />
                    Central Deliberation Question:
                  </span>
                  <p className="italic text-slate-600">"{asm.question}"</p>
                </div>

                {isJoined && userRole ? (
                  <div className="p-3 rounded-lg bg-civic-indigo-50 border border-civic-indigo-200 text-xs flex items-center justify-between">
                    <span className="text-slate-700">
                      Your Assigned Role: <strong className="text-civic-indigo-900">{userRole.roleName}</strong>
                    </span>
                    <span className="text-[11px] text-civic-indigo-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-civic-indigo-600" />
                      Admitted Delegate
                    </span>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between">
                    <span className="text-emerald-900 font-medium">
                      Open for Participation &bull; Role assigned upon joining
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      +2 Civic Credit Points
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {asm.participantUserIds.length} Deliberators
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {asm.scheduledDate.split('T')[0]}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/assemblies/${asm.id}`}>
                    <Button size="sm" variant="outline">
                      <span>Overview</span>
                    </Button>
                  </Link>

                  {isJoined ? (
                    <Link to={`/assemblies/${asm.id}/session`}>
                      <Button size="sm" variant="teal">
                        <Vote className="w-3.5 h-3.5 mr-1" />
                        <span>Enter Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      isLoading={joiningId === asm.id}
                      onClick={() => handleJoin(asm.id)}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                      <span>Join Assembly (+2)</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

