export * from './domain';

export interface DashboardNextStep {
  type: 'lesson' | 'assignment' | 'assembly' | 'revision';
  title: string;
  description: string;
  targetRoute: string;
  badgeText: string;
  rewardText?: string;
}

export interface DashboardData {
  user: import('./domain').User;
  activeEnrolments: import('./domain').Enrolment[];
  recentActivities: import('./domain').Activity[];
  upcomingEvents: import('./domain').Event[];
  activeAssemblies: import('./domain').Assembly[];
  pendingAssignments: import('./domain').Assignment[];
  recentNotifications: import('./domain').Notification[];
  creditSummary: {
    total: number;
    breakdown: Record<import('./domain').CreditDimension, number>;
  };
  passportEntriesCount: number;
  nextStep?: DashboardNextStep;
}

export interface AssignmentSubmissionInput {
  assignmentId: string;
  userId: string;
  content: string;
  evidenceIds?: string[];
  status?: 'draft' | 'submitted';
}


export interface SubmissionReviewInput {
  submissionId: string;
  reviewerId: string;
  status: 'verified' | 'revision_requested';
  teacherFeedback: string;
  score?: number;
}

export interface AssemblyContributionInput {
  assemblyId: string;
  userId: string;
  stage: import('./domain').AssemblyStage;
  type: import('./domain').ContributionType;
  text: string;
  evidenceIds?: string[];
  isSubstantive?: boolean;
}

export interface PropositionFinalisationInput {
  propositionId: string;
  assemblyId: string;
  outcome: import('./domain').PropositionOutcome;
  updatedBy: string;
  changesSummary?: string;
  nextStep?: string;
}

export interface PassportView {
  user: import('./domain').User;
  entries: import('./domain').PassportEntry[];
  credits: import('./domain').CreditTransaction[];
  totalCredits: number;
  creditsByDimension: Record<import('./domain').CreditDimension, number>;
  verifiedEvidence: import('./domain').Evidence[];
  completedCoursesCount: number;
  assembliesParticipatedCount: number;
}
