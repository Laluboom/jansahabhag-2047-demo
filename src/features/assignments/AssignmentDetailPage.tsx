import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Assignment, Submission, Evidence, User } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
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
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export const AssignmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const submissionIdParam = searchParams.get('submissionId');
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
    } catch (err) {
      console.error('Failed to review submission', err);
    } finally {
      setIsReviewing(false);
    }
  };

  if (isLoading || !assignment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

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
            <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100">
              Evidence Type: {assignment.requiredEvidenceType}
            </span>
            <span className="text-xs font-semibold text-civic-saffron-700 bg-civic-saffron-50 px-2 py-0.5 rounded border border-civic-saffron-200">
              +{assignment.creditsReward} Civic Credits
            </span>
          </div>
          {submission && !isTeacher && <StatusChip status={submission.status} />}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            {assignment.title}
          </h1>
          <p className="text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-line">
            {assignment.prompt}
          </p>
        </div>

        {/* Rubric Breakdown */}
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

        {/* Participant Action Buttons if not yet submitted */}
        {!submission && !isTeacher && (
          <div className="pt-3 flex items-center gap-3">
            <Link to={`/assignments/${assignment.id}/submit`}>
              <Button variant="primary" size="md">
                <span>Start Submission & Log Evidence</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Teacher Perspective: Submission Selector */}
      {isTeacher && allSubmissions.length > 0 && (
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

      {/* Submission Detail Card */}
      {submission && (
        <Card className="border-slate-200 p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              {submittingUser && (
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
                    {isTeacher
                      ? `${submittingUser?.name || 'Student'}'s Submission`
                      : 'Your Submission Record'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {submission.submittedAt
                    ? `Submitted ${formatRelativeTime(submission.submittedAt)}`
                    : 'Draft saved'}
                </p>
              </div>
            </div>

            <StatusChip status={submission.status} />
          </div>

          {/* Revision Requested Notice for Participant */}
          {isRevision && !isTeacher && (
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
                  You have a saved draft for this assignment. Continue editing to submit for review and earn +10 Credits.
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
              Observation Notes & Field Findings
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line font-mono sm:font-sans">
              {submission.content}
            </div>
          </div>

          {/* Attached Evidence records */}
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Feedback Display */}
          {isVerified && submission.teacherFeedback && (
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

          {/* Teacher Review Actions Form (Active when viewed as Teacher) */}
          {isTeacher && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 bg-amber-50/40 p-5 rounded-2xl border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Teacher Verification & Assessment Panel
                </span>
                <span className="text-xs text-amber-800 font-medium">
                  Reviewing: {submittingUser?.name || 'Student'}
                </span>
              </div>

              <div className="space-y-3">
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
                    <span>Verify Submission (+5 Observation Credits)</span>
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
            </div>
          )}
        </Card>
      )}

      {/* If teacher and no submissions exist for assignment */}
      {isTeacher && allSubmissions.length === 0 && (
        <Card className="p-8 text-center text-slate-500 text-xs">
          No student submissions recorded for this assignment yet.
        </Card>
      )}
    </div>
  );
};

