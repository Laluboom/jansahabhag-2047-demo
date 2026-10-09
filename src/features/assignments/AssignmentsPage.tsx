import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Assignment, Submission } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { FileCheck2, ArrowRight, Award, Calendar, CheckCircle2 } from 'lucide-react';

export const AssignmentsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey } = useAppRefreshStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const [asgs, subs] = await Promise.all([
          demoRepository.getAssignments(),
          demoRepository.getSubmissions(currentUser.id),
        ]);
        setAssignments(asgs);
        setSubmissions(subs);
      } catch (err) {
        console.error('Failed to load assignments', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser, refreshKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Field Evidence & Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Collect observable data, traffic counts, and interview records verified by mentors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {assignments.map((asg) => {
          const submission = submissions.find((s) => s.assignmentId === asg.id);
          const isSubmitted = !!submission;

          return (
            <Card
              key={asg.id}
              hoverable
              className="flex flex-col justify-between border-slate-200"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100">
                    Required Evidence: {asg.requiredEvidenceType}
                  </span>
                  {submission ? (
                    <StatusChip status={submission.status} />
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Pending Submission</span>
                  )}
                </div>

                <CardTitle className="text-base font-bold text-slate-900 line-clamp-2">
                  {asg.title}
                </CardTitle>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {asg.prompt}
                </p>

                {submission?.teacherFeedback && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                    <span className="font-semibold text-slate-900 block">Teacher Feedback:</span>
                    <p className="italic text-slate-600">"{submission.teacherFeedback}"</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-civic-saffron-700 font-semibold">
                    <Award className="w-3.5 h-3.5" />
                    +{asg.creditsReward} Credits
                  </span>
                  {asg.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Due {asg.dueDate.split('T')[0]}
                    </span>
                  )}
                </div>

                <Link to={`/assignments/${asg.id}`}>
                  <Button size="sm" variant={submission?.status === 'verified' ? 'outline' : 'primary'}>
                    <span>{isSubmitted ? 'View Submission' : 'Submit Evidence'}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
