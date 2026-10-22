import { ModeratorScopeType, UserRole } from './domain';

export type RoleAwareSuggestionType =
  | 'practice_prompt'
  | 'draft_agenda'
  | 'draft_report_summary';

export interface RoleAwareSuggestion {
  id: string;
  type: RoleAwareSuggestionType;
  title: string;
  category: string;
  content: string;
  roleTarget: UserRole | 'participant' | 'facilitator' | 'moderator' | string;
  scopeType?: ModeratorScopeType;
  scopeSessionId?: string;
  originalContent: string;
  isDismissed?: boolean;
  isEdited?: boolean;
  metadata?: {
    suggestedDuration?: string;
    targetStage?: string;
    pedagogicalObjective?: string;
    itemCount?: number;
    auditBoundaryNote?: string;
  };
}

export interface AssistantEvaluationContext {
  userId: string;
  role: UserRole | string;
  name: string;
  activeScopes: ModeratorScopeType[];
  sessionId?: string;
}
