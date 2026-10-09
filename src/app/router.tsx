import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ErrorBoundary } from '../features/errors/ErrorBoundary';

// Features
import { DemoLoginPage } from '../features/auth-demo/DemoLoginPage';
import { WelcomePage } from '../features/welcome/WelcomePage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { ParticipantDashboardPage } from '../features/dashboard/ParticipantDashboardPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';

import { CoursesPage } from '../features/learning/CoursesPage';
import { CourseDetailPage } from '../features/learning/CourseDetailPage';
import { LessonPage } from '../features/learning/LessonPage';

import { AssignmentsPage } from '../features/assignments/AssignmentsPage';
import { AssignmentDetailPage } from '../features/assignments/AssignmentDetailPage';
import { SubmitAssignmentPage } from '../features/assignments/SubmitAssignmentPage';

import { ActivitiesPage } from '../features/activities/ActivitiesPage';
import { EventsPage } from '../features/events/EventsPage';
import { EventDetailPage } from '../features/events/EventDetailPage';

import { CommunityPage } from '../features/community/CommunityPage';
import { CommunityGroupDetailPage } from '../features/community/CommunityGroupDetailPage';

import { AssembliesPage } from '../features/assemblies/AssembliesPage';
import { AssemblyDetailPage } from '../features/assemblies/AssemblyDetailPage';
import { AssemblySessionPage } from '../features/assemblies/AssemblySessionPage';

import { PropositionDetailPage } from '../features/propositions/PropositionDetailPage';
import { PropositionRevisionsPage } from '../features/propositions/PropositionRevisionsPage';

import { ProjectsPage } from '../features/projects/ProjectsPage';
import { ProjectDetailPage } from '../features/projects/ProjectDetailPage';

import { CivicIssuesPage } from '../features/issues/CivicIssuesPage';
import { IssueDetailPage } from '../features/issues/IssueDetailPage';

import { PassportPage } from '../features/passport/PassportPage';
import { CreditsPage } from '../features/passport/CreditsPage';
import { EvidencePage } from '../features/passport/EvidencePage';
import { AchievementsPage } from '../features/passport/AchievementsPage';

import { IdeaLabPage } from '../features/previews/IdeaLabPage';
import { ResearchLabPage } from '../features/previews/ResearchLabPage';
import { PolicyLabPage } from '../features/previews/PolicyLabPage';
import { ParliamentPage } from '../features/previews/ParliamentPage';
import { StakeholdersPage } from '../features/previews/StakeholdersPage';
import { StudioPage } from '../features/previews/StudioPage';

import { InstitutionDashboardPage } from '../features/institutions/InstitutionDashboardPage';
import { ParticipantsPage } from '../features/institutions/ParticipantsPage';
import { InstitutionProgrammesPage } from '../features/institutions/ProgrammesPage';

import { AdminDashboardPage } from '../features/administration/AdminDashboardPage';
import { AdminProgrammesPage } from '../features/administration/AdminProgrammesPage';
import { AdminContentPage } from '../features/administration/AdminContentPage';
import { AdminModerationPage } from '../features/moderation/AdminModerationPage';
import { AnalyticsPage } from '../features/analytics/AnalyticsPage';

import { NotFoundPage } from '../features/errors/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/demo-login',
    element: <DemoLoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    errorElement: (
      <ErrorBoundary>
        <NotFoundPage />
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'welcome',
        element: <WelcomePage />,
      },
      {
        path: 'onboarding',
        element: <OnboardingPage />,
      },
      {
        path: 'dashboard',
        element: <ParticipantDashboardPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },

      // Learning
      {
        path: 'learn',
        element: <CoursesPage />,
      },
      {
        path: 'learn/:courseId',
        element: <CourseDetailPage />,
      },
      {
        path: 'learn/:courseId/lesson/:lessonId',
        element: <LessonPage />,
      },

      // Assignments
      {
        path: 'assignments',
        element: <AssignmentsPage />,
      },
      {
        path: 'assignments/:id',
        element: <AssignmentDetailPage />,
      },
      {
        path: 'assignments/:id/submit',
        element: <SubmitAssignmentPage />,
      },

      // Participation & Events
      {
        path: 'participate',
        element: <ActivitiesPage />,
      },
      {
        path: 'activities',
        element: <ActivitiesPage />,
      },
      {
        path: 'events',
        element: <EventsPage />,
      },
      {
        path: 'events/:id',
        element: <EventDetailPage />,
      },

      // Community
      {
        path: 'community',
        element: <CommunityPage />,
      },
      {
        path: 'community/groups/:id',
        element: <CommunityGroupDetailPage />,
      },

      // Deliberation & Assemblies
      {
        path: 'assemblies',
        element: <AssembliesPage />,
      },
      {
        path: 'assemblies/:id',
        element: <AssemblyDetailPage />,
      },
      {
        path: 'assemblies/:id/session',
        element: <AssemblySessionPage />,
      },

      // Propositions
      {
        path: 'propositions/:id',
        element: <PropositionDetailPage />,
      },
      {
        path: 'propositions/:id/revisions',
        element: <PropositionRevisionsPage />,
      },

      // Projects
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'projects/:id',
        element: <ProjectDetailPage />,
      },

      // Issues Map
      {
        path: 'issues',
        element: <CivicIssuesPage />,
      },
      {
        path: 'issues/:id',
        element: <IssueDetailPage />,
      },

      // Passport
      {
        path: 'passport',
        element: <PassportPage />,
      },
      {
        path: 'passport/credits',
        element: <CreditsPage />,
      },
      {
        path: 'passport/evidence',
        element: <EvidencePage />,
      },
      {
        path: 'passport/achievements',
        element: <AchievementsPage />,
      },

      // Previews & Labs
      {
        path: 'labs/ideas',
        element: <IdeaLabPage />,
      },
      {
        path: 'labs/research',
        element: <ResearchLabPage />,
      },
      {
        path: 'labs/policy',
        element: <PolicyLabPage />,
      },
      {
        path: 'parliament',
        element: <ParliamentPage />,
      },
      {
        path: 'stakeholders',
        element: <StakeholdersPage />,
      },
      {
        path: 'studio',
        element: <StudioPage />,
      },

      // Institution
      {
        path: 'institution/dashboard',
        element: <InstitutionDashboardPage />,
      },
      {
        path: 'institution/participants',
        element: <ParticipantsPage />,
      },
      {
        path: 'institution/programmes',
        element: <InstitutionProgrammesPage />,
      },

      // Admin & Analytics
      {
        path: 'admin/dashboard',
        element: <AdminDashboardPage />,
      },
      {
        path: 'admin/programmes',
        element: <AdminProgrammesPage />,
      },
      {
        path: 'admin/content',
        element: <AdminContentPage />,
      },
      {
        path: 'admin/moderation',
        element: <AdminModerationPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },

      // Fallback
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
