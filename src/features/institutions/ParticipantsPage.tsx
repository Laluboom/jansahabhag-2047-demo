import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { demoRepository } from '../../services/demoRepository';
import { User } from '../../types/domain';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
} from 'lucide-react';

export const ParticipantsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
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

  const filteredUsers = users.filter((u) => {
    if (selectedRole !== 'all' && u.role !== selectedRole) return false;
    if (
      searchTerm.trim() &&
      !u.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !u.institutionName.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        to="/institution/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Institution Hub</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-civic-teal-600" />
            <span>Statewide & Institutional Cohort Directory ({users.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Student members, peer facilitators, and faculty leads registered in JanSahabhag 2047.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by name or school..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Role:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'participant', label: 'Participants' },
            { id: 'teacher', label: 'Teachers' },
            { id: 'facilitator', label: 'Facilitators' },
            { id: 'institution_admin', label: 'Admins' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === r.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Participants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => (
          <Card
            key={u.id}
            className="p-4 border-slate-200 bg-white flex items-start gap-3.5 shadow-sm hover:border-slate-300 transition-all"
          >
            <Avatar src={u.avatar} alt={u.name} size="md" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-civic-teal-700 bg-civic-teal-50 px-2 py-0.5 rounded border border-civic-teal-100 inline-block mb-1">
                {u.role.replace('_', ' ')}
              </span>
              <h3 className="text-sm font-bold text-slate-900 font-heading truncate">
                {u.name}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">{u.institutionName}</p>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold text-civic-saffron-700">
                  {u.totalCredits} Credits
                </span>
                <span className="text-[11px] text-slate-400">
                  {u.badgeCount} Badges
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
