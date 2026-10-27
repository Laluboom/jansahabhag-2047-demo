import React from 'react';
import { Link } from 'react-router-dom';
import { DemoPreviewBadge } from '../ui/DemoPreviewBadge';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PointOfUseRulesButton } from '../ui/PointOfUseRulesButton';
import {
  Layers,
  Building2,
  FolderKanban,
  Users2,
  ShieldAlert,
  ArrowRight,
  Home,
  Target,
} from 'lucide-react';

export const WorkspacePreviewPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <DemoPreviewBadge
        size="banner"
        label="Workspace — Planned Demo Module (Pending Permission-Safe Persistence)"
        description="Fictional browser demo. Canonical learner item 7 under Master PRD §A12. Team, topic, and institutional collaboration workspaces."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-civic-teal-600" />
            <span>Workspace</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Scoped collaboration spaces for teams, student cohorts, civic project groups, and institutions (fictional browser demo).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PointOfUseRulesButton
            moduleName="Workspace"
            triggerText="Workspace Rules"
            modalTitle="Workspace Operating Guidelines"
            description="Operating standards for scoped team collaboration workspaces."
            rules={[
              {
                title: 'Persistent & Named Identification',
                description: 'Workspace members interact under registered usernames. Anonymous or unmonitored posting is disabled.',
              },
              {
                title: 'Direct Messaging Safeguards',
                description: 'Faculty and mentors participate in open, group-visible channels. Direct unmoderated private messaging is disabled by default.',
              },
              {
                title: 'Evidence Upload Standards',
                description: 'Shared photos and documents must respect face consent and private residential boundaries up to 250 KB file limits.',
              },
            ]}
            testId="workspace-preview-rules-btn"
          />
          <Link to="/projects">
            <Button size="sm" variant="primary">
              <Target className="w-4 h-4 mr-1.5" />
              <span>View Demo Projects</span>
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="sm" variant="outline">
              <Home className="w-4 h-4 mr-1.5" />
              <span>Home</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Notice */}
      <Card className="p-6 border-amber-200 bg-amber-50/50">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-slate-700">
            <h2 className="font-bold text-amber-950 font-heading text-base">
              Nonfunctional Preview Destination
            </h2>
            <p>
              <strong>Workspace</strong> is where institutions, cohorts and project teams would get their own shared space: memberships, join requests, announcements, and channels.
            </p>
            <p className="text-slate-600">
              Authenticated multi-user persistence and permission-safe role isolation come later, so this preview has no live invitations, no shared document editing, and no multi-user chat.
            </p>
          </div>
        </div>
      </Card>

      {/* Planned Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-civic-teal-700 font-semibold text-sm">
            <Building2 className="w-4 h-4" />
            <h3>Institutional & Cohort Workspaces</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Dedicated spaces for participating schools, colleges, and regional cohorts with verified faculty mentors and safeguarding oversight.
          </p>
          <span className="inline-block text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
            Planned
          </span>
        </Card>

        <Card className="p-5 border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-civic-teal-700 font-semibold text-sm">
            <FolderKanban className="w-4 h-4" />
            <h3>Project Team Docks</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Persistent workspaces for civic project teams to organize field observations, collaborate on municipal petitions, and draft crosswalk interventions.
          </p>
          <span className="inline-block text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
            Planned
          </span>
        </Card>

        <Card className="p-5 border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-civic-teal-700 font-semibold text-sm">
            <Users2 className="w-4 h-4" />
            <h3>Scoped Privacy & Safeguarding</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Audit-logged workspace access, age-appropriate contact boundaries, and scoped moderation authority preventing global privilege leakage.
          </p>
          <span className="inline-block text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
            Planned
          </span>
        </Card>

        <Card className="p-5 border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-civic-teal-700 font-semibold text-sm">
            <Target className="w-4 h-4" />
            <h3>Sample Project Initiatives</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            You can review seeded sample micro-initiatives such as the Virani Science College Crosswalk Action in the Labs & Projects section in this simulated browser demo.
          </p>
          <Link to="/projects" className="inline-flex items-center text-xs font-semibold text-civic-teal-700 hover:text-civic-teal-900 pt-1">
            <span>Explore Labs & Projects</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Card>
      </div>
    </div>
  );
};
