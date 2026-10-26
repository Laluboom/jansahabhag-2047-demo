import { DemoDatabase } from '../../types/domain';
import { seedUsers } from './users';
import { seedInstitutions } from './institutions';
import { seedProgrammes } from './programmes';
import { seedCourses, seedLessons, seedEnrolments } from './courses';
import { seedAssignments, seedSubmissions } from './assignments';
import { seedEvidence } from './evidence';
import {
  seedAssemblies,
  seedAssemblyRoles,
  seedContributions,
  seedPropositions,
} from './assemblies';
import { seedProjects, seedReflections } from './projects';
import { seedEvents, seedSessions, seedActivities } from './events';
import { seedCredits } from './credits';
import { seedPassportEntries } from './passport';
import { seedNotifications } from './notifications';
import { seedCommunityGroups, seedCommunityPosts } from './community';
import { seedModerationCases } from './moderation';
import { seedCivicIssues } from './issues';
import {
  seedWorkspaces,
  seedWorkspaceMemberships,
  seedWorkspaceActions,
  seedWorkspaceAuditEvents,
  canonicalWorkspaceRulebook,
} from './workspaces';
import { seedModeratorGrants, seedModeratorAudits } from './moderatorGrants';

export {
  seedWorkspaces,
  seedWorkspaceMemberships,
  seedWorkspaceActions,
  seedWorkspaceAuditEvents,
  canonicalWorkspaceRulebook,
  seedModeratorGrants,
  seedModeratorAudits,
};

export const CURRENT_SCHEMA_VERSION = 3;

export const seedDatabase: DemoDatabase = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  activeUserId: 'VSC-S-001',
  users: seedUsers,
  institutions: seedInstitutions,
  programmes: seedProgrammes,
  courses: seedCourses,
  lessons: seedLessons,
  enrolments: seedEnrolments,
  assignments: seedAssignments,
  submissions: seedSubmissions,
  evidence: seedEvidence,
  activities: seedActivities,
  events: seedEvents,
  sessions: seedSessions,
  assemblies: seedAssemblies,
  assemblyRoles: seedAssemblyRoles,
  contributions: seedContributions,
  propositions: seedPropositions,
  projects: seedProjects,
  reflections: seedReflections,
  credits: seedCredits,
  passportEntries: seedPassportEntries,
  notifications: seedNotifications,
  communityGroups: seedCommunityGroups,
  communityPosts: seedCommunityPosts,
  moderationCases: seedModerationCases,
  civicIssues: seedCivicIssues,
  allocationAudits: [],
  workspaces: seedWorkspaces,
  workspaceMemberships: seedWorkspaceMemberships,
  workspaceActions: seedWorkspaceActions,
  workspaceAuditEvents: seedWorkspaceAuditEvents,
  scopedModeratorGrants: seedModeratorGrants,
  scopedModeratorAudits: seedModeratorAudits,
};

export function getFreshSeedDatabase(): DemoDatabase {
  return JSON.parse(JSON.stringify(seedDatabase));
}
