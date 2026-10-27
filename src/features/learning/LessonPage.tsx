import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Lesson, Course, Enrolment, Assignment } from '../../types/domain';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { PointOfUseRulesButton } from '../../components/ui/PointOfUseRulesButton';
import { AssignmentTaskCard } from '../../components/assignments/AssignmentTaskCard';
import { UhvCreditBanner } from './UhvCreditBanner';
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const LessonPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!courseId || !lessonId || !currentUser) return;
      setIsLoading(true);
      try {
        const [l, c, enr] = await Promise.all([
          demoRepository.getLesson(lessonId),
          demoRepository.getCourse(courseId),
          demoRepository.getEnrolment(currentUser.id, courseId),
        ]);
        setLesson(l);
        setCourse(c);
        setEnrolment(enr);

        if (l?.assignmentId) {
          const asg = await demoRepository.getAssignment(l.assignmentId);
          setAssignment(asg);
        }
      } catch (err) {
        console.error('Failed to load lesson', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [courseId, lessonId, currentUser, refreshKey]);

  const handleCompleteLesson = async () => {
    if (!currentUser || !lessonId) return;
    setIsCompleting(true);
    try {
      await demoRepository.completeLesson(currentUser.id, lessonId);
      setCompletionSuccess(true);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to complete lesson', err);
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading lesson content">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  if (!lesson || !course) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-4">
        <Link
          to={courseId ? `/learn/${courseId}` : '/learn'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course Directory</span>
        </Link>
        <Card className="p-8 text-center space-y-4 border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-slate-900">Lesson Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The requested lesson module "{lessonId}" could not be located in this curriculum track.
          </p>
          <div className="pt-2">
            <Button size="sm" variant="primary" onClick={() => navigate(courseId ? `/learn/${courseId}` : '/learn')}>
              Return to Course
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isUhv = course?.track === 'uhv';
  const isCompleted = enrolment?.completedLessonIds.includes(lesson.id) || completionSuccess;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back to course breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to={isUhv ? '/uhv' : `/learn/${course.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isUhv ? 'Back to Universal Human Values' : `Back to ${course.title}`}</span>
        </Link>
        <div className="flex items-center gap-2">
          <PointOfUseRulesButton
            moduleName="Lesson"
            triggerText="Rules"
            modalTitle={`${lesson.title} — Lesson Rules`}
            description="Guidelines governing lesson completion and reflections."
            rules={[
              {
                title: isUhv ? 'Personal Study Reflection' : 'Interactive Lesson Completion',
                description: isUhv
                  ? 'Your reflection is stored locally in your private journal and not submitted for grading.'
                  : 'Complete the lesson activities to mark this unit done and advance course progress.',
              },
              {
                title: 'Credit Invariant',
                description: isUhv
                  ? 'UHV lessons carry 0 credits by design to ensure unpressured, genuine introspection.'
                  : 'Lessons contribute toward the full course completion credit (+1 Learning Credit).',
              },
            ]}
            testId="lesson-rules-btn"
          />
          {isCompleted && (
            isUhv ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
                Module Completed
              </span>
            ) : (
              <StatusChip status="completed" />
            )
          )}
        </div>
      </div>

      {/* Lesson Header Card */}
      <Card className="border-slate-200 p-6 sm:p-8 space-y-3">
        <span className="text-xs font-semibold text-civic-indigo-600 uppercase tracking-wider">
          {isUhv
            ? `Study Module ${lesson.order} \u2022 ${lesson.estimatedMinutes} Minutes (Personal Study)`
            : `Lesson ${lesson.order} \u2022 ${lesson.estimatedMinutes} Minutes`}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
          {lesson.title}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {lesson.contentSummary}
        </p>

        {/* Learning Objectives */}
        {lesson.learningObjectives.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-civic-indigo-50/60 border border-civic-indigo-100 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-civic-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {isUhv ? 'Inquiry Themes' : 'Learning Objectives'}
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {lesson.learningObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-civic-indigo-600 mt-0.5 shrink-0" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Attribution Banner */}
      {isUhv && <UhvCreditBanner compact />}

      {/* Lesson Reading Sections */}
      <div className="space-y-6">
        {lesson.sections.map((section) => (
          <Card key={section.id} className="border-slate-200 p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold font-heading text-slate-900">
              {section.title}
            </h2>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {section.body}
            </div>
          </Card>
        ))}
      </div>

      {/* Action Footer: Mark Complete + Linked Assignment */}
      <Card className="border-slate-200 p-6 bg-slate-50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold font-heading text-slate-900">
              {isUhv
                ? (isCompleted ? 'Study Module Finished' : 'Finished Reading this Module?')
                : (isCompleted ? 'Lesson Completed!' : 'Finished Reading the Lesson?')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isUhv
                ? (isCompleted
                    ? 'Your module reading progress has been recorded in your private study stream.'
                    : 'Mark as complete to update your self-paced study progress (no Civic Credit Points).')
                : (isCompleted
                    ? 'Your progress has been recorded and Civic Credit Points updated (up to 5 max).'
                    : 'Mark as complete to update your course progress and earn Civic Credit Points.')}
            </p>
          </div>

          {!isCompleted ? (
            <Button
              variant="primary"
              size="md"
              isLoading={isCompleting}
              onClick={handleCompleteLesson}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>{isUhv ? 'Mark Module Complete' : 'Mark Lesson Complete (+1 Civic Credit Point)'}</span>
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isUhv ? 'Study Module Completed' : 'Completed & Verified'}</span>
            </div>
          )}
        </div>

        {/* Linked Assignment Callout */}
        {assignment && (
          <div className="mt-4 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-civic-saffron-50 border border-civic-saffron-200">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-civic-saffron-800 tracking-wider">
                {isUhv ? 'Personal Reflection Prompt' : 'Hands-on Field Practice'}
              </span>
              <h4 className="text-sm font-bold text-slate-900">{assignment.title}</h4>
              <p className="text-xs text-slate-600 line-clamp-1">{assignment.prompt}</p>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveAssignmentId(assignment.id)}
                aria-haspopup="dialog"
                className="shrink-0"
              >
                <span>View Task Card</span>
              </Button>
              <Link to={`/assignments/${assignment.id}`}>
                <Button size="sm" variant="saffron" className="shrink-0">
                  <FileCheck2 className="w-4 h-4 mr-1" />
                  <span>
                    {isUhv
                      ? 'Open Reflection Prompt'
                      : `Go to Assignment (+${assignment.creditsReward} Civic Credit Points)`}
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>

      <AssignmentTaskCard
        assignmentId={activeAssignmentId || ''}
        isOpen={Boolean(activeAssignmentId)}
        onClose={() => setActiveAssignmentId(null)}
      />
    </div>
  );
};
