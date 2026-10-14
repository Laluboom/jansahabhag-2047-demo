import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { Evidence } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { StatusChip } from '../../components/ui/StatusChip';
import { ArrowLeft, FileCheck2, ShieldCheck, MapPin, EyeOff, Filter, Search, Download } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const EvidencePage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine' | 'verified' | 'public'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const displayedList = evidenceList.filter((ev) => {
    if (filter === 'mine' && ev.ownerId !== currentUser?.id) return false;
    if (filter === 'verified' && ev.verificationStatus !== 'verified') return false;
    if (filter === 'public' && ev.visibility === 'private') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchDesc = ev.description?.toLowerCase().includes(q);
      const matchOwner = ev.ownerName?.toLowerCase().includes(q);
      const matchId = ev.id.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchOwner || matchId;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/passport" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Passport</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-civic-teal-600" />
            <span>Verifiable Evidence Repository</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audited field observations, traffic speed counts, and photo documentation.
          </p>
        </div>

        <div className="text-xs px-3 py-1.5 rounded-xl bg-civic-teal-50 border border-civic-teal-200 text-civic-teal-900 font-semibold shrink-0">
          {evidenceList.length} Traceable Records
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'mine', 'verified', 'public'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? 'bg-civic-teal-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab === 'all' ? 'All Evidence' : tab === 'mine' ? 'My Evidence' : tab}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search evidence or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-teal-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Grid of Evidence Cards */}
      {displayedList.length === 0 ? (
        <Card className="p-8 text-center text-xs text-slate-500 bg-white">
          No evidence records found matching your filters.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedList.map((ev) => {
            const isPrivate = ev.visibility === 'private';
            const isMine = ev.ownerId === currentUser?.id;

            return (
              <Card key={ev.id} className="border-slate-200 p-5 space-y-3 flex flex-col justify-between bg-white shadow-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-civic-teal-50 text-civic-teal-800 border border-civic-teal-200">
                        {ev.id}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ev.type}
                      </span>
                      {isPrivate && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Private
                        </span>
                      )}
                    </div>
                    <StatusChip status={ev.verificationStatus} />
                  </div>

                  <CardTitle className="text-sm font-bold text-slate-900 line-clamp-2 font-heading">
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

                  {ev.fileInfo ? (
                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 text-[11px] text-blue-900 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate">{ev.fileInfo.name}</span>
                        <span className="text-[10px] text-blue-700 shrink-0">
                          {(ev.fileInfo.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <span className="text-[10px] text-blue-600 block">
                        {ev.fileInfo.demoLabel || 'DEMO local browser file'}
                      </span>
                      {ev.fileInfo.dataUrl ? (
                        <div className="pt-1">
                          <a
                            href={ev.fileInfo.dataUrl}
                            download={ev.fileInfo.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-civic-teal-700 hover:text-civic-teal-900 bg-white px-2 py-0.5 rounded border border-civic-teal-300 shadow-2xs transition-colors"
                            title={`Download or preview ${ev.fileInfo.name}`}
                          >
                            <Download className="w-3 h-3" />
                            <span>Download / Preview File</span>
                          </a>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic block">
                          No stored file bytes (illustrative metadata only)
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500">
                      DEMO Description (Single-browser simulation - no remote upload server)
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>By {ev.ownerName} {isMine && '(You)'}</span>
                  <span>{formatDate(ev.createdAt)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

