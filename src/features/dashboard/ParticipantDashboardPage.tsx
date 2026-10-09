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
      {/* Evidence-to-Action Thread Top Banner */}
      <ThreadMotif currentStage="evidence" />

      {/* Welcome & Scenario Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
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

        <div className="flex items-center gap-2">
          <Link to="/passport">
            <Button variant="outline" size="sm" className="text-xs">
              <Award className="w-4 h-4 mr-1.5 text-civic-saffron-600" />
              <span>Civic Passport ({data.passportEntriesCount})</span>
            </Button>
          </Link>
          <Link to="/learn">
            <Button size="sm" variant="primary" className="text-xs">
              <span>Continue Learning</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Credits */}
        <Card className="p-4 sm:p-5 border-civic-saffron-200/80 bg-gradient-to-br from-white to-civic-saffron-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Civic Credits</span>
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
          <p className="text-[11px] text-slate-500 mt-1 truncate">
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
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {nextAssignment ? nextAssignment.title : 'All caught up!'}
          </p>
        </Card>
      </div>

      {/* Connected Next Step Hero Card */}
      {data.nextStep && (
        <Card className="border-civic-indigo-200 bg-gradient-to-r from-civic-indigo-50/70 via-white to-civic-saffron-50/40 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-civic-indigo-600 text-white font-mono">
                  {data.nextStep.badgeText}
                </span>
                {data.nextStep.rewardText && (
                  <span className="text-xs font-semibold text-civic-saffron-700 bg-civic-saffron-100/70 px-2 py-0.5 rounded-full border border-civic-saffron-200">
                    {data.nextStep.rewardText}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-slate-900">
                {data.nextStep.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl line-clamp-2">
                {data.nextStep.description}
              </p>
            </div>
            <Link to={data.nextStep.targetRoute} className="shrink-0">
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

                <div className="flex items-center justify-between pt-2">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Vote className="w-4 h-4 text-civic-teal-600" />
                    <span className="text-xs font-bold text-civic-teal-700 uppercase tracking-wider">
                      Youth Deliberation Chamber
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-civic-teal-100 text-civic-teal-800 font-semibold">
                    Stage: {primaryAssembly.currentStage.replace('_', ' ')}
                  </span>
                </div>
                <CardTitle className="text-base sm:text-lg text-slate-900 mt-1">
                  {primaryAssembly.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-700 space-y-1">
                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-civic-indigo-600" />
                    Core Deliberation Question:
                  </span>
                  <p className="italic text-slate-600">"{primaryAssembly.question}"</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-medium">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    Next Action Item (+{nextAssignment.creditsReward} Credits)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    {nextAssignment.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-1">
                    {nextAssignment.prompt}
                  </p>
                </div>
                <Link to={`/assignments/${nextAssignment.id}`}>
                  <Button size="sm" variant="saffron" className="shrink-0">
                    <span>Start Submission</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
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
                        <p className="font-semibold text-slate-800 truncate">{act.title}</p>
                        <p className="text-slate-500 text-[11px] line-clamp-1">{act.description}</p>
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
                  <div key={evt.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate">{evt.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 font-medium">
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
    </div>
  );
};
