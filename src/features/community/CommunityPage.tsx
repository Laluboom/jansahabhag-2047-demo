import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { CommunityGroup } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MessageSquare, Users, ArrowRight } from 'lucide-react';

export const CommunityPage: React.FC = () => {
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const list = await demoRepository.getCommunityGroups();
        setGroups(list);
      } catch (err) {
        console.error('Failed to load community groups', err);
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-civic-indigo-600" />
          <span>Community Circles & Peer Forums</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Local peer coordination spaces for sharing field tips, mapping coordination, and cohort reflections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {groups.map((grp) => (
          <Card key={grp.id} hoverable className="p-5 border-slate-200 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-civic-teal-700 bg-civic-teal-50 px-2 py-0.5 rounded border border-civic-teal-200">
                {grp.category}
              </span>

              <CardTitle className="text-base font-bold text-slate-900 font-heading">
                {grp.name}
              </CardTitle>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {grp.description}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {grp.memberUserIds.length} Members
              </span>

              <Link to={`/community/groups/${grp.id}`}>
                <Button size="sm" variant="outline">
                  <span>Open Forum</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
