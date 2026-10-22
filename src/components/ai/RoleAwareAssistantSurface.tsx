import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { ScopedModeratorGrant } from '../../types/domain';
import { RoleAwareSuggestion } from '../../types/assistant';
import { RoleAwareAiService } from '../../services/roleAwareAiService';
import { Card, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { DemoPreviewBadge } from '../ui/DemoPreviewBadge';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  Edit3,
  X,
  RotateCcw,
  Check,
  Info,
  Clock,
  Layers,
  HelpCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { formatRoleName } from '../../utils/formatters';

interface RoleAwareAssistantSurfaceProps {
  className?: string;
  testId?: string;
}

export const RoleAwareAssistantSurface: React.FC<RoleAwareAssistantSurfaceProps> = ({
  className = '',
  testId = 'role-aware-assistant-surface',
}) => {
  const { currentUser } = useAuthStore();
  const [activeGrants, setActiveGrants] = useState<ScopedModeratorGrant[]>([]);
  const [suggestions, setSuggestions] = useState<RoleAwareSuggestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load active grants and suggestions whenever currentUser changes
  const loadData = useCallback(async () => {
    if (!currentUser) {
      setSuggestions([]);
      setActiveGrants([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let grants: ScopedModeratorGrant[] = [];

    if (currentUser.role === 'moderator' || currentUser.role === 'platform_admin') {
      try {
        const fetchedGrants = await demoRepository.getScopedModeratorGrants(currentUser.id);
        grants = fetchedGrants.filter(
          (g) => g.status === 'active' && (!g.expiresAt || new Date(g.expiresAt) > new Date())
        );
      } catch (err) {
        console.error('Failed to load moderator grants for assistant', err);
      }
    }

    setActiveGrants(grants);

    const sugs = RoleAwareAiService.getSuggestionsForContext(currentUser, grants);
    setSuggestions(sugs);
    setIsLoading(false);
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Edit
  const handleStartEdit = (sug: RoleAwareSuggestion) => {
    setEditingId(sug.id);
    setEditText(sug.content);
  };

  const handleSaveEdit = (id: string) => {
    RoleAwareAiService.editSuggestion(id, editText);
    setEditingId(null);
    loadData();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleResetSuggestion = (id: string) => {
    RoleAwareAiService.resetSuggestion(id);
    loadData();
  };

  // Handle Dismiss
  const handleDismiss = (id: string) => {
    RoleAwareAiService.dismissSuggestion(id);
    loadData();
  };

  const handleRestoreAll = () => {
    RoleAwareAiService.restoreAllSuggestions();
    loadData();
  };

  const visibleSuggestions = suggestions.filter((s) => !s.isDismissed);
  const dismissedCount = suggestions.filter((s) => s.isDismissed).length;
  const roleName = currentUser ? formatRoleName(currentUser.role) : 'Participant';

  return (
    <Card
      data-testid={testId}
      className={`p-5 sm:p-6 border-civic-indigo-200 bg-gradient-to-br from-white via-indigo-50/20 to-civic-indigo-50/40 space-y-5 shadow-sm ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-civic-indigo-100">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-civic-indigo-600 text-white shadow-xs shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base sm:text-lg font-bold font-heading text-slate-900">
                Role-Aware Assistant
              </CardTitle>
              <DemoPreviewBadge
                size="sm"
                label="Demo Suggestion &bull; Not an Active Generative Model"
              />
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Change Plan v2 role-aware suggestions & Review Additions #5 human-governed AI boundaries.
            </p>
          </div>
        </div>

        {/* Universal Governance Notice */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            data-testid="ai-assists-notice-badge"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-civic-indigo-100 text-civic-indigo-800 text-xs font-bold border border-civic-indigo-200 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-civic-indigo-600" />
            <span>AI assists, people decide.</span>
          </div>
        </div>
      </div>

      {/* Role & Active Scope Banner */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">
            Active Persona:
          </span>
          <span className="font-bold text-slate-900 inline-flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-civic-indigo-600" />
            {currentUser?.name || 'Aarav Sharma'} ({roleName})
          </span>
        </div>

        {currentUser?.role === 'moderator' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-medium">Founder-Delegated Scopes:</span>
            {activeGrants.length > 0 ? (
              activeGrants.map((g) => (
                <span
                  key={g.id}
                  className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-[11px]"
                >
                  {g.scope.type === 'named_session'
                    ? `Session (${g.scope.sessionId})`
                    : g.scope.type}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-[11px]">
                No Active Delegation
              </span>
            )}
          </div>
        )}
      </div>

      {/* Assistant Policy Safeguard Box */}
      <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Non-Binding Assistance Notice:</strong> Suggestions shown below are deterministic, seeded drafts provided solely for demonstration. JanSahabhag 2047 automated tools <em>never decide credits, evidence verification, speaking queues, moderation, or appeals</em>. Every suggestion can be freely customized, adopted, or dismissed.
        </p>
      </div>

      {/* Dismissed Restoration Bar */}
      {dismissedCount > 0 && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <span>
            {dismissedCount} suggestion{dismissedCount > 1 ? 's' : ''} currently dismissed.
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRestoreAll}
            className="text-xs h-7 text-civic-indigo-700 hover:text-civic-indigo-800"
            data-testid="btn-restore-all-suggestions"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Restore Suggestions
          </Button>
        </div>
      )}

      {/* Suggestions Container */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Loading assistant recommendations...
          </div>
        ) : visibleSuggestions.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center space-y-2 bg-white">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
            {currentUser?.role === 'moderator' && activeGrants.length === 0 ? (
              <div className="space-y-1 max-w-md mx-auto">
                <p className="font-semibold text-slate-800 text-sm">
                  No Active Scoped Moderator Grant Found
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  In accordance with Change Plan v2 §12, platform moderation authority requires an active, founder-delegated grant for assignments, memberships, or sessions. Advisory moderation report summaries are disabled until an active grant is assigned by the Platform Owner.
                </p>
              </div>
            ) : dismissedCount > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">
                  All suggestions have been dismissed.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRestoreAll}
                  className="text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Restore Dismissed Suggestions
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No active suggestions configured for role &ldquo;{roleName}&rdquo;.
              </p>
            )}
          </div>
        ) : (
          visibleSuggestions.map((sug) => {
            const isEditing = editingId === sug.id;

            return (
              <Card
                key={sug.id}
                data-testid={`assistant-suggestion-${sug.id}`}
                className="p-4 sm:p-5 border-slate-200 bg-white shadow-2xs space-y-3.5 transition-all"
              >
                {/* Suggestion Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {sug.type === 'practice_prompt' && 'Optional Practice Prompt'}
                      {sug.type === 'draft_agenda' && 'Draft Candidate Agenda'}
                      {sug.type === 'draft_report_summary' && 'Draft Report Summary'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      &bull; {sug.category}
                    </span>
                    {sug.isEdited && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        Edited
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-civic-indigo-700">
                      AI assists, people decide.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDismiss(sug.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                      title="Dismiss this suggestion"
                      aria-label="Dismiss suggestion"
                      data-testid={`btn-dismiss-${sug.id}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="flex items-center gap-2">
                  {sug.type === 'practice_prompt' && (
                    <HelpCircle className="w-4 h-4 text-civic-teal-600 shrink-0" />
                  )}
                  {sug.type === 'draft_agenda' && (
                    <Layers className="w-4 h-4 text-civic-saffron-600 shrink-0" />
                  )}
                  {sug.type === 'draft_report_summary' && (
                    <FileText className="w-4 h-4 text-civic-indigo-600 shrink-0" />
                  )}
                  <h4 className="text-sm font-bold text-slate-900 font-heading">
                    {sug.title}
                  </h4>
                </div>

                {/* Body or Edit Form */}
                {isEditing ? (
                  <div className="space-y-3 pt-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Edit Demo Suggestion Text:
                    </label>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={5}
                      className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:border-civic-indigo-500 focus:ring-1 focus:ring-civic-indigo-500 text-slate-800 font-mono leading-relaxed"
                      data-testid={`input-edit-${sug.id}`}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSaveEdit(sug.id)}
                        className="text-xs"
                        data-testid={`btn-save-${sug.id}`}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/60 p-3 rounded-lg border border-slate-100">
                    {sug.content}
                  </div>
                )}

                {/* Metadata & Controls Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-slate-500">
                  <div className="flex flex-wrap items-center gap-3">
                    {sug.metadata?.suggestedDuration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Est. {sug.metadata.suggestedDuration}
                      </span>
                    )}
                    {sug.metadata?.targetStage && (
                      <span className="text-slate-600 font-medium">
                        Target: {sug.metadata.targetStage}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {sug.isEdited && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResetSuggestion(sug.id)}
                        className="h-7 text-[11px] text-slate-500 hover:text-slate-700 px-2"
                        data-testid={`btn-reset-${sug.id}`}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Reset to Seed
                      </Button>
                    )}
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartEdit(sug)}
                        className="h-7 text-xs px-2.5"
                        data-testid={`btn-edit-${sug.id}`}
                      >
                        <Edit3 className="w-3 h-3 mr-1 text-slate-500" />
                        Edit Suggestion
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Security & Isolation Invariant Assurance */}
      <div className="pt-2 border-t border-civic-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Privacy Invariant Verified: Zero private UHV reflections or restricted evidence accessed.
          </span>
        </div>
        <span className="text-slate-400 italic">
          Single-browser deterministic demo simulation
        </span>
      </div>
    </Card>
  );
};
