import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { Evidence } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { StatusChip } from '../../components/ui/StatusChip';
import { ArrowLeft, FileCheck2, ShieldCheck, MapPin, EyeOff } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const EvidencePage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const list = await demoRepository.getEvidenceList();
        // Privacy filter: only show public/institution/assembly OR private items owned by currentUser
        const filtered = list.filter((e) => {
          if (e.visibility === 'private') {
            return e.ownerId === currentUser.id;
          }
          return true;
        });
        setEvidenceList(filtered);
      } catch (err) {
        console.error('Failed to load evidence', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/passport" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Passport</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-civic-teal-600" />
          <span>Verifiable Evidence Repository</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audited field observations, traffic speed counts, and photo documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {evidenceList.map((ev) => {
          const isPrivate = ev.visibility === 'private';

          return (
            <Card key={ev.id} className="border-slate-200 p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {ev.type}
                    </span>
                    {isPrivate && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        Private to You
                      </span>
                    )}
                  </div>
                  <StatusChip status={ev.verificationStatus} />
                </div>

                <CardTitle className="text-sm font-bold text-slate-900 line-clamp-2">
                  {ev.title}
                </CardTitle>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {ev.description}
                </p>

                {ev.location && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>By {ev.ownerName}</span>
                <span>{formatDate(ev.createdAt)}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
