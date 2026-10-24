import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { CivicIssue, Evidence } from '../../types/domain';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { StatusChip } from '../../components/ui/StatusChip';
import { Modal } from '../../components/ui/Modal';
import {
  ArrowLeft,
  MapPin,
  AlertCircle,
  ThumbsUp,
  FileCheck2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [issue, setIssue] = useState<CivicIssue | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [isVolunteering, setIsVolunteering] = useState(false);
  const [hasVolunteered, setHasVolunteered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const iss = await demoRepository.getCivicIssue(id);
        setIssue(iss);

        if (iss?.evidenceIds?.length) {
          const evs = await Promise.all(
            iss.evidenceIds.map((eid) => demoRepository.getEvidence(eid))
          );
          setEvidenceList(evs.filter((e): e is Evidence => e !== null));
        }
      } catch (err) {
        console.error('Failed to load issue details', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, refreshKey]);

  const handleUpvote = async () => {
    if (!id || !currentUser) return;
    try {
      await demoRepository.upvoteCivicIssue(id, currentUser.id);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to upvote', err);
    }
  };

  const handleVolunteer = async () => {
    setIsVolunteering(true);
    setTimeout(() => {
      setIsVolunteering(false);
      setHasVolunteered(true);
      setIsVolunteerModalOpen(false);
    }, 600);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading civic issue report">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <Link
          to="/issues"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Civic Issues Map</span>
        </Link>
        <Card className="p-8 text-center space-y-4 border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-slate-900">Civic Issue Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The requested road hazard or community issue "{id}" could not be found.
          </p>
          <div className="pt-2">
            <Link to="/issues">
              <Button size="sm" variant="primary">
                View All Civic Issues
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const hasUpvoted = currentUser ? issue.upvotedByUserIds?.includes(currentUser.id) : false;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/issues"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Civic Issues Map</span>
      </Link>

      <DemoPreviewBadge
        size="banner"
        label="Issue Detail Preview"
        description="Geospatial danger spot breakdown. Linked directly to Aarav's Jaipur Madhyam Marg pedestrian safety audit and Youth Assembly deliberations."
      />

      {/* Main Issue Card */}
      <Card className="border-slate-200 p-6 sm:p-8 space-y-5 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                issue.severity === 'critical'
                  ? 'text-rose-800 bg-rose-50 border-rose-200'
                  : issue.severity === 'high'
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : 'text-slate-700 bg-slate-100 border-slate-200'
              }`}
            >
              {issue.severity} Severity
            </span>
            <span className="text-xs font-mono text-slate-400 font-bold">{issue.ward}</span>
            <span className="text-xs text-slate-400 font-mono">({issue.id})</span>
          </div>

          <StatusChip status={issue.status} />
        </div>

        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">
            {issue.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-civic-saffron-600 shrink-0" />
            <span>
              {issue.location}
              {issue.coordinates ? ` (${issue.coordinates.lat}° N, ${issue.coordinates.lng}° E)` : ''}
            </span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
          <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
            Field Audit Findings & Ground Reality:
          </span>
          <p>{issue.description}</p>
        </div>

        {/* Hazard Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Peak Volume</span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">508 veh/30m</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Approach Speed</span>
            <span className="text-base font-extrabold text-rose-700 mt-0.5 block">42 km/h</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Sidewalk Drop</span>
            <span className="text-base font-extrabold text-amber-700 mt-0.5 block">18 cm (No Ramp)</span>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Nighttime Lux</span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">4.1 Lux</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUpvote}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                hasUpvoted
                  ? 'bg-civic-saffron-50 text-civic-saffron-800 border border-civic-saffron-200'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-civic-saffron-600' : ''}`} />
              <span>{issue.reportsCount} Endorsements & Signatures</span>
            </button>

            {hasVolunteered ? (
              <span className="text-xs text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled for Next Audit
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsVolunteerModalOpen(true)}
                className="text-xs"
              >
                <span>Volunteer for Next Field Audit</span>
              </Button>
            )}
          </div>

          {issue.assemblyId && (
            <Link to={`/assemblies/${issue.assemblyId}`}>
              <Button size="sm" variant="primary" className="text-xs">
                <span>View Assembly Deliberation</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {/* Linked Evidence Section */}
      {evidenceList.length > 0 && (
        <Card className="border-slate-200 p-6 space-y-4 bg-white shadow-sm">
          <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-civic-teal-600" />
            <span>Audited Field Evidence & Ground Documentation ({evidenceList.length})</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{ev.title}</span>
                  <StatusChip status={ev.verificationStatus} />
                </div>
                <p className="text-slate-600 line-clamp-2">{ev.description}</p>
                <span className="text-[10px] text-slate-400 block pt-1">
                  Recorded by: {ev.ownerName} &bull; {formatDate(ev.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Volunteer Modal */}
      <Modal
        isOpen={isVolunteerModalOpen}
        onClose={() => setIsVolunteerModalOpen(false)}
        title="Volunteer for School Gate Field Audit"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Join Aarav and the student audit team for the next 30-minute vehicle velocity and desire-line count at <strong>{issue.location}</strong>.
          </p>
          <div className="p-3 rounded-xl bg-civic-indigo-50 border border-civic-indigo-200 text-civic-indigo-900 space-y-1">
            <span className="font-bold block">Audit Equipment Provided:</span>
            <p>Optical speed radar, lux meter, IRC observation tally clipboards, and reflective safety vests.</p>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button size="sm" variant="outline" onClick={() => setIsVolunteerModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" isLoading={isVolunteering} onClick={handleVolunteer}>
              Confirm Volunteer Sign-Up
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
