import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Project, Evidence, User } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { Textarea, Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { ProjectTeamSeats } from './ProjectTeamSeats';
import { ProjectBoard } from './ProjectBoard';
import {
  ArrowLeft,
  Target,
  Users,
  CheckCircle2,
  Award,
  FileCheck2,
  Sparkles,
  Plus,
  MessageSquare,
  Paperclip,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [project, setProject] = useState<Project | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [userEvidence, setUserEvidence] = useState<Evidence[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [proj, allUsers, allUserEv] = await Promise.all([
          demoRepository.getProject(id),
          demoRepository.getUsers(),
          currentUser ? demoRepository.getEvidenceList({ ownerId: currentUser.id }) : Promise.resolve([]),
        ]);
        setProject(proj);
        setUserEvidence(allUserEv);

        if (proj) {
          const members = allUsers.filter((u) => proj.memberUserIds.includes(u.id));
          setTeamMembers(members);

          if (proj.evidenceIds.length) {
            const evs = await Promise.all(
              proj.evidenceIds.map((eid) => demoRepository.getEvidence(eid))
            );
            setEvidenceList(evs.filter((e): e is Evidence => e !== null));
          } else {
            setEvidenceList([]);
          }
        }
      } catch (err) {
        console.error('Failed to load project details', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser, refreshKey]);

  const handleCompleteMilestone = async (milestoneId: string) => {
    if (!id || !currentUser) return;
    setIsUpdating(true);
    try {
      await demoRepository.completeProjectMilestone(id, milestoneId, currentUser.id);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to complete milestone', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser || !newNoteText.trim()) return;
    setIsAddingNote(true);
    try {
      await demoRepository.addProjectNote(id, {
        authorId: currentUser.id,
        text: newNoteText.trim(),
      });
      setNewNoteText('');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleAttachEvidence = async () => {
    if (!id || !selectedEvidenceId) return;
    try {
      await demoRepository.addProjectEvidence(id, selectedEvidenceId);
      setIsAttachModalOpen(false);
      setSelectedEvidenceId('');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to attach evidence', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading civic action project">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
        <Card className="p-8 text-center space-y-4 border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-slate-900">Project Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The requested civic project "{id}" could not be found.
          </p>
          <div className="pt-2">
            <Link to="/projects">
              <Button size="sm" variant="primary">
                View All Civic Projects
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const completedMilestonesCount = project.milestones.filter((m) => m.isCompleted).length;
  const totalMilestonesCount = project.milestones.length;
  const progressPercent = Math.round((completedMilestonesCount / (totalMilestonesCount || 1)) * 100);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Projects</span>
      </Link>

      {/* Project Overview Header */}
      <Card className="border-slate-200 p-6 sm:p-8 space-y-5 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-saffron-800 bg-civic-saffron-50 px-2.5 py-0.5 rounded-full border border-civic-saffron-200 flex items-center gap-1">
              <Target className="w-3.5 h-3.5" /> Action Initiative
            </span>
            <span className="text-xs text-slate-400 font-mono font-medium">{project.id}</span>
          </div>
          <StatusChip status={project.status === 'completed' ? 'completed' : 'active'} />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            {project.title}
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {project.civicObjective}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Milestone Execution Progress</span>
            <span className="text-civic-saffron-700 font-bold">
              {completedMilestonesCount} of {totalMilestonesCount} Completed ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-civic-saffron-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {project.outcomesSummary && (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <span className="font-bold flex items-center gap-1 text-emerald-800">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Current Status & Outcomes:
            </span>
            <p className="leading-relaxed">{project.outcomesSummary}</p>
          </div>
        )}
      </Card>

      {/* Accessible Action Team Seats */}
      <ProjectTeamSeats
        teamMembers={teamMembers}
        leadUserId={project.leadUserId}
        projectId={project.id}
        projectTitle={project.title}
      />

      {/* Three-Column Milestone & Task Board */}
      <ProjectBoard
        milestones={project.milestones}
        isUpdating={isUpdating}
        onCompleteMilestone={handleCompleteMilestone}
        projectStatus={project.status}
      />

      {/* Grid: Mock Evidence & Team Updates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Linked Evidence Section */}
        <Card className="border-slate-200 p-5 space-y-4 bg-white shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-civic-teal-600" />
                <span>Field Evidence & Audits ({evidenceList.length})</span>
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAttachModalOpen(true)}
                className="text-xs h-7 px-2.5"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Attach Evidence</span>
              </Button>
            </div>

            {evidenceList.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
                No field evidence attached to this project yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {evidenceList.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">{ev.title}</span>
                      <StatusChip status={ev.verificationStatus} />
                    </div>
                    <p className="text-slate-500 line-clamp-2">{ev.description}</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span>Owner: {ev.ownerName}</span>
                      <span className="capitalize">{ev.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Field audits provide factual justification for Nagar Nigam and traffic police deputations.
          </p>
        </Card>

        {/* Team Discussion & Notes Section */}
        <Card className="border-slate-200 p-5 space-y-4 bg-white shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-civic-indigo-600" />
                <span>Team Action Notes ({project.notes?.length || 0})</span>
              </h2>
            </div>

            {/* Notes stream */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(!project.notes || project.notes.length === 0) ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
                  No notes recorded yet. Add coordination updates below.
                </div>
              ) : (
                project.notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/40 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{note.authorName}</span>
                      <span className="text-[10px] text-slate-400">{formatRelativeTime(note.createdAt)}</span>
                    </div>
                    <p className="text-slate-600 whitespace-pre-line leading-relaxed">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-100">
              <Textarea
                placeholder="Log team progress note or municipal meeting update..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={2}
                className="text-xs"
                required
              />
              <div className="flex justify-end">
                <Button size="sm" variant="primary" type="submit" isLoading={isAddingNote}>
                  <span>Add Note</span>
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>

      {/* Attach Evidence Modal */}
      <Modal
        isOpen={isAttachModalOpen}
        onClose={() => setIsAttachModalOpen(false)}
        title="Attach Field Evidence to Project"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Select one of your verified or submitted evidence records to support this project's municipal submission.
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {userEvidence.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No evidence found in your personal repository.</p>
            ) : (
              userEvidence.map((ev) => (
                <label
                  key={ev.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    selectedEvidenceId === ev.id
                      ? 'border-civic-teal-600 bg-civic-teal-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="evidence"
                    checked={selectedEvidenceId === ev.id}
                    onChange={() => setSelectedEvidenceId(ev.id)}
                    className="mt-0.5 text-civic-teal-600"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900">{ev.title}</h4>
                    <p className="text-slate-500 mt-0.5">{ev.description}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Status: {ev.verificationStatus}</span>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button size="sm" variant="outline" onClick={() => setIsAttachModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={!selectedEvidenceId}
              onClick={handleAttachEvidence}
            >
              Attach to Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
