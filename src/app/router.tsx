import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ErrorBoundary } from '../features/errors/ErrorBoundary';

// Route Loading Fallback
const PageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading page content">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
  </div>
);

// Lazy Loaded Feature Pages
const DemoLoginPage = lazy(() => import('../features/auth-demo/DemoLoginPage').then((m) => ({ default: m.DemoLoginPage })));
const WelcomePage = lazy(() => import('../features/welcome/WelcomePage').then((m) => ({ default: m.WelcomePage })));
const AboutPage = lazy(() => import('../features/about/AboutPage').then((m) => ({ default: m.AboutPage })));
const OnboardingPage = lazy(() => import('../features/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const ParticipantDashboardPage = lazy(() => import('../features/dashboard/ParticipantDashboardPage').then((m) => ({ default: m.ParticipantDashboardPage })));
const ProfilePage = lazy(() => import('../features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('../features/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));

const CoursesPage = lazy(() => import('../features/learning/CoursesPage').then((m) => ({ default: m.CoursesPage })));
const CourseDetailPage = lazy(() => import('../features/learning/CourseDetailPage').then((m) => ({ default: m.CourseDetailPage })));
const LessonPage = lazy(() => import('../features/learning/LessonPage').then((m) => ({ default: m.LessonPage })));

const AssignmentsPage = lazy(() => import('../features/assignments/AssignmentsPage').then((m) => ({ default: m.AssignmentsPage })));
const AssignmentDetailPage = lazy(() => import('../features/assignments/AssignmentDetailPage').then((m) => ({ default: m.AssignmentDetailPage })));
const SubmitAssignmentPage = lazy(() => import('../features/assignments/SubmitAssignmentPage').then((m) => ({ default: m.SubmitAssignmentPage })));

const ActivitiesPage = lazy(() => import('../features/activities/ActivitiesPage').then((m) => ({ default: m.ActivitiesPage })));
const EventsPage = lazy(() => import('../features/events/EventsPage').then((m) => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import('../features/events/EventDetailPage').then((m) => ({ default: m.EventDetailPage })));

const CommunityPage = lazy(() => import('../features/community/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const CommunityGroupDetailPage = lazy(() => import('../features/community/CommunityGroupDetailPage').then((m) => ({ default: m.CommunityGroupDetailPage })));

const AssembliesPage = lazy(() => import('../features/assemblies/AssembliesPage').then((m) => ({ default: m.AssembliesPage })));
const AssemblyDetailPage = lazy(() => import('../features/assemblies/AssemblyDetailPage').then((m) => ({ default: m.AssemblyDetailPage })));
const AssemblySessionPage = lazy(() => import('../features/assemblies/AssemblySessionPage').then((m) => ({ default: m.AssemblySessionPage })));

const PropositionDetailPage = lazy(() => import('../features/propositions/PropositionDetailPage').then((m) => ({ default: m.PropositionDetailPage })));
const PropositionRevisionsPage = lazy(() => import('../features/propositions/PropositionRevisionsPage').then((m) => ({ default: m.PropositionRevisionsPage })));

const ProjectsPage = lazy(() => import('../features/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('../features/projects/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })));

const CivicIssuesPage = lazy(() => import('../features/issues/CivicIssuesPage').then((m) => ({ default: m.CivicIssuesPage })));
const IssueDetailPage = lazy(() => import('../features/issues/IssueDetailPage').then((m) => ({ default: m.IssueDetailPage })));

const PassportPage = lazy(() => import('../features/passport/PassportPage').then((m) => ({ default: m.PassportPage })));
const CreditsPage = lazy(() => import('../features/passport/CreditsPage').then((m) => ({ default: m.CreditsPage })));
const EvidencePage = lazy(() => import('../features/passport/EvidencePage').then((m) => ({ default: m.EvidencePage })));
const AchievementsPage = lazy(() => import('../features/passport/AchievementsPage').then((m) => ({ default: m.AchievementsPage })));

const IdeaLabPage = lazy(() => import('../features/previews/IdeaLabPage').then((m) => ({ default: m.IdeaLabPage })));
const ResearchLabPage = lazy(() => import('../features/previews/ResearchLabPage').then((m) => ({ default: m.ResearchLabPage })));
const PolicyLabPage = lazy(() => import('../features/previews/PolicyLabPage').then((m) => ({ default: m.PolicyLabPage })));
const ParliamentPage = lazy(() => import('../features/previews/ParliamentPage').then((m) => ({ default: m.ParliamentPage })));
const StakeholdersPage = lazy(() => import('../features/previews/StakeholdersPage').then((m) => ({ default: m.StakeholdersPage })));
const StudioPage = lazy(() => import('../features/previews/StudioPage').then((m) => ({ default: m.StudioPage })));
const DebateRoomPreviewPage = lazy(() => import('../components/layout/DebateRoomPreviewPage').then((m) => ({ default: m.DebateRoomPreviewPage })));
const WorkspacePreviewPage = lazy(() => import('../components/layout/WorkspacePreviewPage').then((m) => ({ default: m.WorkspacePreviewPage })));
const WorkspacePage = lazy(() => import('../features/workspaces/WorkspacePage').then((m) => ({ default: m.WorkspacePage })));
const HelpRulebooksPage = lazy(() => import('../components/layout/HelpRulebooksPage').then((m) => ({ default: m.HelpRulebooksPage })));

const InstitutionDashboardPage = lazy(() => import('../features/institutions/InstitutionDashboardPage').then((m) => ({ default: m.InstitutionDashboardPage })));
const ParticipantsPage = lazy(() => import('../features/institutions/ParticipantsPage').then((m) => ({ default: m.ParticipantsPage })));
const InstitutionProgrammesPage = lazy(() => import('../features/institutions/ProgrammesPage').then((m) => ({ default: m.InstitutionProgrammesPage })));

const AdminDashboardPage = lazy(() => import('../features/administration/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminProgrammesPage = lazy(() => import('../features/administration/AdminProgrammesPage').then((m) => ({ default: m.AdminProgrammesPage })));
const AdminContentPage = lazy(() => import('../features/administration/AdminContentPage').then((m) => ({ default: m.AdminContentPage })));
const AdminModerationPage = lazy(() => import('../features/moderation/AdminModerationPage').then((m) => ({ default: m.AdminModerationPage })));
const AnalyticsPage = lazy(() => import('../features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));

const NotFoundPage = lazy(() => import('../features/errors/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

export const router = createBrowserRouter([
  {
    path: '/demo-login',
    element: (
      <Suspense fallback={<PageLoadingFallback />}>
        <DemoLoginPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <AppShell />,
    errorElement: (
      <ErrorBoundary>
        <Suspense fallback={<PageLoadingFallback />}>
          <NotFoundPage />
        </Suspense>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'welcome',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <WelcomePage />
          </Suspense>
        ),
      },
      {
        path: 'about',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AboutPage />
          </Suspense>
        ),
      },
      {
        path: 'onboarding',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <OnboardingPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ParticipantDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'notifications',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <NotificationsPage />
          </Suspense>
        ),
      },

      // Learning
      {
        path: 'learn',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <CoursesPage />
          </Suspense>
        ),
      },
      {
        path: 'learn/:courseId',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <CourseDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'learn/:courseId/lesson/:lessonId',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <LessonPage />
          </Suspense>
        ),
      },

      // Assignments
      {
        path: 'assignments',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AssignmentsPage />
          </Suspense>
        ),
      },
      {
        path: 'assignments/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AssignmentDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'assignments/:id/submit',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <SubmitAssignmentPage />
          </Suspense>
        ),
      },

      // Participation & Events
      {
        path: 'participate',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ActivitiesPage />
          </Suspense>
        ),
      },
      {
        path: 'activities',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ActivitiesPage />
          </Suspense>
        ),
      },
      {
        path: 'events',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <EventsPage />
          </Suspense>
        ),
      },
      {
        path: 'events/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <EventDetailPage />
          </Suspense>
        ),
      },

      // Community
      {
        path: 'community',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <CommunityPage />
          </Suspense>
        ),
      },
      {
        path: 'community/groups/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <CommunityGroupDetailPage />
          </Suspense>
        ),
      },

      // Deliberation & Assemblies
      {
        path: 'assemblies',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AssembliesPage />
          </Suspense>
        ),
      },
      {
        path: 'assemblies/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AssemblyDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'assemblies/:id/session',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AssemblySessionPage />
          </Suspense>
        ),
      },

      // Propositions
      {
        path: 'propositions/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <PropositionDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'propositions/:id/revisions',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <PropositionRevisionsPage />
          </Suspense>
        ),
      },

      // Projects
      {
        path: 'projects',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ProjectsPage />
          </Suspense>
        ),
      },
      {
        path: 'projects/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ProjectDetailPage />
          </Suspense>
        ),
      },

      // Issues Map
      {
        path: 'issues',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <CivicIssuesPage />
          </Suspense>
        ),
      },
      {
        path: 'issues/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <IssueDetailPage />
          </Suspense>
        ),
      },

      // Passport
      {
        path: 'passport',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <PassportPage />
          </Suspense>
        ),
      },
      {
        path: 'passport/credits',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <CreditsPage />
          </Suspense>
        ),
      },
      {
        path: 'credits',
        element: <Navigate to="/passport/credits" replace />,
      },
      {
        path: 'passport/evidence',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <EvidencePage />
          </Suspense>
        ),
      },
      {
        path: 'passport/achievements',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AchievementsPage />
          </Suspense>
        ),
      },

      // Previews & Labs
      {
        path: 'labs/ideas',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <IdeaLabPage />
          </Suspense>
        ),
      },
      {
        path: 'labs/research',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ResearchLabPage />
          </Suspense>
        ),
      },
      {
        path: 'labs/policy',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <PolicyLabPage />
          </Suspense>
        ),
      },
      {
        path: 'parliament',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ParliamentPage />
          </Suspense>
        ),
      },
      {
        path: 'stakeholders',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <StakeholdersPage />
          </Suspense>
        ),
      },
      {
        path: 'studio',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <StudioPage />
          </Suspense>
        ),
      },

      // Canonical Navigation Previews & Dedicated Streams (Master PRD §1, §A4)
      {
        path: 'debate-room',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <DebateRoomPreviewPage />
          </Suspense>
        ),
      },
      {
        path: 'debate-room/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <DebateRoomPreviewPage />
          </Suspense>
        ),
      },
      {
        path: 'events/:id/debate-room',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <DebateRoomPreviewPage />
          </Suspense>
        ),
      },
      {
        path: 'debates',
        element: <Navigate to="/debate-room" replace />,
      },
      {
        path: 'workspace',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <WorkspacePage />
          </Suspense>
        ),
      },
      {
        path: 'workspace/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <WorkspacePage />
          </Suspense>
        ),
      },
      {
        path: 'workspaces',
        element: <Navigate to="/workspace" replace />,
      },
      {
        path: 'workspaces/:id',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <WorkspacePage />
          </Suspense>
        ),
      },
      {
        path: 'uhv',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <CoursesPage />
          </Suspense>
        ),
      },
      {
        path: 'uhv/learn',
        element: <Navigate to="/uhv" replace />,
      },
      {
        path: 'help',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <HelpRulebooksPage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: <Navigate to="/profile" replace />,
      },

      // Institution
      {
        path: 'institution/dashboard',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <InstitutionDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'institution/participants',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ParticipantsPage />
          </Suspense>
        ),
      },
      {
        path: 'institution/programmes',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <InstitutionProgrammesPage />
          </Suspense>
        ),
      },

      // Admin & Analytics
      {
        path: 'admin/dashboard',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AdminDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'admin/programmes',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AdminProgrammesPage />
          </Suspense>
        ),
      },
      {
        path: 'admin/content',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AdminContentPage />
          </Suspense>
        ),
      },
      {
        path: 'admin/moderation',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AdminModerationPage />
          </Suspense>
        ),
      },
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AnalyticsPage />
          </Suspense>
        ),
      },

      // Fallback
      {
        path: '*',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]);
