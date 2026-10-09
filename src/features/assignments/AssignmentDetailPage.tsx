import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Assignment, Submission, Evidence } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { Textarea } from '../../components/ui/Input';
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
} from 'lucide-react';

export const AssignmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [attachedEvidence, setAttachedEvidence] = useState<Evidence[]>([]);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id || !currentUser) return;
      setIsLoading(true);
      try {
        const asg = await demoRepository.getAssignment(id);
        setAssignment(asg);

        // Load submission for current user or first pending submission if teacher
        const subs = await demoRepository.getSubmissions(
          currentUser.role === 'teacher' ? undefined : currentUser.id,
          id
        );
        const activeSub = subs[0] || null;
        setSubmission(activeSub);

        if (activeSub && activeSub.evidenceIds.length > 0) {
          const evs = await Promise.all(
            activeSub.evidenceIds.map((eid) => demoRepository.getEvidence(eid))
          );
          setAttachedEvidence(evs.filter((e): e is Evidence => e !== null));
        }
      } catch (err) {
        console.error('Failed to load assignment', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser, refreshKey]);

  const handleTeacherReview = async (status: 'verified' | 'revision_requested') => {
    if (!submission || !currentUser) return;
    setIsReviewing(true);
    try {
      await demoRepository.reviewSubmission({
        submissionId: submission.id,
        reviewerId: currentUser.id,
        status,
        teacherFeedback: feedbackInput || (status === 'verified' ? 'Verified. Excellent civic fieldwork.' : 'Please add more detailed observation notes.'),
        score: status === 'verified' ? 25 : undefined,
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

  const isTeacher = currentUser?.role === 'teacher';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/assignments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assignments</span>
      </Link>

      {/* Assignment Header Card */}
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
          {submission && <StatusChip status={submission.status} />}
        </div>

        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">
            {assignment.title}
          </h1>
          <p className="text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-line">
            {assignment.prompt}
          </p>
        </div>

        {/* Rubric Table */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Assessment Rubric
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {assignment.rubric.map((r, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>{r.criterion}</span>
                  <span>{r.maxPoints} pts</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{r.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Submission Call to Action for participant if not yet submitted */}
        {!submission && !isTeacher && (
          <div className="pt-2">
            <Link to={`/assignments/${assignment.id}/submit`}>
              <Button variant="primary" size="md">
                <span>Submit Field Evidence & Notes</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Submission Details if submitted */}
      {submission && (
        <Card className="border-slate-200 p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-civic-indigo-600" />
              <span>Participant Submission</span>
            </h2>
            <StatusChip status={submission.status} />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
            {submission.content}
          </div>

          {/* Attached Evidence records */}
          {attachedEvidence.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Attached Verified Evidence Records ({attachedEvidence.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachedEvidence.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-lg border border-slate-200 bg-white text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 truncate">{ev.title}</span>
                      <StatusChip status={ev.verificationStatus} />
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{ev.description}</p>
                    {ev.location && (
                      <span className="text-[10px] text-slate-400 block truncate">{ev.location}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teacher feedback display */}
          {submission.teacherFeedback && (
            <div className="p-4 rounded-xl bg-civic-indigo-50 border border-civic-indigo-200 text-xs space-y-1">
              <span className="font-bold text-civic-indigo-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-civic-indigo-600" />
                Teacher / Mentor Feedback
              </span>
              <p className="text-slate-700">{submission.teacherFeedback}</p>
            </div>
          )}

          {/* Teacher Review Actions (Active when viewed as Teacher) */}
          {isTeacher && submission.status !== 'verified' && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 bg-amber-50/50 p-4 rounded-xl border">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Teacher Verification Panel
              </span>

              <Textarea
                label="Review Feedback / Instructions"
                placeholder="Enter feedback for Aarav regarding data clarity and next steps..."
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                rows={3}
              />

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={isReviewing}
                  onClick={() => handleTeacherReview('verified')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  <span>Verify Submission (+{assignment.creditsReward} Credits)</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={isReviewing}
                  onClick={() => handleTeacherReview('revision_requested')}
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>Request Revision</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
