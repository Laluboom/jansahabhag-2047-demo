import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Course, Lesson, Enrolment } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { PointOfUseRulesButton } from '../../components/ui/PointOfUseRulesButton';
import { UhvCreditBanner } from './UhvCreditBanner';
import { UhvWorkshopMediaPlaceholders } from './UhvWorkshopMediaPlaceholders';
import {
  BookOpen,
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!courseId || !currentUser) return;
      setIsLoading(true);
      try {
        const [c, lList, enr] = await Promise.all([
          demoRepository.getCourse(courseId),
          demoRepository.getLessons(courseId),
          demoRepository.getEnrolment(currentUser.id, courseId),
        ]);
        setCourse(c);
        setLessons(lList);
        setEnrolment(enr);
      } catch (err) {
        console.error('Failed to load course details', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [courseId, currentUser, refreshKey]);

  const handleEnrol = async () => {
    if (!courseId || !currentUser) return;
    await demoRepository.enrolInCourse(currentUser.id, courseId);
    triggerRefresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading course details">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <Link to="/learn" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course Directory</span>
        </Link>
        <Card className="p-8 text-center space-y-4 border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-slate-900">Course Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The civic course ID "{courseId}" could not be located in the current curriculum catalog.
          </p>
          <div className="pt-2">
            <Button size="sm" variant="primary" onClick={() => navigate('/learn')}>
              View All Courses
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isUhv = course.track === 'uhv';
  const completedLessonIds = enrolment?.completedLessonIds || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        to={isUhv ? '/uhv' : '/learn'}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{isUhv ? 'Back to Universal Human Values' : 'Back to Course Directory'}</span>
      </Link>

      {/* Course Overview Header */}
      <Card className="border-slate-200 p-6 sm:p-8 space-y-4 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-civic-indigo-600 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100">
              {course.code}
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              {isUhv ? 'Personal Reflection Track' : `${course.track.replace('_', ' ')} \u2022 ${course.level}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <PointOfUseRulesButton
              moduleName="Course"
              triggerText="Course Rules"
              modalTitle={`${course.title} — Operating Rules`}
              description={`Applicable study guidelines and credit standards for ${course.title}.`}
              rules={[
                {
                  title: isUhv ? 'Voluntary Self-Study' : 'Lesson Progression',
                  description: isUhv
                    ? 'Study modules are open for personal inquiry. Responses are saved privately and never graded.'
                    : 'Complete lessons sequentially to demonstrate mastery and unlock your completion credit.',
                },
                {
                  title: isUhv ? 'No Credit Award' : 'Learning Credit (+1 Credit)',
                  description: isUhv
                    ? 'Universal Human Values modules carry 0 credits to preserve genuine reflection.'
                    : 'Completing all course lessons awards +1 Learning Credit to your Civic Passport.',
                },
              ]}
              testId="course-detail-rules-btn"
            />
            {enrolment && <StatusChip status={enrolment.status} />}
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
            {course.title}
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {isUhv && (
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-1 text-xs">
            <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-900">
              Personal Reflection Boundary (Simulation)
            </span>
            <p className="text-blue-800 leading-relaxed">
              Universal Human Values is an autonomous personal inquiry stream. Self-paced study modules carry no numeric scores or Civic Credit Points.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-slate-400" />
            {lessons.length} {isUhv ? 'Inquiry Modules' : 'Structured Lessons'}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            {course.estimatedMinutes} Total Minutes
          </span>
          {enrolment && (
            <span className="font-semibold text-civic-indigo-600">
              {enrolment.progressPercent}% Completed ({completedLessonIds.length}/{lessons.length})
            </span>
          )}
        </div>

        {!enrolment && (
          <div className="pt-2">
            <Button size="md" variant="primary" onClick={handleEnrol}>
              Enrol in Course
            </Button>
          </div>
        )}
      </Card>

      {/* Workshop Attribution Banner */}
      {isUhv && <UhvCreditBanner />}

      {/* Modules & Lessons Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-heading text-slate-900">
          {isUhv ? 'Personal Values Curriculum & Inquiry Modules' : 'Course Curriculum & Field Modules'}
        </h2>

        {course.modules.map((mod) => {
          const moduleLessons = lessons.filter((l) => mod.lessonIds.includes(l.id));

          return (
            <Card key={mod.id} className="border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                <CardTitle className="text-base text-slate-900">{mod.title}</CardTitle>
                <p className="text-xs text-slate-500">{mod.description}</p>
              </CardHeader>

              <CardContent className="p-0 divide-y divide-slate-100">
                {moduleLessons.map((lesson, idx) => {
                  const isDone = completedLessonIds.includes(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold mt-0.5 ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900 font-heading">
                            {lesson.title}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {lesson.contentSummary}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lesson.estimatedMinutes}m
                            </span>
                            {lesson.assignmentId && (
                              <span className="flex items-center gap-1 text-civic-saffron-700 font-medium">
                                <FileCheck2 className="w-3 h-3" />
                                {isUhv ? 'Personal Reflection Prompt Attached' : 'Field Assignment Attached'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Link to={`/learn/${course.id}/lesson/${lesson.id}`}>
                        <Button size="sm" variant={isDone ? 'outline' : 'primary'}>
                          <span>{isDone ? 'Review' : 'Start'}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Visual Documentation & Video Placeholders */}
      {isUhv && <UhvWorkshopMediaPlaceholders />}
    </div>
  );
};
