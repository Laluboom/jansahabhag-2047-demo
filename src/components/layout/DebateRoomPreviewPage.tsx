import React from 'react';
import { Link } from 'react-router-dom';
import { DemoPreviewBadge } from '../ui/DemoPreviewBadge';
import { Card, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  MessageSquare,
  Scale,
  Users2,
  Clock,
  Vote,
  ShieldAlert,
  ArrowRight,
  Home,
} from 'lucide-react';

export const DebateRoomPreviewPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <DemoPreviewBadge
        size="banner"
        label="Debate Room — Planned Demo Module (Pending Shared Session Engine)"
        description="Canonical learner item 4 under Master PRD §A8. Multi-party structured motion debating awaits session engine integration."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2.5">
            <Scale className="w-7 h-7 text-civic-indigo-600" />
            <span>Debate Room</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Structured motion-centered deliberation with speaker queues, time limits, and evidence dock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/assemblies">
            <Button size="sm" variant="primary">
              <Vote className="w-4 h-4 mr-1.5" />
              <span>Enter Youth Assembly</span>
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
              In accordance with Master PRD §1 and Part A §A8, <strong>Debate Room</strong> occupies canonical learner navigation position 4. It provides structured motion-centered discussion, speaker queues, source docks, moderated text paths, and post-session reflection.
            </p>
            <p className="text-slate-600">
              The platform owner selected the connected competition demo; the shared live session engine (Part A §A7) and multi-user persistence are scheduled for forthcoming implementation tasks. This preview does not simulate active live debate or record participant speech.
            </p>
          </div>
        </div>
      </Card>

      {/* Planned Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-civic-indigo-700 font-semibold text-sm">
            <MessageSquare className="w-4 h-4" />
            <h3>Motion & Agenda Dock</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Formal propositions tabled from school zone assemblies, bounded by configurable debate rules, speaking times, and structured proposition amendments.
          </p>
          <span className="inline-block text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
            Planned — Task 04 Architecture
          </span>
        </Card>

        <Card className="p-5 border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-civic-indigo-700 font-semibold text-sm">
            <Clock className="w-4 h-4" />
            <h3>Speaking Queue & Moderation</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Chair-regulated speaking requests, timed pro/con interventions, low-bandwidth text fallback, and non-intrusive safeguarding interventions.
          </p>
          <span className="inline-block text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
            Planned — Shared Session Engine
          </span>
        </Card>

        <Card className="p-5 border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-civic-indigo-700 font-semibold text-sm">
            <Users2 className="w-4 h-4" />
            <h3>Role-Based Lenses</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Participants assume distinct community lenses (pedestrians, shopkeepers, municipal officers, school transport) to foster empathetic deliberation.
          </p>
          <span className="inline-block text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
            Planned — Multi-lens Engine
          </span>
        </Card>

        <Card className="p-5 border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-civic-indigo-700 font-semibold text-sm">
            <Vote className="w-4 h-4" />
            <h3>Connected Deliberative Loop</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Live deliberative Assembly is currently active in the demo. You can explore the running Jaipur Safe Streets deliberation session today.
          </p>
          <Link to="/assemblies" className="inline-flex items-center text-xs font-semibold text-civic-indigo-600 hover:text-civic-indigo-800 pt-1">
            <span>Explore Youth Assembly</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Card>
      </div>
    </div>
  );
};
