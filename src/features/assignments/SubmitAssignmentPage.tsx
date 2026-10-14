import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Assignment, Evidence, Submission, EvidenceType } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea, Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Save,
  Camera,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';

const buildSubmissionSchema = (isUhv: boolean) =>
  z.object({
    content: isUhv
      ? z.string().max(5000, 'Reflection notes cannot exceed 5000 characters.')
      : z
          .string()
          .min(20, 'Observation notes must be at least 20 characters long with specific field details.')
          .max(3000, 'Observation notes cannot exceed 3000 characters.'),
    evidenceIds: isUhv
      ? z.array(z.string()).default([])
      : z
          .array(z.string())
          .min(1, 'Please select or add at least one evidence record to support your submission.'),
  });

type SubmissionFormData = {
  content: string;
  evidenceIds: string[];
};

export const SubmitAssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { triggerRefresh } = useAppRefreshStore();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [availableEvidence, setAvailableEvidence] = useState<Evidence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isUhv = Boolean(
    assignment?.assignmentType === 'uhv_reflection' ||
    id === 'asg_uhv_08' ||
    id?.startsWith('asg_uhv_') ||
    assignment?.courseId === 'course_uhv_leadership_05'
  );

  // Mock evidence modal state
  const [isAddEvidenceModalOpen, setIsAddEvidenceModalOpen] = useState(false);
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvType, setNewEvType] = useState<EvidenceType>('observation');
  const [newEvDesc, setNewEvDesc] = useState('');
  const [newEvLocation, setNewEvLocation] = useState('');
  const [newEvSource, setNewEvSource] = useState('Direct Student Field Observation');
  const [isCreatingEvidence, setIsCreatingEvidence] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SubmissionFormData>({
    resolver: (values, context, options) =>
      zodResolver(buildSubmissionSchema(isUhv))(values, context, options),
    defaultValues: {
      content: '',
      evidenceIds: [],
    },
  });

  const selectedEvidenceIds = watch('evidenceIds') || [];
  const currentContent = watch('content') || '';

  useEffect(() => {
    async function load() {
      if (!id || !currentUser) return;
      setIsLoading(true);
      try {
        const [asg, evs, subs] = await Promise.all([
          demoRepository.getAssignment(id),
          demoRepository.getEvidenceList({ ownerId: currentUser.id }),
          demoRepository.getSubmissions(currentUser.id, id),
        ]);
        setAssignment(asg);
        setAvailableEvidence(evs);

        const sub = subs[0] || null;
        setExistingSubmission(sub);

        if (sub) {
          reset({
            content: sub.content || '',
            evidenceIds: sub.evidenceIds || [],
          });
        } else if (evs.length > 0) {
          // Pre-select first matching evidence type if available
          const matching = evs.find((e) => e.type === asg?.requiredEvidenceType);
          if (matching) {
            setValue('evidenceIds', [matching.id]);
          }
        }
      } catch (err) {
        console.error('Failed to load submit screen', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser, reset, setValue]);

  const toggleEvidence = (eid: string) => {
    const current = selectedEvidenceIds;
    const updated = current.includes(eid)
      ? current.filter((x) => x !== eid)
      : [...current, eid];
    setValue('evidenceIds', updated, { shouldValidate: true });
  };

  const handleSaveDraft = async () => {
    if (!id || !currentUser) return;
    setIsSavingDraft(true);
    try {
      await demoRepository.saveAssignmentDraft({
        assignmentId: id,
        userId: currentUser.id,
        content: currentContent.trim() || (isUhv ? 'Draft personal reflection notes...' : 'Draft observation notes in progress...'),
        evidenceIds: isUhv ? [] : selectedEvidenceIds,
      });
      triggerRefresh();
      navigate(`/assignments/${id}`);
    } catch (err) {
      console.error('Failed to save draft', err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const onSubmit = async (data: SubmissionFormData) => {
    if (!id || !currentUser) return;
    setIsSubmitting(true);
    try {
      await demoRepository.submitAssignment({
        assignmentId: id,
        userId: currentUser.id,
        content: data.content.trim(),
        evidenceIds: isUhv ? [] : data.evidenceIds,
        status: 'submitted',
      });
      triggerRefresh();
      navigate(`/assignments/${id}`);
    } catch (err) {
      console.error('Failed to submit assignment', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMockEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newEvTitle.trim() || !newEvDesc.trim()) return;

    setIsCreatingEvidence(true);
    try {
      const created = await demoRepository.addEvidence({
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        type: newEvType,
        title: newEvTitle.trim(),
        description: newEvDesc.trim(),
        source: newEvSource.trim() || 'Field Camera & Observation',
        location: newEvLocation.trim() || `${currentUser.institutionName} Zone, Jaipur`,
        visibility: 'assembly',
        verificationStatus: 'under_review',
        tags: ['Student Evidence', 'Fieldwork', newEvType],
      });

      // Update available list and automatically select newly created evidence
      setAvailableEvidence((prev) => [created, ...prev]);
      setValue('evidenceIds', [...selectedEvidenceIds, created.id], { shouldValidate: true });

      // Reset modal fields
      setNewEvTitle('');
      setNewEvDesc('');
      setNewEvLocation('');
      setIsAddEvidenceModalOpen(false);
    } catch (err) {
      console.error('Failed to add mock evidence', err);
    } finally {
      setIsCreatingEvidence(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading assignment submission portal">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-4">
        <Link
          to="/assignments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assignments Directory</span>
        </Link>
        <Card className="p-8 text-center space-y-4 border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-slate-900">Assignment Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Cannot submit evidence for assignment "{id}" because the record does not exist.
          </p>
          <div className="pt-2">
            <Button size="sm" variant="primary" onClick={() => navigate('/assignments')}>
              View All Assignments
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isRevision = existingSubmission?.status === 'revision_requested';
  const isDraft = existingSubmission?.status === 'draft';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        to={`/assignments/${id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Cancel and return to assignment details</span>
      </Link>

      <Card className="border-slate-200 p-6 sm:p-8 space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-600">
              {isUhv ? 'Personal Reflection & Inquiry (Private)' : 'Field Submission & Evidence Portal'}
            </span>
            {isUhv ? (
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                Personal Study Stream &bull; No Civic Credits
              </span>
            ) : (
              <span className="text-xs font-semibold text-civic-saffron-700 bg-civic-saffron-50 px-2.5 py-0.5 rounded border border-civic-saffron-200">
                +{assignment.creditsReward} Civic Credits on Submit
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 mt-1">
            {isUhv
              ? (isDraft ? 'Resume Private Reflection: ' : 'Personal Reflection: ') + assignment.title
              : (isRevision ? 'Revise Submission: ' : isDraft ? 'Resume Draft: ' : 'Submit: ') + assignment.title}
          </h1>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            {assignment.prompt}
          </p>
        </div>

        {/* UHV Single-browser Simulation Disclosure */}
        {isUhv && (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-1.5 text-xs">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Private Reflection Boundary (Single-Browser Simulation)
            </span>
            <p className="text-blue-800 leading-relaxed">
              This reflection invites personal understanding, perspectives, and questions. It is private to your browser simulation session, carries no ideological criteria, numeric scoring, or Civic Credits, and is not submitted to teacher grading queues. Mentor feedback is unavailable in this simulation.
            </p>
          </div>
        )}

        {/* Teacher Revision Alert if revising */}
        {isRevision && existingSubmission?.teacherFeedback && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
            <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Teacher's Revision Feedback to Address:
            </span>
            <p className="text-xs text-rose-800 leading-relaxed italic">
              "{existingSubmission.teacherFeedback}"
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Content Field */}
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                label={isUhv ? 'Your Personal Reflection & Inquiry Notes' : 'Field Observation Notes & Data Log'}
                placeholder={
                  isUhv
                    ? 'Write your personal reflections, observations, or questions freely. No minimum word count or ideological agreement is required...'
                    : 'Record structured observation breakdown, timestamps (e.g. 7:45 - 8:15 AM), peak vehicle count, pedestrian delays, or interview quotes...'
                }
                rows={7}
                error={errors.content?.message}
                helperText={
                  isUhv
                    ? 'Private to your local study record. You may write freely or leave notes in progress.'
                    : 'Include objective counts, location context, and observations aligned with the assessment rubric.'
                }
              />
            )}
          />

          {/* Evidence Notice for UHV */}
          {isUhv && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500">
              Personal reflections are exploratory inquiries. No field evidence records or document attachments are required.
            </div>
          )}

          {/* Select / Create Attached Evidence Section (Civic Assignments Only) */}
          {!isUhv && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-900">
                    Attach Field Evidence Records ({selectedEvidenceIds.length} selected)
                  </label>
                  <p className="text-xs text-slate-500">
                    Required evidence type: <strong>{assignment.requiredEvidenceType}</strong>
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (assignment.requiredEvidenceType) {
                      setNewEvType(assignment.requiredEvidenceType);
                    }
                    setIsAddEvidenceModalOpen(true);
                  }}
                  className="shrink-0 text-civic-indigo-700 border-civic-indigo-200 bg-civic-indigo-50/50 hover:bg-civic-indigo-100 text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Log New Mock Evidence</span>
                </Button>
              </div>

              {errors.evidenceIds && (
                <p className="text-xs font-medium text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.evidenceIds.message}
                </p>
              )}

              {availableEvidence.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center space-y-2 bg-slate-50">
                  <p className="text-xs text-slate-500">No field evidence records found in your vault.</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => setIsAddEvidenceModalOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Create First Evidence Record</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {availableEvidence.map((ev) => {
                    const isSelected = selectedEvidenceIds.includes(ev.id);
                    const isMatchingType = ev.type === assignment.requiredEvidenceType;

                    return (
                      <div
                        key={ev.id}
                        onClick={() => toggleEvidence(ev.id)}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-civic-indigo-500 bg-civic-indigo-50/60 ring-1 ring-civic-indigo-500 shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-3 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate">{ev.title}</span>
                            {isMatchingType && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-medium shrink-0">
                                Matches Required
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1">{ev.description}</p>
                          <span className="text-[10px] text-slate-400 block">
                            Type: <strong className="capitalize">{ev.type}</strong> &bull; {ev.source}
                          </span>
                        </div>

                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-civic-indigo-600 text-white'
                              : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              isLoading={isSavingDraft}
              disabled={isSubmitting}
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              <span>Save as Draft</span>
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate(`/assignments/${id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={isSavingDraft}
              >
                <span>
                  {isUhv
                    ? 'Save Private Reflection'
                    : isRevision
                    ? 'Resubmit for Review (+10 Credits)'
                    : 'Submit for Verification (+10 Credits)'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Modal: Create Mock Observation Evidence */}
      <Modal
        isOpen={isAddEvidenceModalOpen}
        onClose={() => setIsAddEvidenceModalOpen(false)}
        title="Log Field Evidence / Mock Observation"
        description="Add a structured observation record or photo evidence to your civic evidence repository."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateMockEvidence} className="space-y-4">
          <Input
            label="Evidence Title"
            placeholder="e.g. Madhyam Marg Peak-Hour Pedestrian Crossing Count"
            value={newEvTitle}
            onChange={(e) => setNewEvTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Evidence Type
            </label>
            <select
              value={newEvType}
              onChange={(e) => setNewEvType(e.target.value as EvidenceType)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-civic-indigo-500 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500/20"
            >
              <option value="observation">Direct Observation Log</option>
              <option value="image">Field Photo Evidence</option>
              <option value="document">Document / Safety Incident Report</option>
              <option value="interview">Peer / Commuter Interview</option>
              <option value="survey">Traffic / Hazard Survey</option>
            </select>
          </div>

          <Textarea
            label="Description & Quantitative Findings"
            placeholder="Document vehicle counts, observed pedestrian waiting times, specific hazard locations, or safety insights..."
            value={newEvDesc}
            onChange={(e) => setNewEvDesc(e.target.value)}
            rows={4}
            required
          />

          <Input
            label="Field Location / Coordinates"
            placeholder="e.g. Navchetna School Gate 1, Madhyam Marg, Jaipur"
            value={newEvLocation}
            onChange={(e) => setNewEvLocation(e.target.value)}
          />

          <Input
            label="Data Source / Audit Method"
            placeholder="e.g. 30-minute tally log & GPS photos"
            value={newEvSource}
            onChange={(e) => setNewEvSource(e.target.value)}
          />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddEvidenceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreatingEvidence}
              disabled={!newEvTitle.trim() || !newEvDesc.trim()}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Save & Attach Evidence</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

