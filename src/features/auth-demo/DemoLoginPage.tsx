import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { User } from '../../types/domain';
import { formatRoleName } from '../../utils/formatters';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const DemoLoginPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { currentUser, switchPersona } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const allUsers = await demoRepository.getUsers();
      setUsers(allUsers);
    }
    load();
  }, []);

  const handleSelectPersona = async (userId: string) => {
    await switchPersona(userId);
    navigate('/dashboard');
  };

  const primaryPersonas = [
    'user_aarav',
    'user_meera',
    'user_kavita',
    'user_rohan',
    'user_ananya',
    'user_dev',
    'user_admin',
    'user_moderator',
  ];

  const filteredPrimary = users.filter((u) => primaryPersonas.includes(u.id));

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-civic-saffron-950 border border-civic-saffron-800 text-civic-saffron-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Persona Switcher
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Enter JanSahabhag <span className="text-civic-saffron-400">2047</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Select a role to explore the platform through that stakeholder's viewpoint. All personas share the live local database.
          </p>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrimary.map((user) => {
            const isCurrent = currentUser?.id === user.id;
            const isAarav = user.id === 'user_aarav';

            return (
              <Card
                key={user.id}
                hoverable
                onClick={() => handleSelectPersona(user.id)}
                className={`cursor-pointer transition-all text-left relative overflow-hidden bg-slate-800/90 border-slate-700 hover:border-civic-indigo-400 hover:bg-slate-800 ${
                  isCurrent ? 'ring-2 ring-civic-indigo-500 border-civic-indigo-500 bg-slate-800' : ''
                }`}
              >
                {isAarav && (
                  <div className="absolute top-0 right-0 bg-civic-saffron-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg">
                    Primary Journey
                  </div>
                )}
                <div className="flex items-start gap-3.5">
                  <Avatar src={user.avatar} alt={user.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold text-civic-teal-400 uppercase tracking-wider block">
                      {user.role === 'moderator' ? 'Scoped Moderator' : formatRoleName(user.role)}
                    </span>
                    <h2 className="text-base font-bold font-heading text-white truncate">
                      {user.name}
                    </h2>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {user.institutionName}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                  {user.bio}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    {user.role === 'participant' && `${user.totalCredits} Credits`}
                    {user.role === 'teacher' && 'Review Queue'}
                    {user.role === 'facilitator' && 'Assembly Lead'}
                    {user.role === 'institution_admin' && 'School Admin'}
                    {user.role === 'programme_manager' && 'State Mission'}
                    {user.role === 'platform_admin' && 'Platform Admin'}
                    {user.role === 'moderator' && 'Scoped Moderator'}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-civic-indigo-400 group-hover:text-civic-indigo-300">
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Action footer */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-400 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-civic-teal-400" />
            <span>Local persistence enabled (<code>jansahbhag_demo_v1</code>)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-civic-indigo-400" />
            <span>No live external telemetry or private data transmitted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
