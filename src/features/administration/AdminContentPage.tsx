import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { demoRepository } from '../../services/demoRepository';
import { Course } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, BookOpen, Clock, Layers } from 'lucide-react';

export const AdminContentPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Command</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-civic-indigo-600" />
          <span>Curriculum & Content Management</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review curriculum modules, lesson sections, and field assignment prompts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <Card key={c.id} className="p-5 border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">{c.code}</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {c.track}
              </span>
            </div>
            <CardTitle className="text-base font-bold text-slate-900">{c.title}</CardTitle>
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{c.description}</p>
            <div className="pt-2 flex items-center gap-3 text-xs text-slate-500 border-t border-slate-100">
              <span>{c.moduleCount} Modules</span>
              <span>&bull;</span>
              <span>{c.lessonCount} Lessons</span>
              <span>&bull;</span>
              <span>{c.estimatedMinutes}m</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
