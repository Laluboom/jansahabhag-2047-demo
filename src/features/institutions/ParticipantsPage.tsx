import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { demoRepository } from '../../services/demoRepository';
import { User } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { ArrowLeft, Users, Award, ShieldCheck } from 'lucide-react';

export const ParticipantsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const list = await demoRepository.getUsers();
        setUsers(list);
      } catch (err) {
        console.error('Failed to load participants', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/institution/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Institution Hub</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-civic-teal-600" />
          <span>Cohort Participants Directory ({users.length})</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Student members, peer facilitators, and faculty leads registered in JanSahabhag 2047.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <Card key={u.id} className="p-4 border-slate-200 flex items-start gap-3.5">
            <Avatar src={u.avatar} alt={u.name} size="md" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {u.role.replace('_', ' ')}
              </span>
              <h3 className="text-sm font-bold text-slate-900 font-heading truncate">
                {u.name}
              </h3>
              <p className="text-xs text-slate-500 truncate">{u.institutionName}</p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                <span className="font-semibold text-civic-saffron-700">{u.totalCredits} Credits</span>
                <span>&bull;</span>
                <span>{u.badgeCount} Badges</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
