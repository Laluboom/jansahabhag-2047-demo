import { RoleAwareSuggestion, AssistantEvaluationContext } from '../types/assistant';
import { DemoDatabase, ScopedModeratorGrant, User } from '../types/domain';

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
      'Draft a 60-second opening statement on the Mansarovar Ward 24 pedestrian-safety proposal. Focus on shared student safety, cite observed peak morning traffic counts, and acknowledge local merchant loading requirements without assigning blame.',
    content:
      'Draft a 60-second opening statement on the Mansarovar Ward 24 pedestrian-safety proposal. Focus on shared student safety, cite observed peak morning traffic counts, and acknowledge local merchant loading requirements without assigning blame.',
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
      'Formulate a clear 2-sentence proposition clause directing the Jaipur Municipal Corporation (JMC) Zone 8 engineering team to install raised pedestrian crossings outside Navchetna School, specifying a target completion timeline and monitoring criteria.',
    content:
      'Formulate a clear 2-sentence proposition clause directing the Jaipur Municipal Corporation (JMC) Zone 8 engineering team to install raised pedestrian crossings outside Navchetna School, specifying a target completion timeline and monitoring criteria.',
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
    title: 'Draft Candidate Agenda: Ward 24 Jaipur Youth Assembly',
    category: 'Session Planning & Procedure',
    roleTarget: 'facilitator',
    originalContent:
      'Proposed 6-Stage Deliberation Schedule (90 mins total):\n' +
      '• Stage 1 (10m): Call to order, verification of quorum and 33% female allocation check, standing orders overview.\n' +
      '• Stage 2 (15m): Review of student pedestrian survey data and verified field observations.\n' +
      '• Stage 3 (30m): Alternating floor speeches across For / Against benches (max 2 mins per speaker).\n' +
      '• Stage 4 (15m): Dissent preservation and synthesis of compromise amendments with local merchants.\n' +
      '• Stage 5 (15m): Final vote on Draft Proposition Prop-JPR-2026-001 by secret ballot.\n' +
      '• Stage 6 (5m): Adjournment, summary recording, and Civic Passport credit confirmation.',
    content:
      'Proposed 6-Stage Deliberation Schedule (90 mins total):\n' +
      '• Stage 1 (10m): Call to order, verification of quorum and 33% female allocation check, standing orders overview.\n' +
      '• Stage 2 (15m): Review of student pedestrian survey data and verified field observations.\n' +
      '• Stage 3 (30m): Alternating floor speeches across For / Against benches (max 2 mins per speaker).\n' +
      '• Stage 4 (15m): Dissent preservation and synthesis of compromise amendments with local merchants.\n' +
      '• Stage 5 (15m): Final vote on Draft Proposition Prop-JPR-2026-001 by secret ballot.\n' +
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
  // --------------------------------------------------------------------------
  {
    id: 'sug_mod_summary_asg',
    type: 'draft_report_summary',
    title: 'Draft Report Summary: Public Field Submissions',
    category: 'Assignments Moderation Synthesis',
    roleTarget: 'moderator',
    scopeType: 'assignments',
    originalContent:
      'Aggregated Overview of Public Field Submissions (Safe Streets 2047):\n' +
      '• Public Evidence Logs Analyzed: 12 verified public survey records across Mansarovar & RTU Kota cohorts.\n' +
      '• Observable Field Patterns: 75% of public road audit records note vehicle speeds exceeding 40 km/h during school opening hours.\n' +
      '• Media Compliance Check: 100% of attached media adhere to face-consent guidelines; 0 unconsented faces detected.\n' +
      '• Data Privacy Safeguard: Strict boundary verified — 0 private student vault records and 0 private UHV reflection logs were accessed or included in this advisory synthesis.\n' +
      '• Advisory Note for Moderator: 2 public survey logs have been flagged for duplicate location tags; ready for human reviewer check.',
    content:
      'Aggregated Overview of Public Field Submissions (Safe Streets 2047):\n' +
      '• Public Evidence Logs Analyzed: 12 verified public survey records across Mansarovar & RTU Kota cohorts.\n' +
      '• Observable Field Patterns: 75% of public road audit records note vehicle speeds exceeding 40 km/h during school opening hours.\n' +
      '• Media Compliance Check: 100% of attached media adhere to face-consent guidelines; 0 unconsented faces detected.\n' +
      '• Data Privacy Safeguard: Strict boundary verified — 0 private student vault records and 0 private UHV reflection logs were accessed or included in this advisory synthesis.\n' +
      '• Advisory Note for Moderator: 2 public survey logs have been flagged for duplicate location tags; ready for human reviewer check.',
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
      'Aggregated Digest of Team Workspaces (Change Plan v2 §11):\n' +
      '• Collaborative Workspaces Monitored: 3 active groups (Jaipur Pedestrian Action, Navchetna Student Council, Kota Deliberation Circle).\n' +
      '• Decorum Standard: Group channel discussions adhered to respectful dialogue standards; 0 profanity or harassment alerts.\n' +
      '• Safeguard Compliance: Open channel transparency maintained. Direct unmoderated private student messaging remains disabled.\n' +
      '• Data Privacy Boundary: No student private vaults or personal UHV self-reflection journals were read.\n' +
      '• Advisory Note for Moderator: All active workspaces operating in good standing; no membership restrictions or interventions recommended.',
    content:
      'Aggregated Digest of Team Workspaces (Change Plan v2 §11):\n' +
      '• Collaborative Workspaces Monitored: 3 active groups (Jaipur Pedestrian Action, Navchetna Student Council, Kota Deliberation Circle).\n' +
      '• Decorum Standard: Group channel discussions adhered to respectful dialogue standards; 0 profanity or harassment alerts.\n' +
      '• Safeguard Compliance: Open channel transparency maintained. Direct unmoderated private student messaging remains disabled.\n' +
      '• Data Privacy Boundary: No student private vaults or personal UHV self-reflection journals were read.\n' +
      '• Advisory Note for Moderator: All active workspaces operating in good standing; no membership restrictions or interventions recommended.',
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
      'Jaipur Youth Assembly (sess_jaipur_01) Decorum Digest:\n' +
      '• Registered Chamber Attendance: 24 active seats with 33% women\'s representation verified.\n' +
      '• Queue Decorum: Alternating speaker queue executed orderly; average speech length 1m 45s (within 2m limit).\n' +
      '• Conduct & Recording: 0 unconsented live recordings attempted; respectful parliamentary language observed.\n' +
      '• Boundary Check: Student personal journals and private UHV values reflections were not accessed or processed.\n' +
      '• Advisory Note for Moderator: Chamber proceedings met deliberative standing orders; ready for facilitator archive sign-off.',
    content:
      'Jaipur Youth Assembly (sess_jaipur_01) Decorum Digest:\n' +
      '• Registered Chamber Attendance: 24 active seats with 33% women\'s representation verified.\n' +
      '• Queue Decorum: Alternating speaker queue executed orderly; average speech length 1m 45s (within 2m limit).\n' +
      '• Conduct & Recording: 0 unconsented live recordings attempted; respectful parliamentary language observed.\n' +
      '• Boundary Check: Student personal journals and private UHV values reflections were not accessed or processed.\n' +
      '• Advisory Note for Moderator: Chamber proceedings met deliberative standing orders; ready for facilitator archive sign-off.',
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
    const effectiveRole = user.role || 'participant';

    let candidates: RoleAwareSuggestion[] = [];

    if (effectiveRole === 'participant') {
      candidates = SEEDED_ROLE_SUGGESTIONS.filter((s) => s.roleTarget === 'participant');
    } else if (effectiveRole === 'facilitator') {
      candidates = SEEDED_ROLE_SUGGESTIONS.filter((s) => s.roleTarget === 'facilitator');
    } else if (effectiveRole === 'moderator') {
      // Must respect active scope from scoped moderator grants (Change Plan v2 §12)
      const validActiveGrants = activeGrants.filter(
        (g) => g.status === 'active' && (!g.expiresAt || new Date(g.expiresAt) > new Date())
      );
      const activeScopeTypes = new Set(validActiveGrants.map((g) => g.scope.type));

      candidates = SEEDED_ROLE_SUGGESTIONS.filter(
        (s) => s.roleTarget === 'moderator' && s.scopeType && activeScopeTypes.has(s.scopeType)
      );
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
