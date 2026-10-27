import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { Assignment, Submission } from '../../types/domain';
import { getEvidenceExpectationDetail } from '../../domain/evidenceRules';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StatusChip } from '../ui/StatusChip';
import {
  Clock,
  Calendar,
  ArrowRight,
  Award,
} from 'lucide-react';

export interface AssignmentTaskCardProps {
  assignmentId: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatDueDateTime(dateStr: string): { formatted: string; timeZone: string } {
  try {
    const date = new Date(dateStr);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    if (isNaN(date.getTime())) {
      return { formatted: dateStr, timeZone };
    }
    const formatted = new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
    return { formatted, timeZone };
  } catch {
    return { formatted: dateStr, timeZone: 'UTC' };
  }
}

export const AssignmentTaskCard: React.FC<AssignmentTaskCardProps> = ({
  assignmentId,
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuthStore();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !assignmentId) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    async function loadData() {
      try {
        const asg = await demoRepository.getAssignment(assignmentId);
        if (!isMounted) return;
        setAssignment(asg);

        if (asg && currentUser) {
          const subs = await demoRepository.getSubmissions(currentUser.id, assignmentId);
          if (!isMounted) return;
          setSubmission(subs[0] || null);
        } else {
          if (!isMounted) return;
          setSubmission(null);
        }
      } catch (err) {
        console.error('Failed to load assignment in task card', err);
        if (isMounted) {
          setAssignment(null);
          setSubmission(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, assignmentId, currentUser]);

  if (!isOpen) return null;

  const evidenceDetail = assignment
    ? getEvidenceExpectationDetail(assignment.requiredEvidenceType)
    : null;

  const modalTitle = assignment
    ? assignment.title
    : isLoading
      ? 'Loading Assignment'
      : 'Assignment Not Found';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Dismiss
          </Button>
          {assignment && (
            <Link
              to={`/assignments/${assignment.id}`}
              className="inline-flex min-w-0 max-w-full items-center justify-center rounded-lg text-center font-medium leading-snug whitespace-normal break-words [&>svg]:shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] transition-transform motion-safe:duration-150 bg-civic-indigo-600 text-white hover:bg-civic-indigo-700 focus-visible:ring-civic-indigo-500 shadow-sm min-h-9 px-3.5 py-2 text-xs gap-1.5"
            >
              <span>Open full assignment</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div
          className="flex items-center justify-center py-12"
          role="status"
          aria-label="Loading assignment details"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
        </div>
      ) : !assignment ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800">Assignment not found</p>
          <p className="text-xs text-slate-500">
            The requested assignment could not be loaded or does not exist.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header metadata chips (Status, Time, Due Date, Credits) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Current Status:</span>
              <StatusChip status={submission ? submission.status : 'not_started'} />
            </div>

            {assignment.creditsReward != null && assignment.creditsReward > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-civic-saffron-50 border border-civic-saffron-200 text-civic-saffron-800 text-xs font-semibold">
                <Award className="w-3.5 h-3.5 text-civic-saffron-600" />
                <span>+{assignment.creditsReward} Credits</span>
              </div>
            )}
          </div>

          {/* Time Limit & Due Date */}
          {(assignment.timeLimitMinutes != null || assignment.dueDate) && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
              {assignment.timeLimitMinutes != null && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Estimated time: <strong>{assignment.timeLimitMinutes} minutes</strong>
                  </span>
                </div>
              )}

              {assignment.dueDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Due date: <strong>{formatDueDateTime(assignment.dueDate).formatted}</strong>{' '}
                    <span className="text-slate-500 font-normal">
                      (Timezone: {formatDueDateTime(assignment.dueDate).timeZone})
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Objective & Instructions */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Objective & Instructions
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
              {assignment.prompt}
            </p>
          </div>

          {/* Rubric */}
          {assignment.rubric && assignment.rubric.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Evaluation Rubric
              </h3>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                {assignment.rubric.map((item, idx) => (
                  <li key={idx} className="p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{item.criterion}</span>
                      <span className="text-civic-indigo-600 shrink-0 font-medium ml-2">
                        {item.maxPoints} {item.maxPoints === 1 ? 'pt' : 'pts'}
                      </span>
                    </div>
                    <p className="text-slate-500 leading-snug">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Accepted Formats & Evidence Expectations */}
          {evidenceDetail && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Evidence Expectations & Accepted Formats
              </h3>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-2">
                <div>
                  <span className="font-semibold text-slate-800">
                    Required Evidence Type: {evidenceDetail.typeLabel}
                  </span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    {evidenceDetail.expectation}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                  <span>
                    <strong>Accepted formats:</strong> {evidenceDetail.acceptedFormats}
                  </span>
                  <span>&bull;</span>
                  <span>
                    <strong>Attachment size limit:</strong> {evidenceDetail.sizeLimitLabel}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
