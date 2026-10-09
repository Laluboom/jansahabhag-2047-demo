import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Assignment, Submission, User } from '../../types/domain';
import { Card, CardTitle, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { Tabs } from '../../components/ui/Tabs';
import { Avatar } from '../../components/ui/Avatar';
import {
  FileCheck2,
  ArrowRight,
  Award,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
  UserCheck,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export const AssignmentsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey } = useAppRefreshStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const isTeacher = currentUser?.role === 'teacher';

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const [asgs, subs, allUsers] = await Promise.all([
          demoRepository.getAssignments(),
          demoRepository.getSubmissions(isTeacher ? undefined : currentUser.id),
          demoRepository.getUsers(),
        ]);
        setAssignments(asgs);
        setSubmissions(subs);
        setUsers(allUsers);
      } catch (err) {
        console.error('Failed to load assignments', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser, refreshKey, isTeacher]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  // Teacher perspective tabs & rendering
  if (isTeacher) {
    const teacherTabs = [
      { id: 'all', label: 'All Submissions', count: submissions.length },
      {
        id: 'needs_review',
        label: 'Needs Review',
        count: submissions.filter((s) => s.status === 'submitted' || s.status === 'under_review').length,
      },
      {
        id: 'revision_requested',
        label: 'Revision Requested',
        count: submissions.filter((s) => s.status === 'revision_requested').length,
      },
      {
        id: 'verified',
        label: 'Verified',
        count: submissions.filter((s) => s.status === 'verified').length,
      },
      {
        id: 'assignments_list',
        label: 'Assignment Catalog',
        count: assignments.length,
      },
    ];

    const filteredSubmissions = submissions.filter((s) => {
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
              Verify student observations, field audits, and evidence submissions from Navchetna Public School.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 shrink-0 text-right">
            <span className="text-xs font-bold text-amber-900 uppercase block">Pending Reviews</span>
            <span className="text-2xl font-extrabold text-amber-950 font-heading">
              {submissions.filter((s) => s.status === 'submitted' || s.status === 'under_review').length}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={teacherTabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Assignment Catalog Tab view */}
        {activeTab === 'assignments_list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {assignments.map((asg) => (
              <Card key={asg.id} className="border-slate-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100">
                      Type: {asg.requiredEvidenceType}
                    </span>
                    <span className="text-xs text-civic-saffron-700 font-semibold">
                      +{asg.creditsReward} Credits
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900">{asg.title}</CardTitle>
                  <p className="text-xs text-slate-600 line-clamp-2">{asg.prompt}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {submissions.filter((s) => s.assignmentId === asg.id).length} student submissions
                  </span>
                  <Link to={`/assignments/${asg.id}`}>
                    <Button size="sm" variant="outline">
                      <span>View Assignment Detail</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Submissions Queue */
          <div className="space-y-3">
            {filteredSubmissions.length === 0 ? (
              <Card className="p-8 text-center text-slate-500 text-xs">
                No student submissions in this review category.
              </Card>
            ) : (
              filteredSubmissions.map((sub) => {
                const student = users.find((u) => u.id === sub.userId);
                const asg = assignments.find((a) => a.id === sub.assignmentId);

                return (
                  <Card
                    key={sub.id}
                    hoverable
                    className="p-5 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={student?.avatar}
                        alt={student?.name || 'Student'}
                        size="md"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 font-heading">
                            {student?.name || 'Participant'}
                          </span>
                          <span className="text-xs text-slate-400">&bull;</span>
                          <span className="text-xs text-slate-500">{student?.institutionName || 'Student'}</span>
                          <StatusChip status={sub.status} />
                        </div>

                        <h3 className="text-sm font-semibold text-civic-indigo-900">
                          {asg?.title || sub.assignmentId}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 max-w-xl">
                          "{sub.content}"
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Submitted {sub.submittedAt ? formatRelativeTime(sub.submittedAt) : 'Draft'}
                          </span>
                          <span>&bull;</span>
                          <span>{sub.evidenceIds.length} Evidence Records Attached</span>
                          {sub.score !== undefined && (
                            <>
                              <span>&bull;</span>
                              <span className="font-semibold text-emerald-700">Score: {sub.score}/25</span>
                            </>
                          )}
                        </div>

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
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }

  // Participant perspective
  const participantTabs = [
    { id: 'all', label: 'All Assignments', count: assignments.length },
    {
      id: 'active',
      label: 'Action Required',
      count: assignments.filter((a) => {
        const sub = submissions.find((s) => s.assignmentId === a.id);
        return !sub || sub.status === 'draft' || sub.status === 'revision_requested';
      }).length,
    },
    {
      id: 'submitted',
      label: 'Under Review',
      count: assignments.filter((a) => {
        const sub = submissions.find((s) => s.assignmentId === a.id);
        return sub && (sub.status === 'submitted' || sub.status === 'under_review');
      }).length,
    },
    {
      id: 'verified',
      label: 'Verified',
      count: assignments.filter((a) => {
        const sub = submissions.find((s) => s.assignmentId === a.id);
        return sub && sub.status === 'verified';
      }).length,
    },
  ];

  const filteredAssignments = assignments.filter((asg) => {
    const sub = submissions.find((s) => s.assignmentId === asg.id);
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return !sub || sub.status === 'draft' || sub.status === 'revision_requested';
    if (activeTab === 'submitted') return sub && (sub.status === 'submitted' || sub.status === 'under_review');
    if (activeTab === 'verified') return sub && sub.status === 'verified';
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Field Evidence & Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Collect observable field data, traffic counts, and community interviews verified by mentors.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={participantTabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredAssignments.map((asg) => {
          const submission = submissions.find((s) => s.assignmentId === asg.id);
          const isSubmitted = !!submission && submission.status !== 'draft';
          const isDraft = submission?.status === 'draft';
          const isRevision = submission?.status === 'revision_requested';
          const isVerified = submission?.status === 'verified';

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
                    <span className="text-xs text-slate-400 font-medium">Not Started</span>
                  )}
                </div>

                <CardTitle className="text-base font-bold text-slate-900 line-clamp-2">
                  {asg.title}
                </CardTitle>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {asg.prompt}
                </p>

                {isRevision && submission.teacherFeedback && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Teacher Requested Revisions:
                    </span>
                    <p className="italic text-rose-800">"{submission.teacherFeedback}"</p>
                  </div>
                )}

                {isVerified && submission.teacherFeedback && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Verified by Teacher:
                    </span>
                    <p className="italic text-emerald-800">"{submission.teacherFeedback}"</p>
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

                <div>
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
    </div>
  );
};

