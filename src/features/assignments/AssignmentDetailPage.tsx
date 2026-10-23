import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Assignment, Submission, Evidence, User } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { PointOfUseRulesButton } from '../../components/ui/PointOfUseRulesButton';
import { Textarea, Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import {
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  Edit3,
  Receipt,
  ExternalLink,
  MessageSquare,
  Download,
} from 'lucide-react';
import { formatRelativeTime, formatDateTime } from '../../utils/formatters';
import { canActorAccessPrivateEvidence } from '../../domain/evidenceRules';

export const AssignmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submissionIdParam = searchParams.get('submissionId');
  const receiptParam = searchParams.get('receipt');
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submittingUser, setSubmittingUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [attachedEvidence, setAttachedEvidence] = useState<Evidence[]>([]);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [scoreInput, setScoreInput] = useState<string>('25');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isTeacher = currentUser?.role === 'teacher';

  useEffect(() => {
    async function load() {
      if (!id || !currentUser) return;
      setIsLoading(true);
      try {
        const [asg, subs, users] = await Promise.all([
          demoRepository.getAssignment(id),
          demoRepository.getSubmissions(isTeacher ? undefined : currentUser.id, id),
          demoRepository.getUsers(),
        ]);
        setAssignment(asg);
        setAllSubmissions(subs);
        setAllUsers(users);

        let activeSub: Submission | null = null;
        if (isTeacher) {
          if (submissionIdParam) {
            activeSub = subs.find((s) => s.id === submissionIdParam) || subs[0] || null;
          } else {
            // Pick first pending or first submission
            activeSub = subs.find((s) => s.status === 'submitted' || s.status === 'under_review') || subs[0] || null;
          }
        } else {
          activeSub = subs.find((s) => s.userId === currentUser.id) || null;
        }

        setSubmission(activeSub);

        if (activeSub) {
          const student = users.find((u) => u.id === activeSub.userId) || null;
          setSubmittingUser(student);
          setFeedbackInput(activeSub.teacherFeedback || '');
          if (activeSub.score !== undefined) setScoreInput(String(activeSub.score));

          if (activeSub.evidenceIds && activeSub.evidenceIds.length > 0) {
            const evs = await Promise.all(
              activeSub.evidenceIds.map((eid) => demoRepository.getEvidence(eid))
            );
            setAttachedEvidence(evs.filter((e): e is Evidence => e !== null));
          } else {
            setAttachedEvidence([]);
          }
        } else {
          setSubmittingUser(null);
          setAttachedEvidence([]);
        }
      } catch (err) {
        console.error('Failed to load assignment detail', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser, refreshKey, isTeacher, submissionIdParam]);

  const handleSelectSubmission = (subId: string) => {
    setSearchParams({ submissionId: subId });
  };

  const handleTeacherReview = async (status: 'verified' | 'revision_requested') => {
    if (!submission || !currentUser) return;

    if (status === 'revision_requested' && !feedbackInput.trim()) {
      setFeedbackError('Please provide clear revision feedback explaining what needs to be improved.');
      return;
    }

    setFeedbackError(null);
    setIsReviewing(true);
    try {
      const parsedScore = scoreInput ? parseInt(scoreInput, 10) : (status === 'verified' ? 25 : undefined);
      await demoRepository.reviewSubmission({
        submissionId: submission.id,
        reviewerId: currentUser.id,
        status,
        teacherFeedback: feedbackInput.trim() || (status === 'verified' ? 'Verified. Excellent civic fieldwork observation.' : 'Please revise and resubmit.'),
        score: isNaN(parsedScore as number) ? undefined : parsedScore,
      });
      triggerRefresh();
    } catch (err: any) {
      console.error('Failed to review submission', err);
      setFeedbackError(err?.message || 'Failed to review submission');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleDownloadAttachment = async (ev: Evidence) => {
    if (!currentUser) return;
    try {
      const isAuthorized = canActorAccessPrivateEvidence(
        { id: currentUser.id, role: currentUser.role },
        ev,
        submission
          ? [
              {
                evidenceIds: [ev.id],
                reviewerId: submission.reviewerId,
                userId: submission.userId,
                assignmentId: submission.assignmentId,
              },
            ]
          : []
      );
      if (!isAuthorized) {
        alert('Unauthorized: You do not have permission to access or download this evidence attachment.');
        return;
      }

      if (ev.fileInfo?.blobKey) {
        const res = await demoRepository.getEvidenceAttachment(ev.id);
        if (res?.blobUrl) {
          const a = document.createElement('a');
          a.href = res.blobUrl;
          a.download = res.fileName || ev.fileInfo.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }
      }

      if (ev.fileInfo?.dataUrl) {
        const a = document.createElement('a');
        a.href = ev.fileInfo.dataUrl;
        a.download = ev.fileInfo.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to download attachment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading assignment details">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
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
            The requested field assignment "{id}" was not found in the repository.
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

  const isUhv = Boolean(
    assignment?.assignmentType === 'uhv_reflection' ||
    id === 'asg_uhv_08' ||
    id?.startsWith('asg_uhv_') ||
    assignment?.courseId === 'course_uhv_leadership_05'
  );

  const isDraft = submission?.status === 'draft';
  const isRevision = submission?.status === 'revision_requested';
  const isVerified = submission?.status === 'verified';
  const isPendingReview = submission?.status === 'submitted' || submission?.status === 'under_review';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/assignments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assignments Directory</span>
      </Link>

      {/* Assignment Overview Header Card */}
      <Card className="border-slate-200 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isUhv ? (
              <>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Personal Study Stream &bull; Private
                </span>
                <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  No Civic Credits (Non-Evaluative)
                </span>
              </>
            ) : (
              <>
                <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100">
                  Evidence Type: {assignment.requiredEvidenceType}
                </span>
                <span className="text-xs font-semibold text-civic-saffron-700 bg-civic-saffron-50 px-2 py-0.5 rounded border border-civic-saffron-200">
                  +{assignment.creditsReward} Civic Credits
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <PointOfUseRulesButton
              moduleName="Assignment"
              triggerText="Rules"
              modalTitle={isUhv ? "UHV Study Reflection Rules" : "Assignment Evidence Rules"}
              description={isUhv ? "Guidelines for personal values inquiry reflections." : "Verification and consent standards for this assignment."}
              rules={isUhv ? [
                {
                  title: 'Voluntary Self-Study Reflection',
                  description: 'This is a personal reflection prompt. Ideological agreement is not required or graded.',
                },
                {
                  title: 'No Credit Award',
                  description: 'UHV assignments carry 0 credits to keep reflection unpressured.',
                },
                {
                  title: 'Private Journal Isolation',
                  description: 'Stored locally and isolated from public review queues.',
                },
              ] : [
                {
                  title: 'Verifiable Field Observation',
                  description: `Submissions must fulfill the required ${assignment.requiredEvidenceType} evidence standard.`,
                },
                {
                  title: 'Consent & Face Privacy',
                  description: 'Do not upload unconsented faces or private vehicle license plates.',
                },
                {
                  title: 'Mentor Review & Credits',
                  description: `Earn +${assignment.creditsReward} Contribution Credits upon teacher mentor verification.`,
                },
              ]}
              testId="assignment-detail-rules-btn"
            />
            {submission && !isTeacher && (
              isUhv ? (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
                  {submission.status === 'draft' ? 'Draft Saved' : 'Reflection Recorded'}
                </span>
              ) : (
                <StatusChip status={submission.status} />
              )
            )}
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            {assignment.title}
          </h1>
          <p className="text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-line">
            {assignment.prompt}
          </p>
        </div>

        {/* UHV Simulation & Privacy Disclosure */}
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

        {/* Rubric Breakdown (Civic Assignments Only) */}
        {!isUhv && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Assessment Rubric & Criteria
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {assignment.rubric.map((r, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{r.criterion}</span>
                    <span className="text-civic-indigo-700">{r.maxPoints} pts</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Participant Action Buttons if not yet submitted */}
        {!submission && !isTeacher && (
          <div className="pt-3 flex items-center gap-3">
            {assignment.status === 'archived' ? (
              <div
                data-testid="assignment-archived-notice"
                className="p-3 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 text-xs flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>This assignment has been archived or closed and is no longer accepting submissions.</span>
              </div>
            ) : (
              <Link to={`/assignments/${assignment.id}/submit`}>
                <Button variant="primary" size="md">
                  <span>{isUhv ? 'Open Reflection Prompt' : 'Start Submission & Log Evidence'}</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </Card>

      {/* Teacher Perspective: Informational card if UHV, else Submission Selector */}
      {isTeacher && isUhv && (
        <Card className="border-blue-200 bg-blue-50/40 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Private Participant Reflection Stream</span>
          </div>
          <p className="text-xs text-blue-800 leading-relaxed">
            Universal Human Values reflections are personal and private to each participant. They carry no numeric scores, rubrics, or civic credit rewards, and are not accessible for teacher review or grading in this simulation.
          </p>
        </Card>
      )}

      {/* Teacher Perspective: Submission Selector (Civic Assignments Only) */}
      {isTeacher && !isUhv && allSubmissions.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/20 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Student Submissions for this Assignment ({allSubmissions.length})</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {allSubmissions.map((sub) => {
              const student = allUsers.find((u) => u.id === sub.userId);
              const isSelected = sub.id === submission?.id;

              return (
                <button
                  key={sub.id}
                  onClick={() => handleSelectSubmission(sub.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-civic-indigo-600 text-white border-civic-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Avatar
                    src={student?.avatar}
                    alt={student?.name || 'Student'}
                    size="sm"
                  />
                  <span>{student?.name || sub.userId}</span>
                  <StatusChip status={sub.status} />
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Submission Receipt Card (persists across reload and route change) */}
      {submission && !isDraft && (
        <Card className="border-civic-indigo-200 bg-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-civic-indigo-50 flex items-center justify-center text-civic-indigo-600">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Submission Receipt & Provenance Record
                </h2>
                <p className="text-[11px] text-slate-500">
                  Local browser simulation receipt linked to civic fieldwork evidence (DEMO)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                Receipt #{submission.receiptId || submission.id}
              </span>
              <StatusChip status={submission.status} />
            </div>
          </div>

          {(submission.status === 'submitted' || receiptParam === submission.id || receiptParam === (submission.receiptId || submission.id)) && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Submission confirmed! Receipt #{submission.receiptId || submission.id} has been recorded in local browser storage.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 py-1">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Submission ID</span>
              <p className="font-mono text-slate-800 truncate">{submission.id}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Timestamp</span>
              <p className="text-slate-800 font-medium">
                {submission.submittedAt ? formatDateTime(submission.submittedAt) : 'Draft'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Participant</span>
              <p className="text-slate-800 font-medium truncate">
                {submittingUser?.name || submission.userId}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Review Status</span>
              <p className="text-slate-800 font-semibold capitalize">
                {submission.status === 'submitted'
                  ? 'Pending Review'
                  : submission.status === 'verified'
                  ? 'Verified in Demo'
                  : submission.status.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Linked Evidence Section in Receipt */}
          {!isUhv && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Linked Evidence Records ({attachedEvidence.length})
              </h3>
              {attachedEvidence.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No evidence records linked to this receipt.</p>
              ) : (
                <div className="space-y-2">
                  {attachedEvidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900">{ev.title}</span>
                          <span className="font-mono text-[10px] text-slate-400">ID: {ev.id}</span>
                          <StatusChip status={ev.verificationStatus} />
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-1">{ev.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                          {ev.location && <span>Location: {ev.location}</span>}
                          {ev.observationTime && <span>Observed: {ev.observationTime}</span>}
                          {ev.fileInfo && (() => {
                            const isAuthorized = canActorAccessPrivateEvidence(
                              currentUser ? { id: currentUser.id, role: currentUser.role } : null,
                              ev,
                              submission
                                ? [
                                    {
                                      evidenceIds: [ev.id],
                                      reviewerId: submission.reviewerId,
                                      userId: submission.userId,
                                      assignmentId: submission.assignmentId,
                                    },
                                  ]
                                : []
                            );

                            return (
                              <span className="text-amber-800 font-medium flex items-center gap-1.5">
                                <span>File: {ev.fileInfo.name} ({Math.round(ev.fileInfo.size / 1024)} KB)</span>
                                {isAuthorized ? (
                                  ev.fileInfo.blobKey ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadAttachment(ev)}
                                      className="inline-flex items-center gap-1 text-[10px] text-civic-indigo-700 hover:text-civic-indigo-900 bg-white px-1.5 py-0.5 rounded border border-indigo-200"
                                      title="Download attachment from browser-local IndexedDB"
                                    >
                                      <Download className="w-2.5 h-2.5" />
                                      <span>Download</span>
                                    </button>
                                  ) : ev.fileInfo.dataUrl ? (
                                    <a
                                      href={ev.fileInfo.dataUrl}
                                      download={ev.fileInfo.name}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] text-civic-indigo-700 hover:text-civic-indigo-900 bg-white px-1.5 py-0.5 rounded border border-indigo-200"
                                    >
                                      <Download className="w-2.5 h-2.5" />
                                      <span>Download</span>
                                    </a>
                                  ) : (
                                    <span className="text-slate-400 italic text-[9px]">(bytes not stored)</span>
                                  )
                                ) : (
                                  <span className="text-slate-400 italic text-[9px]">(Private media - restricted access)</span>
                                )}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <Link
                        to="/passport/evidence"
                        className="shrink-0 text-civic-indigo-600 hover:text-civic-indigo-800 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <span>Passport</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Single-Browser Simulation:</strong> Receipt and evidence records are persisted locally in browser storage. No live server upload or remote verification occurred.
            </span>
          </div>
        </Card>
      )}

      {/* Deliberation Entry Points (Civic Assignments Only) */}
      {!isUhv && submission && !isDraft && (
        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-civic-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Deliberation Entry Points & Evidence Linkage
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-civic-indigo-700 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100">
              Jaipur Civic Stream
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your fieldwork observation evidence is ready to inform local deliberative chambers. You can bring your findings into the Jaipur Pedestrian Safety Youth Assembly or table arguments in the structured Debate Room.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Link
              to="/assemblies/assembly_jaipur_pedestrian_2026"
              className="p-4 rounded-xl border border-civic-indigo-200 bg-white hover:border-civic-indigo-400 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between font-bold text-xs text-slate-900 group-hover:text-civic-indigo-700">
                <span>Jaipur Youth Assembly</span>
                <ArrowRight className="w-4 h-4 text-civic-indigo-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Chamber #assembly_jaipur_pedestrian_2026 &bull; Co-deliberate school-zone safety propositions with peers.
              </p>
            </Link>

            <Link
              to="/debate-room"
              className="p-4 rounded-xl border border-civic-saffron-200 bg-white hover:border-civic-saffron-400 hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between font-bold text-xs text-slate-900 group-hover:text-civic-saffron-800">
                <span>Structured Debate Room</span>
                <ArrowRight className="w-4 h-4 text-civic-saffron-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Test and defend traffic calming propositions with structured turn-taking and evidentiary citations.
              </p>
            </Link>
          </div>

          <p className="text-[10px] text-slate-400 italic">
            Note: Single-browser simulation. Deliberation chambers operate locally on this device without a live shared network backend.
          </p>
        </Card>
      )}

      {/* Submission Detail Card */}
      {submission && (
        <Card className="border-slate-200 p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              {submittingUser && !isUhv && (
                <Avatar
                  src={submittingUser.avatar}
                  alt={submittingUser.name}
                  size="md"
                />
              )}
              <div>
                <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-civic-indigo-600" />
                  <span>
                    {isUhv
                      ? 'Your Private Reflection'
                      : isTeacher
                      ? `${submittingUser?.name || 'Student'}'s Submission`
                      : 'Your Submission Record'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {isUhv
                    ? 'Recorded in private study stream'
                    : submission.submittedAt
                    ? `Submitted ${formatRelativeTime(submission.submittedAt)}`
                    : 'Draft saved'}
                </p>
              </div>
            </div>

            {isUhv ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
                {submission.status === 'draft' ? 'Draft Saved' : 'Reflection Recorded'}
              </span>
            ) : (
              <StatusChip status={submission.status} />
            )}
          </div>

          {/* Revision Requested Notice for Participant */}
          {isRevision && !isTeacher && !isUhv && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  Revision Requested by Teacher
                </span>
                <Link to={`/assignments/${assignment.id}/submit`}>
                  <Button size="sm" variant="danger">
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    <span>Edit & Resubmit Assignment</span>
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed italic">
                "{submission.teacherFeedback}"
              </p>
            </div>
          )}

          {/* Draft Notice for Participant */}
          {isDraft && !isTeacher && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Draft In Progress
                </span>
                <p className="text-xs text-amber-800">
                  {isUhv
                    ? 'You have a saved draft for this reflection. Continue editing to record your notes.'
                    : 'You have a saved draft for this assignment. Continue editing to submit for review and earn +2 Credits.'}
                </p>
              </div>
              <Link to={`/assignments/${assignment.id}/submit`}>
                <Button size="sm" variant="saffron" className="shrink-0">
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  <span>Resume & Submit</span>
                </Button>
              </Link>
            </div>
          )}

          {/* Submission Body Content */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isUhv ? 'Personal Reflection & Inquiry Notes' : 'Observation Notes & Field Findings'}
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-mono sm:font-sans">
              {submission.content}
            </div>
          </div>

          {/* Attached Evidence records (Civic Assignments Only) */}
          {!isUhv && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Attached Field Evidence Records ({attachedEvidence.length})
              </h3>
              {attachedEvidence.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No evidence records attached to this submission.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attachedEvidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate">{ev.title}</span>
                        <StatusChip status={ev.verificationStatus} />
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                        <span className="capitalize">{ev.type}</span>
                        {ev.location && <span className="truncate max-w-[150px]">{ev.location}</span>}
                      </div>
                      {ev.fileInfo && (() => {
                        const isAuthorized = canActorAccessPrivateEvidence(
                          currentUser ? { id: currentUser.id, role: currentUser.role } : null,
                          ev,
                          submission
                            ? [
                                {
                                  evidenceIds: [ev.id],
                                  reviewerId: submission.reviewerId,
                                  userId: submission.userId,
                                  assignmentId: submission.assignmentId,
                                },
                              ]
                            : []
                        );

                        return (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                            <span className="truncate">File: {ev.fileInfo.name}</span>
                            {isAuthorized ? (
                              ev.fileInfo.blobKey ? (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAttachment(ev)}
                                  className="text-civic-indigo-600 hover:text-civic-indigo-800 font-semibold flex items-center gap-0.5"
                                  title="Download attachment from browser-local IndexedDB"
                                >
                                  <Download className="w-2.5 h-2.5" />
                                  <span>Download</span>
                                </button>
                              ) : ev.fileInfo.dataUrl ? (
                                <a
                                  href={ev.fileInfo.dataUrl}
                                  download={ev.fileInfo.name}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-civic-indigo-600 hover:text-civic-indigo-800 font-semibold flex items-center gap-0.5"
                                >
                                  <Download className="w-2.5 h-2.5" />
                                  <span>Download</span>
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">DEMO metadata</span>
                              )
                            ) : (
                              <span className="text-slate-400 italic">Restricted</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Verified Feedback Display (Civic Assignments Only) */}
          {!isUhv && isVerified && submission.teacherFeedback && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Mentor Verification & Feedback
                </span>
                {submission.score !== undefined && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                    Score: {submission.score}/25
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed italic">
                "{submission.teacherFeedback}"
              </p>
              {!isTeacher && (
                <div className="pt-2">
                  <Link to="/passport">
                    <Button size="sm" variant="outline" className="bg-white text-emerald-900 border-emerald-300 text-xs">
                      <Award className="w-3.5 h-3.5 mr-1 text-civic-saffron-600" />
                      <span>View Verified Entry in Civic Passport</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* UHV Action Footer: Edit Reflection */}
          {isUhv && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Personal reflections are non-prescriptive and self-directed.
              </p>
              <Link to={`/assignments/${assignment.id}/submit`}>
                <Button size="sm" variant="outline">
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  <span>Edit Reflection Notes</span>
                </Button>
              </Link>
            </div>
          )}

          {/* Teacher Review Actions Form (Active when viewed as Teacher on Civic Assignments Only) */}
          {isTeacher && !isUhv && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 bg-amber-50/40 p-5 rounded-2xl border border-amber-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Teacher Verification & Assessment Panel (Demo Mentor Evaluation)
                </span>
                <span className="text-xs text-amber-800 font-medium">
                  Reviewing: {submittingUser?.name || 'Student'} ({submission.userId})
                </span>
              </div>

              {submission.userId === currentUser?.id ? (
                <div className="p-4 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold">Self-Review Not Permitted</span>
                    <p className="text-amber-900 leading-relaxed">
                      You are the author of this submission. Mentors cannot evaluate their own work. Switch to another mentor persona (such as Meera) to review this fieldwork submission.
                    </p>
                  </div>
                </div>
              ) : submission.status === 'draft' ? (
                <div className="p-4 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold">Participant Draft In Progress</span>
                    <p className="text-amber-900 leading-relaxed">
                      This item is a private draft in progress and has not been submitted by the participant. Mentors can only evaluate completed submissions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[11px] text-amber-900 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200">
                    Fictional local mentor action: Accepting this submission verifies the attached observation evidence and awards +1 Observation Credit. Requesting revision returns actionable feedback to the participant.
                  </div>

                  <Textarea
                    label="Teacher Feedback / Constructive Instructions"
                    placeholder="Provide constructive feedback on student observation methodology, evidence accuracy, and safety adherence..."
                    value={feedbackInput}
                    onChange={(e) => {
                      setFeedbackInput(e.target.value);
                      if (feedbackError) setFeedbackError(null);
                    }}
                    rows={3}
                    error={feedbackError || undefined}
                    helperText="Feedback is visible to the participant and logged in their verified Civic Passport record."
                  />

                  <div className="w-36">
                    <Input
                      label="Score (out of 25)"
                      type="number"
                      min="0"
                      max="25"
                      value={scoreInput}
                      onChange={(e) => setScoreInput(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      size="sm"
                      variant="primary"
                      isLoading={isReviewing}
                      onClick={() => handleTeacherReview('verified')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      <span>Verify Submission (Accept in Demo)</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={isReviewing}
                      onClick={() => handleTeacherReview('revision_requested')}
                    >
                      <AlertCircle className="w-4 h-4 mr-1.5 text-amber-600" />
                      <span>Request Revision</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* If teacher and no submissions exist for assignment */}
      {isTeacher && !isUhv && allSubmissions.length === 0 && (
        <Card className="p-8 text-center text-slate-500 text-xs">
          No student submissions recorded for this assignment yet.
        </Card>
      )}
    </div>
  );
};

