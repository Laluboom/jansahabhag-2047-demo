import { RoleAwareSuggestion } from '../types/assistant';
import { DemoDatabase, ScopedModeratorGrant, User } from '../types/domain';
import { PersistenceService } from './persistence';

// Local storage key for persistent edits / dismissals across demo sessions
const STORAGE_KEY = 'jansahabhag_ai_assistant_edits_v1';

interface StoredSuggestionState {
  editedContents: Record<string, string>;
  dismissedIds: string[];
}

function loadStoredState(): StoredSuggestionState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { editedContents: {}, dismissedIds: [] };
    const parsed = JSON.parse(raw);
    return {
      editedContents: parsed.editedContents || {},
      dismissedIds: Array.isArray(parsed.dismissedIds) ? parsed.dismissedIds : [],
    };
  } catch {
    return { editedContents: {}, dismissedIds: [] };
  }
}

function saveStoredState(state: StoredSuggestionState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Deterministic seeded suggestions conforming to:
 * - Change Plan v2 §15: Role-aware AI mock
 * - Review Additions #5: AI boundaries, non-binding notice, and human decision primacy
 *
 * Invariant: Never reads, ingests, or leaks private UHV reflections or restricted evidence.
 */
export const SEEDED_ROLE_SUGGESTIONS: RoleAwareSuggestion[] = [
  // --------------------------------------------------------------------------
  // PARTICIPANT SUGGESTIONS: Optional practice prompts
  // --------------------------------------------------------------------------
  {
    id: 'sug_part_prompt_01',
    type: 'practice_prompt',
    title: 'Practice Prompt: Opening Deliberation Statement',
    category: 'Deliberation Preparation',
    roleTarget: 'participant',
    originalContent:
      'Draft a 60-second opening statement on the Kalawad Road Ward 8 pedestrian-safety proposal. Focus on shared student safety, cite observed peak morning traffic counts, and acknowledge local merchant loading requirements without assigning blame.',
    content:
      'Draft a 60-second opening statement on the Kalawad Road Ward 8 pedestrian-safety proposal. Focus on shared student safety, cite observed peak morning traffic counts, and acknowledge local merchant loading requirements without assigning blame.',
    metadata: {
      targetStage: 'Stage 3: Deliberation & Floor Debate',
      suggestedDuration: '60–90 seconds',
      pedagogicalObjective: 'Evidence-backed articulation and non-adversarial civic dialogue',
      auditBoundaryNote: 'Optional student practice prompt. Does not affect credits, grading, or speaking queue.',
    },
  },
  {
    id: 'sug_part_prompt_02',
    type: 'practice_prompt',
    title: 'Practice Prompt: Addressing Stakeholder Trade-offs',
    category: 'Constructive Synthesis',
    roleTarget: 'participant',
    originalContent:
      'How would you answer shopkeepers who worry that raised speed tables might slow down commercial deliveries? Formulate two constructive compromises, such as 30-minute dedicated delivery windows before and after school bell hours.',
    content:
      'How would you answer shopkeepers who worry that raised speed tables might slow down commercial deliveries? Formulate two constructive compromises, such as 30-minute dedicated delivery windows before and after school bell hours.',
    metadata: {
      targetStage: 'Stage 4: Dissent Recording & Reconciled Amendments',
      suggestedDuration: '2 minutes',
      pedagogicalObjective: 'Empathy-driven consensus building and multi-stakeholder problem solving',
      auditBoundaryNote: 'Practice prompt only. All decisions remain with participants.',
    },
  },
  {
    id: 'sug_part_prompt_03',
    type: 'practice_prompt',
    title: 'Practice Prompt: Drafting a Measurable Proposition Clause',
    category: 'Policy Formulation',
    roleTarget: 'participant',
    originalContent:
      'Formulate a clear 2-sentence proposition clause directing the Rajkot Municipal Corporation (RMC) Zone 8 engineering team to install raised pedestrian crossings outside Virani Science College, specifying a target completion timeline and monitoring criteria.',
    content:
      'Formulate a clear 2-sentence proposition clause directing the Rajkot Municipal Corporation (RMC) Zone 8 engineering team to install raised pedestrian crossings outside Virani Science College, specifying a target completion timeline and monitoring criteria.',
    metadata: {
      targetStage: 'Stage 5: Final Proposition Voting',
      pedagogicalObjective: 'Actionable civic drafting and municipal alignment',
      auditBoundaryNote: 'Draft formulation aid only. Proposition voting is conducted by human members.',
    },
  },

  // --------------------------------------------------------------------------
  // FACILITATOR SUGGESTIONS: Draft candidate agendas
  // --------------------------------------------------------------------------
  {
    id: 'sug_facil_agenda_01',
    type: 'draft_agenda',
    title: 'Draft Candidate Agenda: Ward 8 Rajkot Youth Assembly',
    category: 'Session Planning & Procedure',
    roleTarget: 'facilitator',
    originalContent:
      'Proposed 6-Stage Deliberation Schedule (90 mins total):\n' +
      '• Stage 1 (10m): Call to order, verification of quorum and 33% female allocation check, standing orders overview.\n' +
      '• Stage 2 (15m): Review of student pedestrian survey data and verified field observations.\n' +
      '• Stage 3 (30m): Alternating floor speeches across For / Against benches (max 2 mins per speaker).\n' +
      '• Stage 4 (15m): Dissent preservation and synthesis of compromise amendments with local merchants.\n' +
      '• Stage 5 (15m): Final vote on Draft Proposition Prop-RKT-2026-001 by secret ballot.\n' +
      '• Stage 6 (5m): Adjournment, summary recording, and Civic Passport credit confirmation.',
    content:
      'Proposed 6-Stage Deliberation Schedule (90 mins total):\n' +
      '• Stage 1 (10m): Call to order, verification of quorum and 33% female allocation check, standing orders overview.\n' +
      '• Stage 2 (15m): Review of student pedestrian survey data and verified field observations.\n' +
      '• Stage 3 (30m): Alternating floor speeches across For / Against benches (max 2 mins per speaker).\n' +
      '• Stage 4 (15m): Dissent preservation and synthesis of compromise amendments with local merchants.\n' +
      '• Stage 5 (15m): Final vote on Draft Proposition Prop-RKT-2026-001 by secret ballot.\n' +
      '• Stage 6 (5m): Adjournment, summary recording, and Civic Passport credit confirmation.',
    metadata: {
      suggestedDuration: '90 minutes',
      itemCount: 6,
      auditBoundaryNote:
        'Advisory candidate agenda only. The human facilitator retains sole discretion to modify, reorder, or adapt proceedings.',
    },
  },
  {
    id: 'sug_facil_agenda_02',
    type: 'draft_agenda',
    title: 'Draft Candidate Agenda: Rapid Parliamentary Debate Practice',
    category: 'Debate Chamber Schedule',
    roleTarget: 'facilitator',
    originalContent:
      'Debate Chamber Standing Orders (45 mins):\n' +
      '1. Motion Introduction: "Municipal Speed Tables vs. Automated Camera Enforcement" (5 mins)\n' +
      '2. Government Opening Argument & Opposition Reply (10 mins each)\n' +
      '3. Cross-Bench Interpellations & Point of Information turns (10 mins)\n' +
      '4. Floor Division Vote & Speaker Concluding Reflections (10 mins)',
    content:
      'Debate Chamber Standing Orders (45 mins):\n' +
      '1. Motion Introduction: "Municipal Speed Tables vs. Automated Camera Enforcement" (5 mins)\n' +
      '2. Government Opening Argument & Opposition Reply (10 mins each)\n' +
      '3. Cross-Bench Interpellations & Point of Information turns (10 mins)\n' +
      '4. Floor Division Vote & Speaker Concluding Reflections (10 mins)',
    metadata: {
      suggestedDuration: '45 minutes',
      itemCount: 4,
      auditBoundaryNote:
        'Advisory debate sequence. Human speaker queue controls decide active turns.',
    },
  },

  // --------------------------------------------------------------------------
  // SCOPED MODERATOR SUGGESTIONS: Draft report summaries (by scope)
  // Labeled clearly as fictional demo structures, not live analytics
  // --------------------------------------------------------------------------
  {
    id: 'sug_mod_summary_asg',
    type: 'draft_report_summary',
    title: 'Draft Report Summary: Public Field Submissions',
    category: 'Assignments Moderation Synthesis',
    roleTarget: 'moderator',
    scopeType: 'assignments',
    originalContent:
      'Draft Report Summary (Fictional Demonstration Sample):\n' +
      '• Illustrative Log Digest: Demonstrates report layout (sample scenario: fictional public submissions for Safe Streets demo campaign).\n' +
      '• Illustrative Observation Pattern: Sample pattern showing how speed trends in school corridors would be formatted for review.\n' +
      '• Media Consent Verification: Format for showing media compliance flags (illustrative demo check; actual evidence verification is strictly performed by human reviewers).\n' +
      '• Data Privacy Safeguard: Strict boundary verified — 0 private student vault records and 0 private UHV reflection logs were accessed or included in this advisory synthesis.\n' +
      '• Advisory Note for Moderator: Illustrative queue flag (sample note: 2 duplicate tags flagged for human check; AI makes no binding determinations).',
    content:
      'Draft Report Summary (Fictional Demonstration Sample):\n' +
      '• Illustrative Log Digest: Demonstrates report layout (sample scenario: fictional public submissions for Safe Streets demo campaign).\n' +
      '• Illustrative Observation Pattern: Sample pattern showing how speed trends in school corridors would be formatted for review.\n' +
      '• Media Consent Verification: Format for showing media compliance flags (illustrative demo check; actual evidence verification is strictly performed by human reviewers).\n' +
      '• Data Privacy Safeguard: Strict boundary verified — 0 private student vault records and 0 private UHV reflection logs were accessed or included in this advisory synthesis.\n' +
      '• Advisory Note for Moderator: Illustrative queue flag (sample note: 2 duplicate tags flagged for human check; AI makes no binding determinations).',
    metadata: {
      auditBoundaryNote:
        'Advisory report summary only. Human moderator conducts actual review. AI does not decide verification, credits, or sanctions.',
    },
  },
  {
    id: 'sug_mod_summary_mem',
    type: 'draft_report_summary',
    title: 'Draft Report Summary: Workspace Conduct & Channels',
    category: 'Workspace Conduct Synthesis',
    roleTarget: 'moderator',
    scopeType: 'memberships',
    originalContent:
      'Draft Report Summary (Fictional Demonstration Sample):\n' +
      '• Fictional Workspace Digest Layout: Illustrates workspace conduct monitoring format (sample groups: Safe Streets team and student councils).\n' +
      '• Decorum Monitoring Format: Demonstrates channel activity and decorum reporting (illustrative demo scenario; no disciplinary actions taken by automated tools).\n' +
      '• Safeguard Compliance Reminder: Open channel transparency enforced; direct unmoderated private messaging is disabled by platform rules.\n' +
      '• Data Privacy Boundary: Zero private student vaults or personal UHV self-reflection journals are accessed or ingested.\n' +
      '• Advisory Note for Moderator: Illustrative queue summary for human moderator review; human decision primacy strictly maintained.',
    content:
      'Draft Report Summary (Fictional Demonstration Sample):\n' +
      '• Fictional Workspace Digest Layout: Illustrates workspace conduct monitoring format (sample groups: Safe Streets team and student councils).\n' +
      '• Decorum Monitoring Format: Demonstrates channel activity and decorum reporting (illustrative demo scenario; no disciplinary actions taken by automated tools).\n' +
      '• Safeguard Compliance Reminder: Open channel transparency enforced; direct unmoderated private messaging is disabled by platform rules.\n' +
      '• Data Privacy Boundary: Zero private student vaults or personal UHV self-reflection journals are accessed or ingested.\n' +
      '• Advisory Note for Moderator: Illustrative queue summary for human moderator review; human decision primacy strictly maintained.',
    metadata: {
      auditBoundaryNote:
        'Advisory digest only. Any membership status modifications or warnings are issued solely by authorized human moderators.',
    },
  },
  {
    id: 'sug_mod_summary_ses',
    type: 'draft_report_summary',
    title: 'Draft Report Summary: Session sess_jaipur_01 Decorum',
    category: 'Session Decorum Synthesis',
    roleTarget: 'moderator',
    scopeType: 'named_session',
    scopeSessionId: 'sess_jaipur_01',
    originalContent:
      'Draft Report Summary (Fictional Demonstration Sample):\n' +
      '• Fictional Session Decorum Layout: Illustrative format for session sess_jaipur_01 deliberative standing order review.\n' +
      '• Sample Turn Timing Digest: Demonstrates presentation of floor speech durations (fictional example figures for demo illustration).\n' +
      '• Recording Rule Adherence: Format for logging media recording complaints (illustrative demo check; no recording permitted without facilitator consent).\n' +
      '• Boundary Confirmation: Student personal reflection journals and private UHV values reflections were not accessed or processed.\n' +
      '• Advisory Note for Moderator: Illustrative summary prepared for human session co-moderator; automated AI never decides speaking order or sanctions.',
    content:
      'Draft Report Summary (Fictional Demonstration Sample):\n' +
      '• Fictional Session Decorum Layout: Illustrative format for session sess_jaipur_01 deliberative standing order review.\n' +
      '• Sample Turn Timing Digest: Demonstrates presentation of floor speech durations (fictional example figures for demo illustration).\n' +
      '• Recording Rule Adherence: Format for logging media recording complaints (illustrative demo check; no recording permitted without facilitator consent).\n' +
      '• Boundary Confirmation: Student personal reflection journals and private UHV values reflections were not accessed or processed.\n' +
      '• Advisory Note for Moderator: Illustrative summary prepared for human session co-moderator; automated AI never decides speaking order or sanctions.',
    metadata: {
      auditBoundaryNote:
        'Advisory summary only. Session facilitator and moderator retain exclusive authority over speaking turns and decorum determinations.',
    },
  },
];

export class RoleAwareAiService {
  /**
   * Retrieves role-aware suggestions according to user role and active moderator grants.
   * Strictly enforces data boundaries:
   * - No private evidence files
   * - No private UHV reflections
   * - No binding decisions
   */
  public static getSuggestionsForContext(
    user: User | null | undefined,
    activeGrants: ScopedModeratorGrant[] = [],
    _db?: DemoDatabase
  ): RoleAwareSuggestion[] {
    if (!user) return [];

    const state = loadStoredState();
    const db = _db || PersistenceService.loadDatabase();
    const isSessionFacilitator = Boolean(db?.sessions?.some((s) => s.facilitatorId === user.id));
    const effectiveRole =
      user.role === 'participant' && isSessionFacilitator ? 'facilitator' : user.role || 'participant';

    let candidates: RoleAwareSuggestion[] = [];

    if (effectiveRole === 'participant') {
      candidates = SEEDED_ROLE_SUGGESTIONS.filter((s) => s.roleTarget === 'participant');
    } else if (effectiveRole === 'facilitator') {
      candidates = SEEDED_ROLE_SUGGESTIONS.filter((s) => s.roleTarget === 'facilitator');
    } else if (effectiveRole === 'moderator') {
      // Must respect active scope from scoped moderator grants (Change Plan v2 §12)
      // Strictly verify granteeId matches user.id, status is active, and unexpired
      const now = new Date();
      const validActiveGrants = activeGrants.filter(
        (g) =>
          g.granteeId === user.id &&
          g.status === 'active' &&
          (!g.expiresAt || new Date(g.expiresAt) > now)
      );

      const hasAssignmentsScope = validActiveGrants.some((g) => g.scope.type === 'assignments');
      const hasMembershipsScope = validActiveGrants.some((g) => g.scope.type === 'memberships');
      const activeSessionIds = new Set(
        validActiveGrants
          .filter((g) => g.scope.type === 'named_session' && g.scope.sessionId)
          .map((g) => g.scope.sessionId as string)
      );

      candidates = SEEDED_ROLE_SUGGESTIONS.filter((s) => {
        if (s.roleTarget !== 'moderator') return false;
        if (s.scopeType === 'assignments') return hasAssignmentsScope;
        if (s.scopeType === 'memberships') return hasMembershipsScope;
        if (s.scopeType === 'named_session') {
          // Exact session ID check: only show if the moderator holds a grant for this specific session
          return Boolean(s.scopeSessionId && activeSessionIds.has(s.scopeSessionId));
        }
        return false;
      });
    } else {
      // General informational fallback for other administrative or institution roles
      candidates = [];
    }

    // Apply stored edits and dismissals
    return candidates.map((cand) => {
      const isDismissed = state.dismissedIds.includes(cand.id);
      const editedText = state.editedContents[cand.id];
      const isEdited = typeof editedText === 'string';

      return {
        ...cand,
        content: isEdited ? editedText : cand.originalContent,
        isDismissed,
        isEdited,
      };
    });
  }

  /**
   * Edits a suggestion's content in local demo storage.
   */
  public static editSuggestion(id: string, newContent: string): void {
    const state = loadStoredState();
    state.editedContents[id] = newContent;
    saveStoredState(state);
  }

  /**
   * Resets an edited suggestion back to its original seeded content.
   */
  public static resetSuggestion(id: string): void {
    const state = loadStoredState();
    delete state.editedContents[id];
    saveStoredState(state);
  }

  /**
   * Dismisses a suggestion from view.
   */
  public static dismissSuggestion(id: string): void {
    const state = loadStoredState();
    if (!state.dismissedIds.includes(id)) {
      state.dismissedIds.push(id);
      saveStoredState(state);
    }
  }

  /**
   * Restores all dismissed suggestions.
   */
  public static restoreAllSuggestions(): void {
    const state = loadStoredState();
    state.dismissedIds = [];
    saveStoredState(state);
  }

  /**
   * Clears all stored edits and dismissals (resets to fresh seed state).
   */
  public static resetAll(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Privacy verification invariant check:
   * Asserts that a given string or object does NOT contain private UHV reflection content
   * or restricted private student vault evidence.
   */
  public static verifyContentExcludesPrivateData(
    text: string,
    privateMarkers: string[] = [
      'harmony in relationships',
      'Personal notes exploring harmony',
      'Self-inquiry observations on family harmony',
      'unblurred face photo',
      'restricted facial media',
      'secret student diary',
    ]
  ): boolean {
    const lower = text.toLowerCase();
    for (const marker of privateMarkers) {
      if (lower.includes(marker.toLowerCase())) {
        return false;
      }
    }
    return true;
  }
}
