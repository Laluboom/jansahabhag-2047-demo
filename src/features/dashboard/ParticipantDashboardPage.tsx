import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { DashboardData, Course } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { ThreadMotif } from '../../components/layout/ThreadMotif';
import { PointOfUseRulesButton } from '../../components/ui/PointOfUseRulesButton';
import { AssignmentTaskCard } from '../../components/assignments/AssignmentTaskCard';
import { formatRelativeTime } from '../../utils/formatters';
import {
  Award,
  BookOpen,
  Vote,
  ArrowRight,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const ParticipantDashboardPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey } = useAppRefreshStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const d = await demoRepository.getDashboard(currentUser.id);
        setData(d);

        // Fetch active course details if enrolled
        if (d.activeEnrolments.length > 0) {
          const c = await demoRepository.getCourse(d.activeEnrolments[0].courseId);
          setActiveCourse(c);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser, refreshKey]);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const primaryEnrolment = data.activeEnrolments[0];
  const primaryAssembly = data.activeAssemblies[0];
  const nextAssignment = data.pendingAssignments[0];

  return (
    <div className="space-y-6">
      {/* Five-Stage Product Method Banner */}
      <ThreadMotif currentStage="observe" />

      {/* Welcome & Scenario Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-civic-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Civic Journey Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
            Welcome back, {data.user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {data.user.institutionName} &bull; Programme: <strong>My Community, My Future</strong>
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-stretch gap-2">
          <PointOfUseRulesButton
            moduleName="Platform Rules"
            triggerText="Platform Rules"
            modalTitle="Platform Operating Rules & Standards"
            description="Core operational policies for JanSahabhag 2047 demo participation."
            rules={[
              {
                title: 'Participant Eligibility & Policy',
                description: 'Every demo participant must be 18 or older per platform policy. No real identity verification is claimed or performed.',
              },
              {
                title: 'Verified Civic Action Credit Ledger',
                description: 'Starting balance is 0 Civic Credit Points with a hard maximum of 5 verified points. Eligible verified civic activities award 1 or 2 points until the cap; personal reflections carry 0 points to maintain voluntary reflection.',
              },
              {
                title: 'Persistent & Non-Anonymous Participation',
                description: 'Deliberative remarks, evidence uploads, and votes are linked to registered participant profiles for accountability.',
              },
            ]}
            testId="dashboard-rules-btn"
          />
          <Link to="/passport" className="min-w-0 flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="h-full w-full text-xs">
              <Award className="w-4 h-4 mr-1.5 text-civic-saffron-600" />
              <span>Civic Passport ({data.passportEntriesCount})</span>
            </Button>
          </Link>
          <Link to="/learn" className="min-w-0 flex-1 sm:flex-none">
            <Button size="sm" variant="primary" className="h-full w-full text-xs">
              <span>Continue Learning</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Credits */}
        <Card className="p-4 sm:p-5 border-civic-saffron-200/80 bg-gradient-to-br from-white to-civic-saffron-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Civic Credit Points</span>
            <div className="w-8 h-8 rounded-lg bg-civic-saffron-100 text-civic-saffron-800 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
              {data.creditSummary.total}
            </span>
            <span className="text-xs font-medium text-civic-saffron-700">Verified</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 break-words">
            {data.creditSummary.breakdown.Deliberation} Delib &bull; {data.creditSummary.breakdown.Observation} Obs
          </p>
        </Card>

        {/* Active Enrolments */}
        <Card className="p-4 sm:p-5 border-civic-indigo-200/80 bg-gradient-to-br from-white to-civic-indigo-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Courses</span>
            <div className="w-8 h-8 rounded-lg bg-civic-indigo-100 text-civic-indigo-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
              {data.activeEnrolments.length}
            </span>
            <span className="text-xs text-slate-500">Enrolled</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {primaryEnrolment ? `${primaryEnrolment.progressPercent}% active progress` : 'Ready to enrol'}
          </p>
        </Card>

        {/* Active Assemblies */}
        <Card className="p-4 sm:p-5 border-civic-teal-200/80 bg-gradient-to-br from-white to-civic-teal-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Youth Assembly</span>
            <div className="w-8 h-8 rounded-lg bg-civic-teal-100 text-civic-teal-700 flex items-center justify-center">
              <Vote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
              {data.activeAssemblies.length}
            </span>
            <span className="text-xs text-civic-teal-700 font-semibold">Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Role: <strong>Questioner</strong>
          </p>
        </Card>

        {/* Pending Actions */}
        <Card className="p-4 sm:p-5 border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pending Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
              {data.pendingAssignments.length}
            </span>
            <span className="text-xs text-amber-700">Assignments</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 break-words">
            {nextAssignment ? nextAssignment.title : 'All caught up!'}
          </p>
        </Card>
      </div>

      {/* Connected Next Step Hero Card */}
      {data.nextStep && (
        <Card className="border-civic-indigo-200 bg-gradient-to-r from-civic-indigo-50/70 via-white to-civic-saffron-50/40 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="inline-flex max-w-full items-center rounded-full bg-civic-indigo-600 px-3 py-1.5 text-xs font-bold uppercase leading-snug tracking-wider text-white break-words">
                  {data.nextStep.badgeText}
                </span>
                {data.nextStep.rewardText && (
                  <span className="inline-flex max-w-full items-center rounded-full border border-civic-saffron-200 bg-civic-saffron-100/70 px-3 py-1.5 text-xs font-semibold leading-snug text-civic-saffron-700 break-words">
                    {data.nextStep.rewardText}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-slate-900">
                {data.nextStep.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl break-words">
                {data.nextStep.description}
              </p>
            </div>
            <Link to={data.nextStep.targetRoute} className="min-w-0 self-start sm:shrink-0">
              <Button size="md" variant="primary" className="shadow-xs">
                <span>Continue Action</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Main Grid: Learning in Progress + Youth Assembly Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: Active Learning & Assignment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Course Card */}
          {activeCourse && primaryEnrolment && (
            <Card hoverable className="border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-civic-indigo-600 uppercase tracking-wider">
                    Current Active Course
                  </span>
                  <StatusChip status={primaryEnrolment.status} />
                </div>
                <CardTitle className="text-lg text-slate-900 mt-1">
                  {activeCourse.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeCourse.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>Course Progress</span>
                    <span>{primaryEnrolment.progressPercent}% Completed</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-civic-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${primaryEnrolment.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activeCourse.estimatedMinutes} mins total
                  </span>
                  <Link to={`/learn/${activeCourse.id}`}>
                    <Button size="sm" variant="primary">
                      <span>Resume Course</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Youth Assembly Card */}
          {primaryAssembly && (
            <Card hoverable className="border-civic-teal-200 bg-gradient-to-br from-white to-civic-teal-50/20">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Vote className="w-4 h-4 text-civic-teal-600" />
                    <span className="text-xs font-bold text-civic-teal-700 uppercase tracking-wider">
                      Youth Deliberation Chamber
                    </span>
                  </div>
                  <span className="max-w-full rounded-full bg-civic-teal-100 px-3 py-1 text-xs font-semibold leading-snug text-civic-teal-800 break-words">
                    Stage: {primaryAssembly.currentStage.replace('_', ' ')}
                  </span>
                </div>
                <CardTitle className="text-base sm:text-lg text-slate-900 mt-1">
                  {primaryAssembly.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-700 space-y-2 break-words">
                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-civic-indigo-600" />
                    Core Deliberation Question:
                  </span>
                  <p className="italic text-slate-600">"{primaryAssembly.question}"</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="max-w-full rounded border border-slate-200 bg-slate-100 px-3 py-1.5 font-medium leading-snug break-words">
                      Assigned Role: <strong>Questioner</strong>
                    </span>
                    <span>&bull;</span>
                    <span>{primaryAssembly.participantUserIds.length} Deliberators</span>
                  </div>
                  <Link to={`/assemblies/${primaryAssembly.id}`}>
                    <Button size="sm" variant="teal">
                      <span>Enter Assembly</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Pending Assignment Action */}
          {nextAssignment && (
            <Card className="border-amber-200 bg-amber-50/30">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0 space-y-1.5 break-words">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    Next Action Item (+{nextAssignment.creditsReward} Civic Credit Points)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    {nextAssignment.title}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {nextAssignment.prompt}
                  </p>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveAssignmentId(nextAssignment.id)}
                    aria-haspopup="dialog"
                    className="shrink-0"
                  >
                    <span>View Task Card</span>
                  </Button>
                  <Link to={`/assignments/${nextAssignment.id}`}>
                    <Button size="sm" variant="saffron" className="shrink-0">
                      <span>Start Submission</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Activities & Events */}
        <div className="space-y-6">
          {/* Recent Activity Timeline */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-900">Recent Civic Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivities.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No activities recorded yet.</p>
                ) : (
                  data.recentActivities.slice(0, 5).map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      <div className="w-6 h-6 rounded-full bg-civic-indigo-50 text-civic-indigo-600 flex items-center justify-center shrink-0 mt-0.5 border border-civic-indigo-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 break-words">{act.title}</p>
                        <p className="text-slate-500 text-[11px] break-words">{act.description}</p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {formatRelativeTime(act.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Field Events */}
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-900">Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.upcomingEvents.slice(0, 3).map((evt) => (
                  <div key={evt.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 font-bold text-slate-800 break-words">{evt.title}</span>
                      <span className="max-w-full rounded bg-slate-200 px-2.5 py-1 text-[10px] font-medium leading-snug break-words">
                        {evt.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      <span>{evt.date} &bull; {evt.startTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AssignmentTaskCard
        assignmentId={activeAssignmentId || ''}
        isOpen={Boolean(activeAssignmentId)}
        onClose={() => setActiveAssignmentId(null)}
      />
    </div>
  );
};
