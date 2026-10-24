import React, { useState } from 'react';
import { ProjectMilestone, ProjectStatus } from '../../types/domain';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';
import {
  Target,
  CheckCircle2,
  Calendar,
  Award,
  AlertCircle,
  LayoutGrid,
  List,
} from 'lucide-react';

interface ProjectBoardProps {
  milestones: ProjectMilestone[];
  isUpdating: boolean;
  onCompleteMilestone: (milestoneId: string) => Promise<void> | void;
  projectStatus: ProjectStatus;
}

export const ProjectBoard: React.FC<ProjectBoardProps> = ({
  milestones,
  isUpdating,
  onCompleteMilestone,
  projectStatus: _projectStatus,
}) => {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Derive column items from actual milestones
  const completedMilestones = milestones.filter((m) => m.isCompleted);
  const pendingMilestones = milestones.filter((m) => !m.isCompleted);

  // In the single-browser model without multi-user task locking,
  // the first incomplete milestone represents active field execution ("Doing"),
  // and subsequent ones represent queued milestones ("To do").
  const doingMilestones = pendingMilestones.length > 0 ? [pendingMilestones[0]] : [];
  const todoMilestones = pendingMilestones.length > 1 ? pendingMilestones.slice(1) : [];

  const completedCount = completedMilestones.length;
  const totalCount = milestones.length;

  return (
    <Card className="border-slate-200 p-5 sm:p-6 space-y-5 bg-white shadow-sm" data-testid="project-team-board">
      {/* Board Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-civic-saffron-600" />
              <span>Milestone & Task Execution Board</span>
            </h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {completedCount}/{totalCount} Completed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Glanceable three-column operational board derived from verified project milestones.
          </p>
        </div>

        {/* View Toggle Controls: Board vs List Fallback */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-start sm:self-auto" role="group" aria-label="Board display mode">
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'board'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            data-testid="toggle-board-view"
            aria-pressed={viewMode === 'board'}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Board View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            data-testid="toggle-list-view"
            aria-pressed={viewMode === 'list'}
          >
            <List className="w-3.5 h-3.5" />
            <span>List Fallback</span>
          </button>
        </div>
      </div>

      {/* Illustrative Backend Status Notice */}
      <div
        className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2"
        data-testid="illustrative-stage-notice"
      >
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Single-Browser Local Simulation:</span>{' '}
          The "Doing" column reflects derived illustrative execution for active field tracking.
          The browser demo backend tracks verified completed milestones versus pending milestones without multi-user task locking.
        </div>
      </div>

      {/* 1. Kanban Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="kanban-columns-container">
          {/* Column 1: To do */}
          <div className="space-y-3 flex flex-col min-w-0" data-testid="column-todo">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">To do</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600" data-testid="count-todo">
                {todoMilestones.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[140px] p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
              {todoMilestones.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No upcoming milestones queued.
                </div>
              ) : (
                todoMilestones.map((ms) => (
                  <div
                    key={ms.id}
                    data-testid={`milestone-card-${ms.id}`}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5 hover:border-slate-300 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 font-heading text-xs leading-snug">
                        {ms.title}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        Queue
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3">
                      {ms.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Due: {formatDate(ms.dueDate)}</span>
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs h-7"
                        disabled={isUpdating}
                        onClick={() => onCompleteMilestone(ms.id)}
                        data-testid={`btn-complete-${ms.id}`}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1 text-slate-400" />
                        <span>Mark Complete (+2)</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Doing */}
          <div className="space-y-3 flex flex-col min-w-0" data-testid="column-doing">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-civic-saffron-500 ring-2 ring-civic-saffron-200" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Doing</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                  Illustrative
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-civic-saffron-100 text-civic-saffron-900" data-testid="count-doing">
                  {doingMilestones.length}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-h-[140px] p-2.5 rounded-xl bg-civic-saffron-50/40 border border-civic-saffron-200">
              {doingMilestones.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-civic-saffron-200 text-center text-xs text-civic-saffron-700">
                  {completedCount === totalCount
                    ? 'All milestones completed! Project achieved.'
                    : 'No active milestone in execution.'}
                </div>
              ) : (
                doingMilestones.map((ms) => (
                  <div
                    key={ms.id}
                    data-testid={`milestone-card-${ms.id}`}
                    className="p-3.5 rounded-xl bg-white border-2 border-civic-saffron-300 shadow-xs space-y-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 font-heading text-xs leading-snug">
                        {ms.title}
                      </h4>
                      <span className="text-[10px] font-bold text-civic-saffron-800 bg-civic-saffron-100 px-1.5 py-0.5 rounded shrink-0">
                        In Progress
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {ms.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-civic-saffron-600" />
                        <span>Target: {formatDate(ms.dueDate)}</span>
                      </span>

                      <Button
                        size="sm"
                        variant="saffron"
                        className="w-full text-xs h-7 shadow-xs"
                        isLoading={isUpdating}
                        onClick={() => onCompleteMilestone(ms.id)}
                        data-testid={`btn-complete-${ms.id}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        <span>Mark Complete (+2 Civic Credit Points)</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Done */}
          <div className="space-y-3 flex flex-col min-w-0" data-testid="column-done">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Done</h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800" data-testid="count-done">
                {completedMilestones.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[140px] p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-200">
              {completedMilestones.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-emerald-200 text-center text-xs text-emerald-700">
                  No verified milestones completed yet.
                </div>
              ) : (
                completedMilestones.map((ms) => (
                  <div
                    key={ms.id}
                    data-testid={`milestone-card-${ms.id}`}
                    className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 font-heading text-xs leading-snug">
                        {ms.title}
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                        Achieved
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                      {ms.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      {ms.completedAt && (
                        <span className="text-[10px] text-emerald-700 block font-medium">
                          Completed on {formatDate(ms.completedAt)}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                        <Award className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>+2 Civic Action Awarded</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Accessible Linear List Fallback View */}
      {viewMode === 'list' && (
        <div className="space-y-3" data-testid="milestones-list-fallback">
          {milestones.map((ms, idx) => {
            const isDoing = doingMilestones.some((d) => d.id === ms.id);
            const isTodo = todoMilestones.some((t) => t.id === ms.id);
            const isDone = ms.isCompleted;

            return (
              <div
                key={ms.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : isDoing
                    ? 'border-civic-saffron-300 bg-civic-saffron-50/30'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-700'
                        : isDoing
                        ? 'bg-civic-saffron-100 text-civic-saffron-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 font-heading">{ms.title}</h4>
                      {isDone && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          Done
                        </span>
                      )}
                      {isDoing && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          Doing (Illustrative)
                        </span>
                      )}
                      {isTodo && (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          To do
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{ms.description}</p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Due: {formatDate(ms.dueDate)}</span>
                      {ms.completedAt && (
                        <span className="text-emerald-700">&bull; Finished {formatDate(ms.completedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  {!isDone ? (
                    <Button
                      size="sm"
                      variant={isDoing ? 'saffron' : 'outline'}
                      isLoading={isUpdating}
                      onClick={() => onCompleteMilestone(ms.id)}
                      data-testid={`btn-list-complete-${ms.id}`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      <span>Mark Complete (+2 Civic Credit Points)</span>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-100 px-2.5 py-1 rounded-lg">
                      <Award className="w-3.5 h-3.5" />
                      <span>+2 Civic Action</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
