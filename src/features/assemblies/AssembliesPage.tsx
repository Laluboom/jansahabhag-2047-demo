import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Assembly, AssemblyRole } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { Vote, Users, Calendar, ArrowRight, HelpCircle, MapPin, Sparkles } from 'lucide-react';

export const AssembliesPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey } = useAppRefreshStore();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [roles, setRoles] = useState<Record<string, AssemblyRole>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const list = await demoRepository.getAssemblies();
        setAssemblies(list);

        // Fetch user roles
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Youth Deliberative Assemblies
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Non-adversarial democratic chambers synthesizing field evidence into actionable civic propositions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {assemblies.map((asm) => {
          const userRole = roles[asm.id];

          return (
            <Card
              key={asm.id}
              hoverable
              className="flex flex-col justify-between border-slate-200"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-civic-teal-700 bg-civic-teal-50 px-2.5 py-0.5 rounded-full border border-civic-teal-200">
                    Stage: {asm.currentStage.replace('_', ' ')}
                  </span>
                  <StatusChip status={asm.status} />
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

                {userRole && (
                  <div className="p-3 rounded-lg bg-civic-indigo-50 border border-civic-indigo-200 text-xs flex items-center justify-between">
                    <span className="text-slate-700">
                      Your Assigned Role: <strong className="text-civic-indigo-900">{userRole.roleName}</strong>
                    </span>
                    <span className="text-[11px] text-civic-indigo-700 font-semibold underline">
                      View Prompts
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {asm.participantUserIds.length} Members
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {asm.scheduledDate.split('T')[0]}
                  </span>
                </div>

                <Link to={`/assemblies/${asm.id}`}>
                  <Button size="sm" variant="teal">
                    <span>Enter Assembly Chamber</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
