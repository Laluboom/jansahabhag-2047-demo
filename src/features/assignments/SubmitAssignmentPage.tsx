import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Assignment, Evidence, Submission, EvidenceType, Visibility } from '../../types/domain';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea, Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Save,
  Clock,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Upload,
  X,
  Flag,
  ExternalLink,
} from 'lucide-react';
import {
  NO_RECORDING_RULE_TITLE,
  FACE_CONSENT_WARNING_TEXT,
  ALLOWED_EVIDENCE_FORMAT_LABELS,
  MAX_EVIDENCE_FILE_BYTES,
  BINARY_ATTACHMENT_SIZE_LABEL,
  ALLOWED_BINARY_FORMAT_LABELS,
  validateEvidenceAttachmentFile,
} from '../../domain/evidenceRules';
import { EvidenceAttachmentStore } from '../../services/evidenceAttachmentStore';
import { generateId } from '../../utils/id';

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

  // Autosave indicators
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const lastSavedRef = useRef<{ content: string; evidenceIds: string[] }>({ content: '', evidenceIds: [] });
  const isInitialLoadRef = useRef(true);

  const isUhv = Boolean(
    assignment?.assignmentType === 'uhv_reflection' ||
    id === 'asg_uhv_08' ||
    id?.startsWith('asg_uhv_') ||
    assignment?.courseId === 'course_uhv_leadership_05'
  );

  // Evidence modal state
  const [isAddEvidenceModalOpen, setIsAddEvidenceModalOpen] = useState(false);
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvType, setNewEvType] = useState<EvidenceType>('observation');
  const [newEvTime, setNewEvTime] = useState('7:45 AM - 8:15 AM');
  const [newEvDesc, setNewEvDesc] = useState('');
  const [newEvLocation, setNewEvLocation] = useState('Navchetna School Crossing, Madhyam Marg, Jaipur');
  const [newEvSource, setNewEvSource] = useState('Direct Student Field Observation');
  const [newEvVisibility, setNewEvVisibility] = useState<Visibility>('private');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
  } | null>(null);
  const [selectedRawBlob, setSelectedRawBlob] = useState<Blob | File | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isCreatingEvidence, setIsCreatingEvidence] = useState(false);

  // Moderation Report Modal State (Review Additions 3 & V2 Evidence Rules)
  const [reportModalData, setReportModalData] = useState<{
    targetId: string;
    targetTitle: string;
    targetType: 'evidence' | 'submission';
  } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSeverity, setReportSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccessMessage, setReportSuccessMessage] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

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

  const watchedEvidenceIds = watch('evidenceIds');
  const selectedEvidenceIds = useMemo(() => watchedEvidenceIds || [], [watchedEvidenceIds]);
  const currentContent = watch('content') || '';

  // Load assignment and submissions
  useEffect(() => {
    async function load() {
      if (!id || !currentUser) return;
      setIsLoading(true);
      isInitialLoadRef.current = true;
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
          const loadedContent = sub.content || '';
          const loadedEvIds = sub.evidenceIds || [];
          reset({
            content: loadedContent,
            evidenceIds: loadedEvIds,
          });
          lastSavedRef.current = {
            content: loadedContent,
            evidenceIds: [...loadedEvIds],
          };
          if (sub.status === 'draft') {
            setAutosaveStatus('saved');
            if (sub.updatedAt) {
              setAutosavedAt(
                new Date(sub.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              );
            }
          }
        } else {
          reset({
            content: '',
            evidenceIds: [],
          });
          lastSavedRef.current = { content: '', evidenceIds: [] };
          setAutosaveStatus('idle');
          setAutosavedAt(null);

          if (evs.length > 0 && asg?.requiredEvidenceType) {
            const matching = evs.find((e) => e.type === asg.requiredEvidenceType);
            if (matching) {
              setValue('evidenceIds', [matching.id]);
              lastSavedRef.current.evidenceIds = [matching.id];
            }
          }
        }
      } catch (err) {
        console.error('Failed to load submit screen', err);
      } finally {
        setIsLoading(false);
        isInitialLoadRef.current = false;
      }
    }
    load();
  }, [id, currentUser, reset, setValue]);

  // Debounced Autosave Effect: saves nonempty response after short idle period
  useEffect(() => {
    if (isInitialLoadRef.current || !id || !currentUser || isLoading) return;

    // Do NOT autosave if item is already submitted / under_review / verified
    if (
      existingSubmission &&
      (existingSubmission.status === 'submitted' ||
        existingSubmission.status === 'under_review' ||
        existingSubmission.status === 'verified')
    ) {
      return;
    }

    const trimmedContent = currentContent.trim();
    // Only autosave nonempty response or selected evidence; never fabricated filler text
    if (!trimmedContent && selectedEvidenceIds.length === 0) {
      return;
    }

    const contentUnchanged = currentContent === lastSavedRef.current.content;
    const evidenceUnchanged =
      selectedEvidenceIds.length === lastSavedRef.current.evidenceIds.length &&
      selectedEvidenceIds.every((eid) => lastSavedRef.current.evidenceIds.includes(eid));

    if (contentUnchanged && evidenceUnchanged) {
      return;
    }

    setAutosaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const savedSub = await demoRepository.saveAssignmentDraft({
          assignmentId: id,
          userId: currentUser.id,
          content: currentContent,
          evidenceIds: isUhv ? [] : selectedEvidenceIds,
        });
        setExistingSubmission(savedSub);
        lastSavedRef.current = {
          content: currentContent,
          evidenceIds: [...selectedEvidenceIds],
        };
        setAutosaveStatus('saved');
        setAutosavedAt(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
        setDraftError(null);
      } catch (err: unknown) {
        console.error('Autosave failed', err);
        setAutosaveStatus('error');
        const message = err instanceof Error ? err.message : 'Failed to autosave draft';
        setDraftError(message);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [id, currentUser, currentContent, selectedEvidenceIds, existingSubmission, isUhv, isLoading]);

  const toggleEvidence = (eid: string) => {
    const current = selectedEvidenceIds;
    const updated = current.includes(eid)
      ? current.filter((x) => x !== eid)
      : [...current, eid];
    setValue('evidenceIds', updated, { shouldValidate: true });
  };

  const handleSaveDraft = async () => {
    if (!id || !currentUser) return;
    if (
      existingSubmission &&
      (existingSubmission.status === 'submitted' ||
        existingSubmission.status === 'under_review' ||
        existingSubmission.status === 'verified')
    ) {
      setDraftError(`Cannot modify submission with status '${existingSubmission.status}'`);
      return;
    }

    if (!currentContent.trim() && selectedEvidenceIds.length === 0) {
      setDraftError('Please enter notes or select evidence before saving a draft.');
      return;
    }

    setIsSavingDraft(true);
    setDraftError(null);
    try {
      const savedSub = await demoRepository.saveAssignmentDraft({
        assignmentId: id,
        userId: currentUser.id,
        content: currentContent,
        evidenceIds: isUhv ? [] : selectedEvidenceIds,
      });
      setExistingSubmission(savedSub);
      lastSavedRef.current = {
        content: currentContent,
        evidenceIds: [...selectedEvidenceIds],
      };
      setAutosaveStatus('saved');
      setAutosavedAt(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      triggerRefresh();
      navigate(`/assignments/${id}`);
    } catch (err: unknown) {
      console.error('Failed to save draft', err);
      const message = err instanceof Error ? err.message : 'Failed to save draft';
      setDraftError(message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const onSubmit = async (data: SubmissionFormData) => {
    if (!id || !currentUser) return;
    setIsSubmitting(true);
    setDraftError(null);
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
    } catch (err: unknown) {
      console.error('Failed to submit assignment', err);
      const message = err instanceof Error ? err.message : 'Failed to submit assignment';
      setDraftError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    if (!file) {
      setSelectedFile(null);
      setSelectedRawBlob(null);
      return;
    }

    // Check file format & size limits for IndexedDB binary storage (or legacy DataURL fallback)
    const validation = validateEvidenceAttachmentFile(file);
    if (!validation.valid) {
      // Legacy CSV / TXT / WebP check
      const isLegacyFormat = ['image/webp', 'text/plain', 'text/csv'].includes(file.type);
      if (isLegacyFormat) {
        if (file.size > MAX_EVIDENCE_FILE_BYTES) {
          setFileError(
            `File size (${(file.size / 1024).toFixed(1)} KB) exceeds conservative browser storage limit of 250 KB. Please select a smaller file.`
          );
          setSelectedFile(null);
          setSelectedRawBlob(null);
          return;
        }
      } else {
        setFileError(validation.error || `Unsupported file type. Please select a ${ALLOWED_BINARY_FORMAT_LABELS} file.`);
        setSelectedFile(null);
        setSelectedRawBlob(null);
        return;
      }
    }

    setSelectedRawBlob(file);
    let objectUrl: string | undefined = undefined;
    if (typeof window !== 'undefined' && window.URL && typeof window.URL.createObjectURL === 'function') {
      try {
        objectUrl = window.URL.createObjectURL(file);
        setPreviewBlobUrl(objectUrl);
      } catch {
        // fallback
      }
    }

    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: objectUrl,
    });
  };

  const handleUseOfflineCleanupExample = () => {
    setNewEvTitle('Community Park & Storm Drain Local Cleanup Photo');
    setNewEvDesc(
      'Field photo captured during offline youth-led community cleanup at Mansarovar Sector 3 park and storm drain, collecting 42 kg of segregated plastic waste.'
    );
    setNewEvType('image');
    setNewEvSource('Offline Community Action Field Log');
    setNewEvLocation('Mansarovar Sector 3 Public Park & Drain, Jaipur');
    setNewEvTime('Offline Fieldwork (Sunday 7:30 AM - 9:30 AM)');

    // Create a mock binary blob (approx 2.4 MB) to demonstrate truthful browser-local IndexedDB persistence
    const mockBlob = new Blob(
      ['PNG_MOCK_CLEANUP_PHOTO_BINARY_DATA_PAYLOAD'.repeat(60000)],
      { type: 'image/png' }
    );
    setSelectedRawBlob(mockBlob);
    setSelectedFile({
      name: 'fictional_local_cleanup_photo.png',
      size: 2457600,
      type: 'image/png',
    });
    setFileError(null);
  };

  const handleCreateMockEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newEvTitle.trim() || !newEvDesc.trim()) return;

    setFileError(null);
    setIsCreatingEvidence(true);
    try {
      let blobKey: string | undefined = undefined;
      if (selectedRawBlob && selectedFile) {
        blobKey = generateId('blob_ev');
        await EvidenceAttachmentStore.saveAttachment(blobKey, selectedRawBlob, {
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileSize: selectedFile.size,
        });
      }

      const created = await demoRepository.addEvidence({
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        type: newEvType,
        title: newEvTitle.trim(),
        description: newEvDesc.trim(),
        source: newEvSource.trim() || 'Direct Field Observation',
        location: newEvLocation.trim() || 'Navchetna School Crossing, Madhyam Marg, Jaipur',
        visibility: newEvVisibility,
        verificationStatus: 'under_review',
        tags: ['Student Evidence', 'Fieldwork', newEvType],
        assignmentId: id,
        observationTime: newEvTime.trim() || undefined,
        fileInfo: selectedFile
          ? {
              name: selectedFile.name,
              size: selectedFile.size,
              type: selectedFile.type,
              blobKey,
              storageType: 'indexeddb',
              demoLabel: 'Browser-local IndexedDB binary attachment (DEMO)',
            }
          : undefined,
        metadata: {
          isDemoSimulation: true,
          demoNotice: 'Single-browser simulation - stored in browser storage (IndexedDB)',
          storageEngine: 'IndexedDB (Browser-Local)',
          ...(selectedFile
            ? { fileName: selectedFile.name, fileSize: selectedFile.size }
            : { demoDescriptionOnly: true }),
        },
      });

      setAvailableEvidence((prev) => [created, ...prev]);
      setValue('evidenceIds', [...selectedEvidenceIds, created.id], { shouldValidate: true });

      // Reset modal fields
      setNewEvTitle('');
      setNewEvDesc('');
      setSelectedFile(null);
      setSelectedRawBlob(null);
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      setFileError(null);
      setIsAddEvidenceModalOpen(false);
    } catch (err: unknown) {
      console.error('Failed to add evidence', err);
      const message = err instanceof Error ? err.message : 'Storage error: Failed to save evidence to browser storage.';
      setFileError(message);
    } finally {
      setIsCreatingEvidence(false);
    }
  };

  const handleOpenReportModal = (
    targetId: string,
    targetTitle: string,
    targetType: 'evidence' | 'submission'
  ) => {
    setReportModalData({ targetId, targetTitle, targetType });
    setReportReason('');
    setReportSeverity('medium');
    setReportError(null);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalData || !currentUser) return;
    const trimmed = reportReason.trim();
    if (trimmed.length < 3) {
      setReportError('Please provide a specific reason for reporting (at least 3 characters).');
      return;
    }

    setIsSubmittingReport(true);
    setReportError(null);
    try {
      await demoRepository.reportEvidenceOrSubmission({
        reporterId: currentUser.id,
        targetType: reportModalData.targetType,
        targetId: reportModalData.targetId,
        reason: trimmed,
        severity: reportSeverity,
      });
      setReportSuccessMessage(
        `Report submitted to moderation queue for ${reportModalData.targetType}: "${reportModalData.targetTitle}".`
      );
      setReportModalData(null);
      setReportReason('');
      triggerRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit moderation report.';
      setReportError(message);
    } finally {
      setIsSubmittingReport(false);
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
  const isAlreadySubmitted =
    existingSubmission?.status === 'submitted' ||
    existingSubmission?.status === 'under_review' ||
    existingSubmission?.status === 'verified';

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
                Personal Study Stream &bull; 0 Civic Credit Points
              </span>
            ) : (
              <span className="text-xs font-semibold text-civic-saffron-700 bg-civic-saffron-50 px-2.5 py-0.5 rounded border border-civic-saffron-200">
                +{assignment.creditsReward} Civic Credit Points on Verification
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

        {/* Autosave Status Header Notification */}
        <div className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2" role="status" aria-live="polite">
            {autosaveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 text-civic-indigo-600 font-medium">
                <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-civic-indigo-600" />
                Autosaving draft...
              </span>
            )}
            {autosaveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Draft autosaved locally {autosavedAt ? `at ${autosavedAt}` : ''}
              </span>
            )}
            {autosaveStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {draftError || 'Failed to autosave draft'}
              </span>
            )}
            {autosaveStatus === 'idle' && (
              <span className="text-slate-500">
                Edits autosave locally after typing.
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Persona: {currentUser?.name}
          </span>
        </div>

        {/* Success Feedback Alert */}
        {reportSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-2" role="status">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{reportSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setReportSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Guard warning if already submitted and not in revision mode */}
        {isAlreadySubmitted && !isRevision && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Submission Already Recorded
            </span>
            <p className="leading-relaxed">
              This assignment is currently <strong>{existingSubmission?.status}</strong> and cannot be overwritten by a draft. View your submission details or wait for teacher feedback.
            </p>
            {!isUhv && existingSubmission && (
              <div className="pt-1 border-t border-amber-200/60 flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleOpenReportModal(
                      existingSubmission.id,
                      assignment?.title || 'Assignment Submission',
                      'submission'
                    )
                  }
                  className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800"
                  data-testid="btn-report-submission"
                >
                  <Flag className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  <span>Report Submission</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Guard warning if assignment is archived / closed */}
        {assignment?.status === 'archived' && (
          <div
            data-testid="assignment-archived-banner"
            className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 text-xs space-y-2"
          >
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
              <Clock className="w-4 h-4 text-slate-500" />
              Assignment Inactive / Archived
            </span>
            <p className="leading-relaxed">
              This assignment has been archived or closed and is no longer accepting submissions.
            </p>
          </div>
        )}

        {/* UHV Single-browser Simulation Disclosure */}
        {isUhv && (
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-1.5 text-xs">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Private Reflection Boundary (Single-Browser Simulation)
            </span>
            <p className="text-blue-800 leading-relaxed">
              This reflection invites personal understanding, perspectives, and questions. It is private to your browser simulation session, carries no ideological criteria, numeric scoring, or Civic Credit Points, and is not submitted to teacher grading queues. Mentor feedback is unavailable in this simulation.
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

        {draftError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{draftError}</span>
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

              {/* Point-of-use Media & Consent Notice */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Field Evidence Rules: {NO_RECORDING_RULE_TITLE}</span>
                </div>
                <p className="text-[11px] text-amber-950 leading-relaxed">
                  Recording is strictly off by default during all sessions and fieldwork. <strong>{FACE_CONSENT_WARNING_TEXT}</strong> All new evidence is private by default.
                </p>
                <div className="pt-1 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-amber-800">Operating standards apply to all evidence uploads.</span>
                  <Link
                    to="/help"
                    className="font-semibold text-civic-indigo-700 hover:text-civic-indigo-900 underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-civic-indigo-500 rounded"
                    data-testid="submit-evidence-rulebook-link"
                  >
                    <span>Full Rulebook</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

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
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1" role="group" aria-label="Available evidence selection list">
                  {availableEvidence.map((ev) => {
                    const isSelected = selectedEvidenceIds.includes(ev.id);
                    const isMatchingType = ev.type === assignment.requiredEvidenceType;

                    return (
                      <div
                        key={ev.id}
                        className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all focus-within:ring-2 focus-within:ring-civic-indigo-500 ${
                          isSelected
                            ? 'border-civic-indigo-500 bg-civic-indigo-50/60 shadow-2xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <label
                          htmlFor={`evidence-checkbox-${ev.id}`}
                          className="flex-1 min-w-0 pr-3 space-y-1 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate">{ev.title}</span>
                            {isMatchingType && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-medium shrink-0">
                                Matches Required
                              </span>
                            )}
                            {ev.fileInfo && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-medium shrink-0">
                                File: {ev.fileInfo.name} ({(ev.fileInfo.size / 1024).toFixed(1)} KB)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2">{ev.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                            <span>Type: <strong className="capitalize">{ev.type}</strong></span>
                            <span>&bull; {ev.source}</span>
                            {ev.observationTime && <span>&bull; Time: {ev.observationTime}</span>}
                            {ev.location && <span>&bull; {ev.location}</span>}
                          </div>
                        </label>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOpenReportModal(ev.id, ev.title, 'evidence');
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Report this evidence item"
                            aria-label={`Report evidence ${ev.title}`}
                            data-testid={`btn-report-evidence-${ev.id}`}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="checkbox"
                            id={`evidence-checkbox-${ev.id}`}
                            checked={isSelected}
                            onChange={() => toggleEvidence(ev.id)}
                            className="w-4 h-4 rounded border-slate-300 text-civic-indigo-600 focus:ring-civic-indigo-500 cursor-pointer"
                            aria-label={`Attach evidence: ${ev.title}`}
                          />
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
              disabled={isSubmitting || (isAlreadySubmitted && !isRevision)}
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
                disabled={isSavingDraft || (isAlreadySubmitted && !isRevision) || assignment?.status === 'archived'}
              >
                <span>
                  {isUhv
                    ? 'Save Private Reflection'
                    : isRevision
                    ? 'Resubmit for Review'
                    : 'Submit for Verification'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Modal: Create Distinct Field Observation Record */}
      <Modal
        isOpen={isAddEvidenceModalOpen}
        onClose={() => setIsAddEvidenceModalOpen(false)}
        title="Log Field Evidence & Observation Record"
        description="Add a distinct structured field observation or document record to your civic evidence vault."
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <Input
              label="Observation Time Window"
              placeholder="e.g. 7:45 AM - 8:15 AM (Morning Influx)"
              value={newEvTime}
              onChange={(e) => setNewEvTime(e.target.value)}
            />
          </div>

          <Textarea
            label="Description & Quantitative Findings"
            placeholder="Document vehicle counts, observed pedestrian waiting times, specific hazard locations, or safety insights..."
            value={newEvDesc}
            onChange={(e) => setNewEvDesc(e.target.value)}
            rows={3}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Field Location / Crossroad"
              placeholder="e.g. Navchetna School Gate 1, Madhyam Marg, Jaipur"
              value={newEvLocation}
              onChange={(e) => setNewEvLocation(e.target.value)}
            />

            <Input
              label="Data Source / Field Methodology"
              placeholder="e.g. 30-minute tally log & GPS photos"
              value={newEvSource}
              onChange={(e) => setNewEvSource(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="new-evidence-visibility" className="block text-sm font-medium text-slate-700 mb-1">
              Sharing Scope & Privacy
            </label>
            <select
              id="new-evidence-visibility"
              aria-label="Sharing Scope & Privacy"
              value={newEvVisibility}
              onChange={(e) => setNewEvVisibility(e.target.value as Visibility)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-civic-indigo-500 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500/20"
            >
              <option value="private">Private Student Vault (Personal Study - Default)</option>
              <option value="assembly">Shared with Deliberation Chamber (Assembly & Debate)</option>
              <option value="public">Public Civic Evidence Record</option>
            </select>
          </div>

          {/* Local File Attachment */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700">
              Attach Local File (Image or Document)
            </label>

            {/* Concise Consent & Limit Warning Next to Picker */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Consent & File Limits</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed font-semibold">
                {FACE_CONSENT_WARNING_TEXT} {NO_RECORDING_RULE_TITLE}.
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Allowed formats: <strong>{ALLOWED_EVIDENCE_FORMAT_LABELS}</strong>. Actual file limit: <strong>250 KB</strong> (durable browser storage limit).
              </p>
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 space-y-1">
                <span className="font-bold text-emerald-900 block">
                  Browser-Local IndexedDB Binary Attachment Store
                </span>
                <span className="text-slate-600 block">
                  Accepts <strong>{ALLOWED_BINARY_FORMAT_LABELS}</strong> up to <strong>{BINARY_ATTACHMENT_SIZE_LABEL}</strong>. Binary media is stored directly in your local browser IndexedDB, avoiding large localStorage data URLs.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Select Local File (JPEG, PNG, MP4, MP3, PDF)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,audio/mpeg,audio/mp3,application/pdf,text/plain,text/csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>

              <button
                type="button"
                onClick={handleUseOfflineCleanupExample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 transition-colors"
                data-testid="btn-use-offline-cleanup-example"
              >
                <span>Use Offline Cleanup Photo Example</span>
              </button>

              {selectedFile && (
                <div className="flex items-center gap-2 p-1.5 px-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-semibold truncate max-w-[180px]">{selectedFile.name}</span>
                  <span className="text-[10px] text-blue-700 shrink-0">
                    {(selectedFile.size / (1024 * 1024) >= 1)
                      ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${(selectedFile.size / 1024).toFixed(1)} KB`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setSelectedRawBlob(null);
                      if (previewBlobUrl) {
                        URL.revokeObjectURL(previewBlobUrl);
                        setPreviewBlobUrl(null);
                      }
                    }}
                    className="text-blue-500 hover:text-blue-700 ml-1"
                    aria-label="Remove selected file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {selectedFile && selectedFile.dataUrl && selectedFile.type.startsWith('image/') && (
              <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg inline-block">
                <span className="text-[10px] text-slate-400 block mb-1">Local Image Preview:</span>
                <img
                  src={selectedFile.dataUrl}
                  alt="Local selected preview"
                  className="max-h-24 rounded border border-slate-300 object-cover"
                />
              </div>
            )}

            {selectedFile && selectedFile.type.startsWith('video/') && (
              <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg inline-block">
                <span className="text-[10px] text-slate-400 block mb-1">Local Video Attachment (MP4):</span>
                <span className="text-xs text-slate-700 font-semibold">{selectedFile.name}</span>
              </div>
            )}

            {selectedFile && selectedFile.type.startsWith('audio/') && (
              <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg inline-block">
                <span className="text-[10px] text-slate-400 block mb-1">Local Audio Attachment (MP3):</span>
                <span className="text-xs text-slate-700 font-semibold">{selectedFile.name}</span>
              </div>
            )}

            {fileError && (
              <p className="text-xs text-rose-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {fileError}
              </p>
            )}

            {!selectedFile && (
              <p className="text-[10px] text-slate-400 italic">
                Optional: If no file is attached, structured metadata will be recorded with DEMO description notice.
              </p>
            )}
          </div>

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

      {/* Modal: Report Civic Evidence or Submission to Moderation Queue */}
      {reportModalData && (
        <Modal
          isOpen={Boolean(reportModalData)}
          onClose={() => setReportModalData(null)}
          title={`Report Civic ${reportModalData.targetType === 'evidence' ? 'Evidence Item' : 'Submission'}`}
          description="Enter this item into the civic moderation queue for human reviewer audit."
        >
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase font-semibold text-[10px]">
                  Target {reportModalData.targetType}
                </span>
                <span className="font-mono text-slate-700 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">
                  {reportModalData.targetId}
                </span>
              </div>
              <p className="font-bold text-slate-900">{reportModalData.targetTitle}</p>
              <p className="text-slate-500 text-[11px]">
                Reporter: <strong>{currentUser?.name}</strong> (@{currentUser?.username || currentUser?.id})
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reason for Reporting
              </label>
              <textarea
                rows={3}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Explain why this content violates consent, privacy rules, or deliberative standards..."
                required
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                data-testid="input-report-reason"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Severity
              </label>
              <select
                value={reportSeverity}
                onChange={(e) => setReportSeverity(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                data-testid="select-report-severity"
              >
                <option value="low">Low - Formatting / Minor discrepancy</option>
                <option value="medium">Medium - Questionable metadata or missing consent</option>
                <option value="high">High - Severe privacy breach, unconsented faces, or harassment</option>
              </select>
            </div>

            {reportError && (
              <p className="text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {reportError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReportModalData(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingReport}
                disabled={!reportReason.trim() || reportReason.trim().length < 3}
                data-testid="btn-submit-report"
              >
                Submit Report to Queue
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
