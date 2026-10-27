import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Assignment, Submission, User, Course, Evidence } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { Tabs } from '../../components/ui/Tabs';
import { Avatar } from '../../components/ui/Avatar';
import { PointOfUseRulesButton } from '../../components/ui/PointOfUseRulesButton';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { EvidenceAttachmentStore } from '../../services/evidenceAttachmentStore';
import {
  ALLOWED_BINARY_FORMAT_LABELS,
  BINARY_ATTACHMENT_SIZE_LABEL,
  validateEvidenceAttachmentFile,
} from '../../domain/evidenceRules';
import { generateId } from '../../utils/id';
import {
  FileCheck2,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
  Compass,
  HeartHandshake,
  ChevronDown,
  BookOpen,
  Upload,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export const AssignmentsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [cohortEvidenceList, setCohortEvidenceList] = useState<Evidence[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Cohort Attachment Modal State
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [cohortDocType, setCohortDocType] = useState<'attendance_sheet' | 'completion_certificate'>('attendance_sheet');
  const [cohortId, setCohortId] = useState('cohort_vsc_grade12');
  const [cohortTitle, setCohortTitle] = useState('Virani Science College Civic Deliberation Workshop Attendance Sheet');
  const [cohortDescription, setCohortDescription] = useState('Signed attendance sheet verifying in-person presence at Ward 8 fieldwork workshop.');
  const [cohortAuditNotes, setCohortAuditNotes] = useState('Collected and countersigned by Teacher Shri Mayur Parmar on site.');
  const [selectedCohortParticipantIds, setSelectedCohortParticipantIds] = useState<string[]>(['VSC-S-001', 'VSC-S-002']);
  const [cohortFile, setCohortFile] = useState<File | null>(null);
  const [cohortFileError, setCohortFileError] = useState<string | null>(null);
  const [isAttachingCohort, setIsAttachingCohort] = useState(false);
  const [cohortAttachSuccess, setCohortAttachSuccess] = useState<string | null>(null);
  const [evidenceReviewComments, setEvidenceReviewComments] = useState<Record<string, string>>({});

  const isTeacher = currentUser?.role === 'teacher';

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const [asgs, subs, allUsers, allCourses, allEvs] = await Promise.all([
          demoRepository.getAssignments(),
          demoRepository.getSubmissions(isTeacher ? undefined : currentUser.id),
          demoRepository.getUsers(),
          demoRepository.getCourses(),
          demoRepository.getEvidenceList(),
        ]);
        setAssignments(asgs);
        setSubmissions(subs);
        setUsers(allUsers);
        setCourses(allCourses);
        setCohortEvidenceList(allEvs.filter((e) => e.metadata?.isCohortAttachment));
      } catch (err) {
        console.error('Failed to load assignments', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser, refreshKey, isTeacher]);

  const handleAttachCohortSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !cohortTitle.trim() || !cohortDescription.trim() || !cohortAuditNotes.trim()) return;
    if (selectedCohortParticipantIds.length === 0) {
      setCohortFileError('Please select at least one eligible participant in this cohort.');
      return;
    }

    setIsAttachingCohort(true);
    setCohortFileError(null);
    try {
      let blobKey: string | undefined = undefined;
      if (cohortFile) {
        blobKey = generateId('blob_cohort');
        await EvidenceAttachmentStore.saveAttachment(blobKey, cohortFile, {
          fileName: cohortFile.name,
          mimeType: cohortFile.type,
          fileSize: cohortFile.size,
        });
      }

      const res = await demoRepository.attachCohortEvidence({
        mentorId: currentUser.id,
        cohortId,
        participantIds: selectedCohortParticipantIds,
        documentType: cohortDocType,
        title: cohortTitle.trim(),
        description: cohortDescription.trim(),
        auditNotes: cohortAuditNotes.trim(),
        fileInfo: cohortFile
          ? {
              name: cohortFile.name,
              size: cohortFile.size,
              type: cohortFile.type,
              blobKey,
            }
          : undefined,
      });

      setCohortAttachSuccess(
        `Successfully attached records for ${res.evidenceItems.length} participants with Audit Record ID: ${res.auditRecord.id}. Records are stored as Under Review.`
      );
      setCohortFile(null);
      setIsCohortModalOpen(false);
      triggerRefresh();
    } catch (err: unknown) {
      console.error('Failed to attach cohort evidence', err);
      setCohortFileError(err instanceof Error ? err.message : 'Failed to attach cohort evidence.');
    } finally {
      setIsAttachingCohort(false);
    }
  };

  const handleReviewCohortEvidence = async (
    evidenceId: string,
    status: 'verified' | 'revision_requested'
  ) => {
    if (!currentUser) return;
    try {
      const comment =
        evidenceReviewComments[evidenceId] ||
        (status === 'verified'
          ? 'Verified cohort attendance and completion.'
          : 'Please provide additional cohort documentation.');
      await demoRepository.reviewEvidence({
        evidenceId,
        reviewerId: currentUser.id,
        status,
        comment,
      });
      triggerRefresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to review evidence');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  // Master PRD Scope F: Keep UHV reflections separate from general civic assignments
  // Derive UHV assignment & submission exclusion dynamically from course.track === 'uhv'
  const uhvCourseIds = new Set(
    courses.filter((c) => c.track === 'uhv').map((c) => c.id)
  );
  const assignmentCourseMap = new Map(assignments.map((a) => [a.id, a.courseId]));

  const civicAssignments = assignments.filter((a) => !uhvCourseIds.has(a.courseId));
  const civicSubmissions = submissions.filter((s) => {
    const courseId = assignmentCourseMap.get(s.assignmentId);
    return !courseId || !uhvCourseIds.has(courseId);
  });

  // 4 plain headings derived from actual courses that have civic assignments
  const activeCivicCourses = courses.filter(
    (c) => c.track !== 'uhv' && civicAssignments.some((a) => a.courseId === c.id)
  );

  const isAssignmentOverdue = (asg: Assignment, sub?: Submission) => {
    if (!asg.dueDate) return false;
    const isPast = new Date(asg.dueDate).getTime() < Date.now();
    const notFinished = !sub || sub.status === 'draft' || sub.status === 'revision_requested';
    return isPast && notFinished;
  };

  const isAssignmentPending = (sub?: Submission) => {
    return !!sub && (sub.status === 'submitted' || sub.status === 'under_review');
  };

  // Teacher perspective tabs & rendering
  if (isTeacher) {
    const teacherTabs = [
      { id: 'all', label: 'All Submissions', count: civicSubmissions.length },
      {
        id: 'needs_review',
        label: 'Needs Review',
        count: civicSubmissions.filter((s) => s.status === 'submitted' || s.status === 'under_review').length,
      },
      {
        id: 'cohort_evidence',
        label: 'Cohort Evidence & Audits',
        count: cohortEvidenceList.length,
      },
      {
        id: 'revision_requested',
        label: 'Revision Requested',
        count: civicSubmissions.filter((s) => s.status === 'revision_requested').length,
      },
      {
        id: 'verified',
        label: 'Verified',
        count: civicSubmissions.filter((s) => s.status === 'verified').length,
      },
      {
        id: 'assignments_list',
        label: 'Assignment Catalog',
        count: civicAssignments.length,
      },
    ];

    const filteredSubmissions = civicSubmissions.filter((s) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'needs_review') return s.status === 'submitted' || s.status === 'under_review';
      if (activeTab === 'revision_requested') return s.status === 'revision_requested';
      if (activeTab === 'verified') return s.status === 'verified';
      return true;
    });

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Teacher Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Institutional Teacher & Mentor Perspective</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
              Assignment Review Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Verify simulated student observations, field audits, and evidence submissions in this browser demo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              size="sm"
              onClick={() => setIsCohortModalOpen(true)}
              className="bg-civic-teal-700 hover:bg-civic-teal-800 text-white flex items-center gap-1.5"
              data-testid="btn-cohort-attach"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Attach Cohort Sheet/Certificate</span>
            </Button>
            <PointOfUseRulesButton
              moduleName="Assignments"
              triggerText="Review Rules"
              modalTitle="Field Evidence Review & Verification Rules"
              description="Standards for reviewing and verifying student civic field evidence."
              rules={[
                {
                  title: 'Observable Field Standards',
                  description: 'Submissions must record verifiable observations, counts, or dates from neighbourhood street audits.',
                },
                {
                  title: 'Consent & Privacy Protections',
                  description: 'Photos must not expose private vehicle registration plates, residential interiors, or identifiable faces without explicit consent.',
                },
                {
                  title: 'Submission Formats & Limits',
                  description: `Binary media attachments support ${ALLOWED_BINARY_FORMAT_LABELS} up to ${BINARY_ATTACHMENT_SIZE_LABEL} stored in browser-local IndexedDB. Pasted text or inline documents are limited to 250 KB to ensure durable storage.`,
                },
                {
                  title: 'Mentor Verification & Credit Points',
                  description: 'Verified civic assignments award +2 Contribution Civic Credit Points upon mentor review. Revision may be requested if criteria are unmet.',
                },
              ]}
              testId="teacher-assignments-rules-btn"
            />
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-right">
              <span className="text-xs font-bold text-amber-900 uppercase block">Pending Reviews</span>
              <span className="text-2xl font-extrabold text-amber-950 font-heading">
                {civicSubmissions.filter((s) => s.status === 'submitted' || s.status === 'under_review').length}
              </span>
            </div>
          </div>
        </div>

        {/* Visible Path to Activities */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-civic-indigo-950 uppercase tracking-wider block">
              Activities & Assignments Hub
            </span>
            <p className="text-slate-600">
              Field observations connect directly to simulated participatory action events. Review simulated student participation in the Activities Stream.
            </p>
          </div>
          <Link to="/activities" className="shrink-0">
            <Button size="sm" variant="outline">
              <Compass className="w-3.5 h-3.5 mr-1" />
              <span>View Activities Stream</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs tabs={teacherTabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Assignment Catalog Tab view - grouped by 4 plain course headings */}
        {activeTab === 'assignments_list' ? (
          <div className="space-y-8">
            {activeCivicCourses.map((course) => {
              const courseAsgs = civicAssignments.filter((a) => a.courseId === course.id);
              if (courseAsgs.length === 0) return null;

              return (
                <section key={course.id} className="space-y-3">
                  <h2 className="text-base sm:text-lg font-bold font-heading text-slate-800 flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-civic-indigo-600" />
                      <span>{course.code ? `${course.code}: ` : ''}{course.title}</span>
                    </span>
                    <span className="text-xs font-normal text-slate-500">
                      ({courseAsgs.length} {courseAsgs.length === 1 ? 'task' : 'tasks'})
                    </span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courseAsgs.map((asg) => {
                      const isExpanded = expandedIds.has(asg.id);
                      const subCount = civicSubmissions.filter((s) => s.assignmentId === asg.id).length;

                      return (
                        <Card key={asg.id} className="border-slate-200 p-4 sm:p-5 flex flex-col justify-between space-y-3">
                          <div className="space-y-2.5">
                            {/* Title & Status Chip First */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <CardTitle className="text-base font-bold text-slate-900 font-heading">
                                {asg.title}
                              </CardTitle>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100 shrink-0">
                                {asg.requiredEvidenceType}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span className="text-civic-saffron-700 font-semibold">
                                +{asg.creditsReward} Civic Credit Points
                              </span>
                              <span>&bull;</span>
                              <span>{subCount} student {subCount === 1 ? 'submission' : 'submissions'}</span>
                              {asg.dueDate && (
                                <>
                                  <span>&bull;</span>
                                  <span>Due {asg.dueDate.split('T')[0]}</span>
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleExpand(asg.id)}
                              aria-expanded={isExpanded}
                              aria-controls={`teacher-asg-${asg.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-civic-indigo-600 hover:text-civic-indigo-800 py-1"
                            >
                              <span>{isExpanded ? 'Hide Details' : 'Reveal Instructions & Rubric'}</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isExpanded && (
                              <div id={`teacher-asg-${asg.id}`} className="mt-2 pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                                <p className="leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                                  {asg.prompt}
                                </p>
                                {asg.rubric && asg.rubric.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="font-bold text-slate-700">Rubric:</span>
                                    {asg.rubric.map((r, i) => (
                                      <div key={i} className="flex justify-between text-[11px] text-slate-500">
                                        <span>• {r.criterion}</span>
                                        <span>{r.maxPoints} pts</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end">
                            <Link to={`/assignments/${asg.id}`}>
                              <Button size="sm" variant="outline">
                                <span>View Assignment Detail</span>
                                <ArrowRight className="w-3.5 h-3.5 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : activeTab === 'cohort_evidence' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong>Cohort Attachment Audit Records:</strong>
                <p className="mt-0.5">
                  Teachers and mentors can attach signed attendance registers or completion certificates on behalf of an eligible cohort. Records are held in <em>Under Review</em> status with an immutable audit record and are never automatically verified.
                </p>
              </div>
            </div>

            {cohortAttachSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <span>{cohortAttachSuccess}</span>
                <button
                  type="button"
                  onClick={() => setCohortAttachSuccess(null)}
                  className="text-emerald-600 hover:text-emerald-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {cohortEvidenceList.length === 0 ? (
              <Card className="p-8 text-center text-slate-500 text-xs">
                No cohort attendance or certificate records logged yet. Use "Attach Cohort Sheet/Certificate" to attach records on behalf of an eligible cohort.
              </Card>
            ) : (
              <div className="space-y-3">
                {cohortEvidenceList.map((ev) => {
                  const commentVal = evidenceReviewComments[ev.id] || '';

                  return (
                    <Card key={ev.id} className="p-5 border-slate-200 space-y-3 bg-white shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-civic-teal-50 text-civic-teal-800 border border-civic-teal-200">
                              {ev.id}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {ev.type}
                            </span>
                            <StatusChip status={ev.verificationStatus} />
                          </div>
                          <h3 className="text-base font-bold font-heading text-slate-900 mt-1">
                            {ev.title}
                          </h3>
                        </div>

                        <div className="text-right text-[11px] text-slate-400">
                          <span>Participant Owner: <strong>{ev.ownerName}</strong></span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {ev.description}
                      </p>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                        <div className="font-semibold text-slate-700 flex items-center justify-between">
                          <span>Audit Trail: {ev.metadata?.auditRecordId || 'N/A'}</span>
                          <span>Attached: {formatRelativeTime(ev.createdAt)}</span>
                        </div>
                        <div>Mentor: <strong>{ev.metadata?.attachedByMentorName || 'Teacher'}</strong></div>
                        <div>Audit Note: <em>"{ev.metadata?.auditNotes || 'Cohort record'}"</em></div>
                        {ev.fileInfo && (
                          <div className="pt-1 flex items-center gap-2 text-civic-teal-800 font-medium">
                            <FileText className="w-3.5 h-3.5" />
                            <span>File: {ev.fileInfo.name} ({(ev.fileInfo.size / 1024).toFixed(1)} KB)</span>
                            <span className="text-[10px] text-slate-400">[{ev.fileInfo.storageType || 'IndexedDB'}]</span>
                          </div>
                        )}
                      </div>

                      {/* Review & Verify Actions */}
                      {ev.verificationStatus === 'under_review' ? (
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <input
                            type="text"
                            placeholder="Add reviewer verification feedback..."
                            value={commentVal}
                            onChange={(e) =>
                              setEvidenceReviewComments((prev) => ({ ...prev, [ev.id]: e.target.value }))
                            }
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 flex-1"
                            data-testid={`input-comment-${ev.id}`}
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReviewCohortEvidence(ev.id, 'revision_requested')}
                              data-testid={`btn-revise-evidence-${ev.id}`}
                            >
                              <span>Request Revision</span>
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleReviewCohortEvidence(ev.id, 'verified')}
                              data-testid={`btn-verify-evidence-${ev.id}`}
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              <span>Verify (+1 Credit)</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-800">
                          <span className="font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Verified by {ev.metadata?.reviewedBy || 'Reviewer'}</span>
                          </span>
                          {ev.metadata?.reviewerComment && (
                            <span className="text-[11px] text-slate-500 italic">
                              "{ev.metadata.reviewerComment}"
                            </span>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Submissions Queue - Title and status chip first */
          <div className="space-y-3">
            {filteredSubmissions.length === 0 ? (
              <Card className="p-8 text-center text-slate-500 text-xs">
                No student submissions in this review category.
              </Card>
            ) : (
              filteredSubmissions.map((sub) => {
                const student = users.find((u) => u.id === sub.userId);
                const asg = civicAssignments.find((a) => a.id === sub.assignmentId);
                const isExpanded = expandedIds.has(sub.id);

                return (
                  <Card
                    key={sub.id}
                    hoverable
                    className="p-5 border-slate-200 flex flex-col justify-between gap-4 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <Avatar
                          src={student?.avatar}
                          alt={student?.name || 'Student'}
                          size="md"
                        />
                        <div className="space-y-1.5">
                          {/* Title and Status Chip First */}
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-heading">
                              {asg?.title || sub.assignmentId}
                            </h3>
                            <StatusChip status={sub.status} />
                            {(sub.status === 'submitted' || sub.status === 'under_review') && (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending Review</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-slate-800">{student?.name || 'Participant'}</span>
                            <span>&bull;</span>
                            <span>{student?.institutionName || 'Student'}</span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {sub.submittedAt ? formatRelativeTime(sub.submittedAt) : 'Draft'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-1 italic max-w-xl">
                            "{sub.content}"
                          </p>

                          <button
                            type="button"
                            onClick={() => toggleExpand(sub.id)}
                            aria-expanded={isExpanded}
                            aria-controls={`sub-details-${sub.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-civic-indigo-600 hover:text-civic-indigo-800 py-0.5"
                          >
                            <span>{isExpanded ? 'Hide Submission Text' : 'Reveal Full Student Evidence'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {isExpanded && (
                            <div id={`sub-details-${sub.id}`} className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                              <p className="leading-relaxed whitespace-pre-line">{sub.content}</p>
                              <div className="text-[11px] text-slate-400">
                                {sub.evidenceIds.length} evidence attachment(s)
                              </div>
                            </div>
                          )}

                          {sub.teacherFeedback && (
                            <div className="mt-2 p-2 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
                              Feedback: "{sub.teacherFeedback}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 self-end sm:self-center">
                        <Link to={`/assignments/${sub.assignmentId}?submissionId=${sub.id}`}>
                          <Button
                            size="sm"
                            variant={sub.status === 'submitted' || sub.status === 'under_review' ? 'primary' : 'outline'}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            <span>{sub.status === 'verified' ? 'View Review' : 'Review & Verify'}</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Cohort Attachment Modal */}
        <Modal
          isOpen={isCohortModalOpen}
          onClose={() => setIsCohortModalOpen(false)}
          title="Attach Cohort Attendance Sheet or Certificate"
        >
          <form onSubmit={handleAttachCohortSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Mentor Review Invariant</span>
              </span>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Attendance sheets and certificates attached on behalf of an eligible cohort are logged with an audit record and marked <strong>Under Review</strong>. They are <strong>never automatically verified</strong>. Independent review and verification are required before credits link to student passports.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Type
              </label>
              <select
                value={cohortDocType}
                onChange={(e) => setCohortDocType(e.target.value as 'attendance_sheet' | 'completion_certificate')}
                className="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white"
              >
                <option value="attendance_sheet">Attendance Sheet (In-person workshop / deliberation presence)</option>
                <option value="completion_certificate">Completion Certificate (Cohort module or fieldwork certificate)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Eligible Cohort Identifier
              </label>
              <Input
                value={cohortId}
                onChange={(e) => setCohortId(e.target.value)}
                placeholder="cohort_navchetna_grade12"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Eligible Cohort Participants
              </label>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5 max-h-36 overflow-y-auto text-xs">
                {users.filter((u) => u.role === 'participant').map((p) => {
                  const isChecked = selectedCohortParticipantIds.includes(p.id);
                  return (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCohortParticipantIds((prev) => [...prev, p.id]);
                          } else {
                            setSelectedCohortParticipantIds((prev) => prev.filter((id) => id !== p.id));
                          }
                        }}
                        className="rounded border-slate-300 text-civic-teal-600"
                      />
                      <span className="font-medium text-slate-800">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({p.id})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Title
              </label>
              <Input
                value={cohortTitle}
                onChange={(e) => setCohortTitle(e.target.value)}
                placeholder="Title of attendance record or certificate"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description & Context
              </label>
              <Textarea
                value={cohortDescription}
                onChange={(e) => setCohortDescription(e.target.value)}
                placeholder="Describe the deliberative workshop or cohort session"
                rows={2}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Audit Record Note <span className="text-rose-500">*</span>
              </label>
              <Textarea
                value={cohortAuditNotes}
                onChange={(e) => setCohortAuditNotes(e.target.value)}
                placeholder="Provide explicit audit notes explaining how attendance or completion was observed..."
                rows={2}
                required
              />
            </div>

            {/* Binary File Attachment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attach Attendance Sheet / Certificate File (IndexedDB Binary Store)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Choose File ({ALLOWED_BINARY_FORMAT_LABELS})</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,video/mp4,audio/mpeg,audio/mp3,application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setCohortFileError(null);
                      if (!f) {
                        setCohortFile(null);
                        return;
                      }
                      const val = validateEvidenceAttachmentFile(f);
                      if (!val.valid) {
                        setCohortFileError(val.error || 'Invalid file.');
                        setCohortFile(null);
                        return;
                      }
                      setCohortFile(f);
                    }}
                    className="sr-only"
                  />
                </label>
                {cohortFile && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span className="truncate max-w-[160px] font-semibold">{cohortFile.name}</span>
                    <span className="text-[10px] text-blue-600">({(cohortFile.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={() => setCohortFile(null)}
                      className="text-blue-500 hover:text-blue-700 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Limit: {BINARY_ATTACHMENT_SIZE_LABEL} ({ALLOWED_BINARY_FORMAT_LABELS}). Files are stored in browser-local IndexedDB.
              </span>
            </div>

            {cohortFileError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{cohortFileError}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCohortModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-civic-teal-700 hover:bg-civic-teal-800 text-white"
                disabled={isAttachingCohort || !cohortTitle.trim() || !cohortAuditNotes.trim()}
              >
                {isAttachingCohort ? 'Attaching & Creating Records...' : 'Attach Cohort Records (Under Review)'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // Participant perspective
  const participantTabs = [
    { id: 'all', label: 'All Assignments', count: civicAssignments.length },
    {
      id: 'active',
      label: 'Action Required',
      count: civicAssignments.filter((a) => {
        const sub = civicSubmissions.find((s) => s.assignmentId === a.id);
        return !sub || sub.status === 'draft' || sub.status === 'revision_requested';
      }).length,
    },
    {
      id: 'submitted',
      label: 'Under Review',
      count: civicAssignments.filter((a) => {
        const sub = civicSubmissions.find((s) => s.assignmentId === a.id);
        return sub && (sub.status === 'submitted' || sub.status === 'under_review');
      }).length,
    },
    {
      id: 'verified',
      label: 'Verified',
      count: civicAssignments.filter((a) => {
        const sub = civicSubmissions.find((s) => s.assignmentId === a.id);
        return sub && sub.status === 'verified';
      }).length,
    },
  ];

  const filteredAssignments = civicAssignments.filter((asg) => {
    const sub = civicSubmissions.find((s) => s.assignmentId === asg.id);
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return !sub || sub.status === 'draft' || sub.status === 'revision_requested';
    if (activeTab === 'submitted') return sub && (sub.status === 'submitted' || sub.status === 'under_review');
    if (activeTab === 'verified') return sub && sub.status === 'verified';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Field Evidence & Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Collect observable field data, traffic counts, and community interviews verified by mentors (fictional browser demo).
          </p>
        </div>
        <PointOfUseRulesButton
          moduleName="Assignments"
          triggerText="Evidence Rules"
          modalTitle="Field Evidence & Assignment Rules"
          description="Standards for collecting, submitting, and verifying field evidence."
          rules={[
            {
              title: 'Observable Field Standards',
              description: 'Submissions must record verifiable observations, counts, or dates from neighbourhood street audits.',
            },
            {
              title: 'Consent & Privacy Protections',
              description: 'Photos must not expose private vehicle registration plates, residential interiors, or identifiable faces without explicit consent.',
            },
            {
              title: 'Submission Formats & Limits',
              description: `Binary media attachments support ${ALLOWED_BINARY_FORMAT_LABELS} up to ${BINARY_ATTACHMENT_SIZE_LABEL} stored in browser-local IndexedDB. Pasted text or inline documents are limited to 250 KB to ensure durable storage.`,
            },
            {
              title: 'Mentor Verification & Credit Points',
              description: 'Verified civic assignments award +2 Contribution Civic Credit Points upon mentor review. Revision may be requested if criteria are unmet.',
            },
          ]}
          testId="assignments-rules-btn"
        />
      </div>

      {/* Visible Path to Activities (Master PRD §1, Item 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
        <div className="space-y-0.5">
          <span className="font-bold text-civic-indigo-950 uppercase tracking-wider block">
            Activities & Assignments Stream
          </span>
          <p className="text-slate-600">
            Log simulated participation hours, neighborhood observation audits, and collaborative field sessions.
          </p>
        </div>
        <Link to="/activities" className="shrink-0">
          <Button size="sm" variant="primary">
            <Compass className="w-3.5 h-3.5 mr-1" />
            <span>Explore Activities Stream</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* UHV Stream Isolation Notice - Scope F */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>UHV Stream Separation:</strong> Universal Human Values reflections are isolated from civic grading under Scope F. Fictional browser demo.
          </span>
        </div>
        <Link to="/uhv" className="shrink-0">
          <Button size="sm" variant="outline">
            <span>View UHV Stream</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs tabs={participantTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 4 Plain Headings from Actual Course Data */}
      <div className="space-y-8">
        {activeCivicCourses.map((course) => {
          const courseAssignments = filteredAssignments.filter((a) => a.courseId === course.id);
          if (courseAssignments.length === 0 && activeTab !== 'all') {
            return null;
          }

          return (
            <section key={course.id} className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold font-heading text-slate-800 flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-civic-indigo-600" />
                  <span>{course.code ? `${course.code}: ` : ''}{course.title}</span>
                </span>
                <span className="text-xs font-normal text-slate-500">
                  ({courseAssignments.length} {courseAssignments.length === 1 ? 'task' : 'tasks'})
                </span>
              </h2>

              {courseAssignments.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                  No assignments matching current filter in this course.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courseAssignments.map((asg) => {
                    const submission = civicSubmissions.find((s) => s.assignmentId === asg.id);
                    const isSubmitted = !!submission && submission.status !== 'draft';
                    const isDraft = submission?.status === 'draft';
                    const isRevision = submission?.status === 'revision_requested';
                    const isVerified = submission?.status === 'verified';
                    const isOverdue = isAssignmentOverdue(asg, submission);
                    const isPending = isAssignmentPending(submission);
                    const isExpanded = expandedIds.has(asg.id);

                    return (
                      <Card
                        key={asg.id}
                        hoverable
                        className="border-slate-200 p-4 sm:p-5 flex flex-col justify-between space-y-3 transition-all bg-white shadow-xs"
                      >
                        <div className="space-y-3">
                          {/* Title and Status Chip FIRST */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <CardTitle className="text-base font-bold text-slate-900 font-heading line-clamp-2">
                              {asg.title}
                            </CardTitle>
                            <div className="shrink-0">
                              {submission ? (
                                <StatusChip status={submission.status} />
                              ) : (
                                <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                                  Not Started
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Indicators: Overdue, Pending Review, UHV, Evidence Type, Credits, Due Date */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Overdue</span>
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Pending Review</span>
                              </span>
                            )}
                            <span className="text-[11px] font-semibold text-civic-indigo-700 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100 uppercase tracking-wider">
                              Type: {asg.requiredEvidenceType}
                            </span>
                            <span className="flex items-center gap-1 text-civic-saffron-700 font-semibold">
                              <Award className="w-3.5 h-3.5" />
                              +{asg.creditsReward} Civic Credit Points
                            </span>
                            {asg.dueDate && (
                              <span className="flex items-center gap-1 text-slate-500">
                                <Calendar className="w-3.5 h-3.5" />
                                Due {asg.dueDate.split('T')[0]}
                              </span>
                            )}
                          </div>

                          {/* Complete details reveal toggle */}
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => toggleExpand(asg.id)}
                              aria-expanded={isExpanded}
                              aria-controls={`asg-details-${asg.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-civic-indigo-600 hover:text-civic-indigo-800 transition-colors py-1 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500 rounded"
                            >
                              <span>{isExpanded ? 'Hide Full Details' : 'Reveal Complete Details'}</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isExpanded && (
                              <div id={`asg-details-${asg.id}`} className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-3">
                                <div className="space-y-1">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                                    Assignment Prompt & Instructions:
                                  </span>
                                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    {asg.prompt}
                                  </p>
                                </div>

                                {asg.rubric && asg.rubric.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                                      Rubric Evaluation Criteria:
                                    </span>
                                    <div className="space-y-1">
                                      {asg.rubric.map((r, i) => (
                                        <div key={i} className="flex items-start justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100">
                                          <div>
                                            <span className="font-semibold text-slate-800">{r.criterion}</span>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{r.description}</p>
                                          </div>
                                          <span className="text-xs font-bold text-civic-indigo-700 shrink-0 ml-2">
                                            {r.maxPoints} pts
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {isRevision && submission?.teacherFeedback && (
                                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                                    <span className="font-bold flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                      Teacher Requested Revisions:
                                    </span>
                                    <p className="italic text-rose-800">"{submission.teacherFeedback}"</p>
                                  </div>
                                )}

                                {isVerified && submission?.teacherFeedback && (
                                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                                    <span className="font-bold flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      Verified by Teacher:
                                    </span>
                                    <p className="italic text-emerald-800">"{submission.teacherFeedback}"</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions - Route to complete details */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <Link to={`/assignments/${asg.id}`} className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1">
                            <span>View Assignment Detail</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>

                          <div className="flex items-center gap-2">
                            {isRevision ? (
                              <Link to={`/assignments/${asg.id}/submit`}>
                                <Button size="sm" variant="danger">
                                  <span>Edit & Resubmit</span>
                                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                              </Link>
                            ) : isDraft ? (
                              <Link to={`/assignments/${asg.id}/submit`}>
                                <Button size="sm" variant="saffron">
                                  <span>Resume Draft</span>
                                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                              </Link>
                            ) : isSubmitted ? (
                              <Link to={`/assignments/${asg.id}`}>
                                <Button size="sm" variant={isVerified ? 'outline' : 'primary'}>
                                  <span>View Submission</span>
                                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                              </Link>
                            ) : (
                              <Link to={`/assignments/${asg.id}/submit`}>
                                <Button size="sm" variant="primary">
                                  <span>Submit Evidence</span>
                                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
