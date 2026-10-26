import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { User, Institution } from '../../types/domain';
import { DEMO_COLLEGE_FULL_NAME } from '../../data/seed/institutions';
import { formatRoleName } from '../../utils/formatters';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Building2, Eye } from 'lucide-react';

export const DemoLoginPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [activeTab, setActiveTab] = useState<'primary' | 'all_students'>('primary');
  const { currentUser, switchPersona } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const allUsers = await demoRepository.getUsers();
      setUsers(allUsers);
      const insts = await demoRepository.getInstitutions();
      if (insts.length > 0) {
        setInstitution(insts[0]);
      }
    }
    load();
  }, []);

  const handleSelectPersona = async (userId: string) => {
    await switchPersona(userId);
    navigate('/dashboard');
  };

  const primaryPersonas = [
    'VSC-S-001', // Ankita Kapri (Primary Journey)
    'VSC-T-001', // Shri Mayur Parmar (Teacher)
    'VSC-T-002', // Shri Ankit Kalaria (Teacher UHV)
    'VSC-P-001', // Shri Dr. K. D. Ladwa (Principal)
    'VSC-G-001', // Shri Param Pujya Tyagvallabh Swamiji (Special Guest)
    'JS-F-001',  // Nazim M. Sandh (Founder)
    'JS-M-001',  // Yashvi Dalsaniya (Moderator)
    'JS-M-002',  // Dilip Sanghar (Moderator)
  ];

  const filteredUsers =
    activeTab === 'primary'
      ? users.filter((u) => primaryPersonas.includes(u.id))
      : users.filter((u) => u.role === 'participant');

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Header with Host College Name */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-civic-saffron-950 border border-civic-saffron-800 text-civic-saffron-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Persona Switcher
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Enter JanSahabhag <span className="text-civic-saffron-400">2047</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-slate-300 text-sm sm:text-base font-semibold max-w-2xl mx-auto" data-testid="signin-institution-name">
            <Building2 className="w-4 h-4 text-civic-teal-400 shrink-0" aria-hidden="true" />
            <span>{institution?.name || DEMO_COLLEGE_FULL_NAME}</span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto">
            Select a role to explore the platform through that stakeholder's viewpoint. All 22 personas share the live local database.
          </p>
        </div>

        {/* 18+ Participant Age Requirement Policy Banner */}
        <div
          className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-300 flex items-start gap-3 shadow-xs"
          data-testid="participant-age-requirement-notice"
        >
          <ShieldCheck className="w-5 h-5 text-civic-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-white block">
              18+ Participant Age Requirement & 33% Women's Reservation
            </span>
            <p className="text-slate-300 leading-relaxed">
              Platform demo policy requires every participant to be 18 years of age or older. All 15 seeded student personas represent participants aged 18 and above, with exactly 5 women fulfilling the 33% mandatory minimum formula: <code className="font-mono text-civic-saffron-300">ceil(0.33 &times; 15) = 5</code>. Staff, organizers, and guests hold no student seats. (Simulated roster: no real identity verification is claimed).
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('primary')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'primary'
                ? 'bg-civic-indigo-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            Core Roles &amp; Staff (8)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all_students')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all_students'
                ? 'bg-civic-indigo-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            All Students (15)
          </button>
        </div>

        {/* Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const isCurrent = currentUser?.id === user.id;
            const isAnkita = user.id === 'VSC-S-001';

            return (
              <Card
                key={user.id}
                hoverable
                onClick={() => handleSelectPersona(user.id)}
                className={`cursor-pointer transition-all text-left relative overflow-hidden bg-slate-800/90 border-slate-700 hover:border-civic-indigo-400 hover:bg-slate-800 ${
                  isCurrent ? 'ring-2 ring-civic-indigo-500 border-civic-indigo-500 bg-slate-800' : ''
                }`}
              >
                {isAnkita && (
                  <div className="absolute top-0 right-0 bg-civic-saffron-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg">
                    Primary Journey
                  </div>
                )}
                {user.role === 'special_guest' && (
                  <div className="absolute top-0 right-0 bg-slate-700 text-slate-200 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                    <Eye className="w-3 h-3 text-civic-teal-400" />
                    View-Only
                  </div>
                )}
                <div className="flex items-start gap-3.5">
                  <Avatar src={user.avatar} alt={user.name} fallback={user.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-civic-teal-400 uppercase tracking-wider block">
                        {user.role === 'moderator'
                          ? 'Scoped Moderator'
                          : user.role === 'special_guest'
                          ? 'Special Guest'
                          : formatRoleName(user.role)}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                        18 or older
                      </span>
                    </div>
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
                    {user.role === 'participant' && `${user.totalCredits} Civic Credit Points`}
                    {user.role === 'teacher' && 'Review Queue'}
                    {user.role === 'facilitator' && 'Assembly Lead'}
                    {user.role === 'institution_admin' && 'Principal / Admin'}
                    {user.role === 'programme_manager' && 'Programme Lead'}
                    {user.role === 'platform_admin' && 'Founder & Admin'}
                    {user.role === 'moderator' && 'Scoped Moderator'}
                    {user.role === 'special_guest' && 'View-Only Observer'}
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

        {/* Action footer & Mandatory Disclaimer */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-civic-teal-400" />
              <span>Local persistence enabled (<code>jansahbhag_demo_v1</code>)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-civic-indigo-400" />
              <span>No live external telemetry or private data transmitted</span>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 font-medium" data-testid="demo-institution-partnership-notice">
            Demo institution, not an official partnership
          </div>
        </div>
      </div>
    </div>
  );
};
