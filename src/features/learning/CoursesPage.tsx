import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Course, Enrolment, CourseTrack } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { Tabs } from '../../components/ui/Tabs';
import {
  BookOpen,
  Clock,
  ArrowRight,
  Sparkles,
  HeartHandshake,
  ShieldAlert,
  ArrowLeft,
  Compass,
} from 'lucide-react';

export const CoursesPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey } = useAppRefreshStore();
  const location = useLocation();

  const isUhvStream = location.pathname.startsWith('/uhv');

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolments, setEnrolments] = useState<Enrolment[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const [cList, eList] = await Promise.all([
          demoRepository.getCourses(),
          demoRepository.getEnrolments(currentUser.id),
        ]);
        setCourses(cList);
        setEnrolments(eList);
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser, refreshKey]);

  // Reset tab selection if route changes between /learn and /uhv
  useEffect(() => {
    setSelectedTrack('all');
  }, [isUhvStream]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  // UHV Dedicated Stream View (Master PRD §1, Scope F, Part A §A11)
  if (isUhvStream) {
    const uhvCourses = courses.filter((c) => c.track === 'uhv');

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Stream Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              <span>Dedicated Study Stream &bull; Canonical Position 11</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
              UHV / Jeevan Vidya
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Universal Human Values and Jeevan Vidya foundational study stream, separated from the civic loop.
            </p>
          </div>

          <Link to="/learn">
            <Button size="sm" variant="outline">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back to Civic Learn</span>
            </Button>
          </Link>
        </div>

        {/* Fictional Demo Material Disclosure Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm uppercase tracking-wider text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Fictional Demo Material &bull; Curriculum Rights Awaiting Owner Review</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            This dedicated stream presents Universal Human Values (UHV) and Jeevan Vidya exploratory modules as fictional demo material under Master PRD Scope F. Source, licensing, and formal curriculum adoption remain subject to platform owner review.
          </p>
          <div className="pt-1 border-t border-amber-200/80 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
            <span>&bull; No approved curriculum implied</span>
            <span>&bull; Ideological agreement is not graded</span>
            <span>&bull; Participant reflection is voluntary and unfabricated</span>
          </div>
        </div>

        {/* Course Grid for UHV Stream */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {uhvCourses.map((course) => {
            const enrolment = enrolments.find((e) => e.courseId === course.id);
            const isEnrolled = !!enrolment;
            const progress = enrolment?.progressPercent || 0;
            const isCompleted = enrolment?.status === 'completed';

            return (
              <Card
                key={course.id}
                hoverable
                className="flex flex-col justify-between border-slate-200 overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      UHV Study Track
                    </span>
                    {isEnrolled ? (
                      <StatusChip status={enrolment.status} />
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Not Started</span>
                    )}
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 font-mono">{course.code}</span>
                    <CardTitle className="text-base font-bold text-slate-900 line-clamp-2 mt-0.5">
                      {course.title}
                    </CardTitle>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  {isEnrolled && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-civic-teal-600'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {course.lessonCount} Lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {course.estimatedMinutes}m
                      </span>
                    </div>

                    <Link to={`/learn/${course.id}`}>
                      <Button size="sm" variant={isEnrolled ? 'primary' : 'outline'}>
                        <span>{isEnrolled ? (isCompleted ? 'Review' : 'Continue') : 'View Course'}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // General Civic Learn View (Excludes UHV from general course listings)
  const civicCourses = courses.filter((c) => c.track !== 'uhv');

  const tabs = [
    { id: 'all', label: 'All Civic Courses', count: civicCourses.length },
    { id: 'civic_academy', label: 'Civic Academy', count: civicCourses.filter((c) => c.track === 'civic_academy').length },
    { id: 'action_skills', label: 'Action Skills', count: civicCourses.filter((c) => c.track === 'action_skills').length },
    { id: 'self_growth', label: 'Self Growth', count: civicCourses.filter((c) => c.track === 'self_growth').length },
  ];

  const filteredCourses = selectedTrack === 'all'
    ? civicCourses
    : civicCourses.filter((c) => c.track === (selectedTrack as CourseTrack));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Civic Learning Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Structured civic modules in a fictional browser demo.
          </p>
        </div>
      </div>

      {/* Distinct UHV Stream Link Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
        <div className="flex items-center gap-2.5">
          <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Stream Separation:</strong> Universal Human Values (UHV / Jeevan Vidya) is maintained as a distinct study stream. Fictional demo material.
          </span>
        </div>
        <Link to="/uhv" className="shrink-0 self-start sm:self-auto">
          <Button size="sm" variant="outline">
            <span>Open Universal Human Values Stream</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={selectedTrack} onChange={setSelectedTrack} />

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course) => {
          const enrolment = enrolments.find((e) => e.courseId === course.id);
          const isEnrolled = !!enrolment;
          const progress = enrolment?.progressPercent || 0;
          const isCompleted = enrolment?.status === 'completed';

          return (
            <Card
              key={course.id}
              hoverable
              className="flex flex-col justify-between border-slate-200 overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-civic-indigo-50 text-civic-indigo-700 border border-civic-indigo-100">
                    {course.track.replace('_', ' ')}
                  </span>
                  {isEnrolled ? (
                    <StatusChip status={enrolment.status} />
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Not Started</span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-mono">{course.code}</span>
                  <CardTitle className="text-base font-bold text-slate-900 line-clamp-2 mt-0.5">
                    {course.title}
                  </CardTitle>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                {/* Progress bar if enrolled */}
                {isEnrolled && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-civic-indigo-600'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {course.lessonCount} Lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {course.estimatedMinutes}m
                    </span>
                  </div>

                  <Link to={`/learn/${course.id}`}>
                    <Button size="sm" variant={isEnrolled ? 'primary' : 'outline'}>
                      <span>{isEnrolled ? (isCompleted ? 'Review' : 'Continue') : 'View Course'}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
