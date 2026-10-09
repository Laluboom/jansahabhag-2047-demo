import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Course, Enrolment, CourseTrack } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { Tabs } from '../../components/ui/Tabs';
import { BookOpen, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export const CoursesPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey } = useAppRefreshStore();
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

  const tabs = [
    { id: 'all', label: 'All Courses', count: courses.length },
    { id: 'civic_academy', label: 'Civic Academy', count: courses.filter((c) => c.track === 'civic_academy').length },
    { id: 'uhv', label: 'Universal Human Values', count: courses.filter((c) => c.track === 'uhv').length },
    { id: 'action_skills', label: 'Action Skills', count: courses.filter((c) => c.track === 'action_skills').length },
    { id: 'self_growth', label: 'Self Growth', count: courses.filter((c) => c.track === 'self_growth').length },
  ];

  const filteredCourses = selectedTrack === 'all'
    ? courses
    : courses.filter((c) => c.track === (selectedTrack as CourseTrack));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Civic Learning Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Structured modules designed to connect field observation with democratic action.
          </p>
        </div>
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
