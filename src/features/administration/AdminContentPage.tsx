import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Course, Lesson, CourseTrack } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Plus,
  X,
  CheckCircle2,
  ListTree,
} from 'lucide-react';

export const AdminContentPage: React.FC = () => {
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lesson Outline Modal State
  const [selectedCourseForOutline, setSelectedCourseForOutline] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  // New Course Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [track, setTrack] = useState<CourseTrack>('civic_academy');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [moduleCount] = useState(3);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const list = await demoRepository.getCourses();
        setCourses(list);
      } catch (err) {
        console.error('Failed to load content', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  const handleOpenOutline = async (course: Course) => {
    setSelectedCourseForOutline(course);
    setIsLoadingLessons(true);
    try {
      const lessons = await demoRepository.getLessons(course.id);
      setCourseLessons(lessons);
    } catch (err) {
      console.error('Failed to load lessons', err);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    try {
      await demoRepository.createCourse({
        programmeId: 'prog_state_civics_2026',
        code: code.trim().toUpperCase(),
        title: title.trim(),
        track,
        level: 'foundational',
        description: description.trim(),
        modules: [],
        moduleCount: Number(moduleCount) || 3,
        lessonCount: 6,
        estimatedMinutes: Number(estimatedMinutes) || 45,
      });
      setIsModalOpen(false);
      setCode('');
      setTitle('');
      setDescription('');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to create course', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Command</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-civic-indigo-600" />
            <span>Curriculum & Content Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review statewide civic learning modules, lesson syllabi, and empirical fieldwork rubrics.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <Card key={c.id} className="p-5 border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-civic-indigo-600 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100">
                  {c.code}
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {c.track}
                </span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900">{c.title}</CardTitle>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{c.description}</p>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <div className="flex items-center gap-3 text-[11px]">
                <span>{c.moduleCount} Modules</span>
                <span>&bull;</span>
                <span>{c.lessonCount} Lessons</span>
                <span>&bull;</span>
                <span>{c.estimatedMinutes}m</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenOutline(c)}
                className="text-[11px] py-1 px-2.5 h-auto"
              >
                <ListTree className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span>Outline</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Lesson Outline Modal */}
      {selectedCourseForOutline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-civic-indigo-600 block">
                  {selectedCourseForOutline.code}
                </span>
                <h3 className="text-base font-bold font-heading text-slate-900">
                  {selectedCourseForOutline.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCourseForOutline(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Lesson Syllabus ({courseLessons.length} units)
              </span>

              {isLoadingLessons ? (
                <div className="p-6 text-center text-xs text-slate-500">Loading syllabus...</div>
              ) : courseLessons.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-lg">
                  No lessons seeded for this custom track yet.
                </div>
              ) : (
                courseLessons.map((l, idx) => (
                  <div key={l.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {idx + 1}. {l.title}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {l.estimatedMinutes}m
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{l.contentSummary}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCourseForOutline(null)}
              >
                Close Outline
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-civic-indigo-600" />
                <span>Add Curriculum Track Course</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CIV-201"
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Municipal Traffic Safety Data Auditing"
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Track / Category
                  </label>
                  <select
                    value={track}
                    onChange={(e) => setTrack(e.target.value as CourseTrack)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500 bg-white"
                  >
                    <option value="civic_academy">Civic Academy</option>
                    <option value="action_skills">Action Skills</option>
                    <option value="uhv">Universal Human Values (UHV)</option>
                    <option value="self_growth">Self Growth & Reflection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    min={10}
                    max={300}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Course Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide syllabus summary and expected field learning outcomes..."
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  <span>Create Course</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
