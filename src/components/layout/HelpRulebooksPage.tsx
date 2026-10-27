import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { DemoPreviewBadge } from '../ui/DemoPreviewBadge';
import {
  BookOpen,
  Vote,
  Landmark,
  FileCheck2,
  HeartHandshake,
  ArrowRight,
  Home,
  Bot,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  VideoOff,
} from 'lucide-react';
import {
  NO_RECORDING_RULE_TITLE,
  NO_RECORDING_RULE_TEXT,
  FACE_CONSENT_WARNING_TEXT,
  ALLOWED_EVIDENCE_FORMAT_LABELS,
} from '../../domain/evidenceRules';
import { RoleAwareAssistantSurface } from '../ai/RoleAwareAssistantSurface';

export const HelpRulebooksPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-civic-indigo-600" />
              <span>Help & Rulebooks (Draft Index)</span>
            </h1>
            <DemoPreviewBadge size="sm" label="Fictional browser demo" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            What each part of the platform expects of you. The full rulebooks are still being written.
          </p>
        </div>

        <Link to="/dashboard">
          <Button size="sm" variant="outline">
            <Home className="w-4 h-4 mr-1.5" />
            <span>Dashboard</span>
          </Button>
        </Link>
      </div>

      {/* Draft Index Disclosure Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm uppercase tracking-wider text-amber-900">
          <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Draft Overview &bull; Planned Summaries Pending Owner Review</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          Each card below is a short summary of the rules for one part of the platform. The detailed competition rubrics, assembly standing orders and verification criteria have not been written yet.
        </p>
      </div>

      {/* Rulebook Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-civic-indigo-700 font-semibold text-sm">
            <Vote className="w-5 h-5" />
            <CardTitle className="text-base font-bold text-slate-900">
              Draft Overview: Youth Assembly Protocol
            </CardTitle>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            How an assembly moves through its stages, who speaks when, and why a minority view is kept on the record.
          </p>
          <div className="pt-2">
            <Link to="/assemblies">
              <Button size="sm" variant="outline">
                <span>View Assembly Prototype</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-civic-saffron-700 font-semibold text-sm">
            <Landmark className="w-5 h-5" />
            <CardTitle className="text-base font-bold text-slate-900">
              Draft Overview: National Youth Parliament Standing Orders
            </CardTitle>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            How motions reach the top chamber, how representatives are drawn from assemblies, and what a policy brief contains.
          </p>
          <div className="pt-2">
            <Link to="/parliament">
              <Button size="sm" variant="outline">
                <span>View Parliament Preview</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <FileCheck2 className="w-5 h-5" />
            <CardTitle className="text-base font-bold text-slate-900">
              Draft Overview: Field Evidence & Verification Standard
            </CardTitle>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Observable field audits, verifiable timestamps, and mentor verification criteria. Evidence is private by default. No recording without facilitator permission, and unconsented photos of faces are strictly prohibited.
          </p>
          <div className="pt-2">
            <Link to="/assignments">
              <Button size="sm" variant="outline">
                <span>View Assignments</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm">
            <HeartHandshake className="w-5 h-5" />
            <CardTitle className="text-base font-bold text-slate-900">
              Draft Overview: UHV / Jeevan Vidya Study Charter
            </CardTitle>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Taking part is voluntary, agreeing with an idea is never graded, and the curriculum rights sit with their owners.
          </p>
          <div className="pt-2">
            <Link to="/uhv">
              <Button size="sm" variant="outline">
                <span>Open UHV Stream</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Media Consent & No-Recording Policy Card */}
        <Card className="p-5 border-slate-200 space-y-3 md:col-span-2 bg-slate-50/50">
          <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
            <VideoOff className="w-5 h-5 text-rose-600 shrink-0" />
            <CardTitle className="text-base font-bold text-slate-900">
              Session Recording & Media Rules: {NO_RECORDING_RULE_TITLE}
            </CardTitle>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {NO_RECORDING_RULE_TEXT}
          </p>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Civic Evidence & Face Consent Standard</span>
            </p>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              When submitting field observations or civic evidence, <strong>{FACE_CONSENT_WARNING_TEXT}</strong> Supported formats are strictly limited to {ALLOWED_EVIDENCE_FORMAT_LABELS} up to 250 KB to ensure durable browser storage and protect participant privacy.
            </p>
          </div>
        </Card>
      </div>

      {/* AI Boundaries Policy Panel */}
      <Card className="p-5 sm:p-6 border-slate-200 bg-slate-50/70 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-civic-indigo-50 text-civic-indigo-700 border border-civic-indigo-100">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                AI Boundaries: Policy & Principles
              </CardTitle>
              <p className="text-xs text-slate-500">
                Core operating rules governing automated tools and human accountability across JanSahabhag 2047.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-civic-indigo-100/70 text-civic-indigo-800 text-xs font-semibold w-fit">
            <span>AI assists, people decide.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Permitted AI Scope */}
          <div className="p-4 rounded-xl bg-white border border-emerald-100 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Where AI may assist (if built)</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              <li>Suggest practice prompts for mock deliberations.</li>
              <li>Draft candidate agendas for assembly sessions.</li>
              <li>Summarise public discussions into concise overviews.</li>
              <li>Explain rulebook and procedural guidelines in plain language.</li>
            </ul>
          </div>

          {/* Prohibited AI Actions */}
          <div className="p-4 rounded-xl bg-white border border-rose-100 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs uppercase tracking-wide">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Strictly prohibited (AI must not)</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside leading-relaxed">
              <li>Award civic credits or change passport status.</li>
              <li>Verify field evidence or audit submissions.</li>
              <li>Rank, score, or profile participants.</li>
              <li>Choose speakers or allocate turns during assembly.</li>
              <li>Moderate discussions autonomously or issue disciplinary actions.</li>
              <li>Access or ingest private UHV reflections.</li>
            </ul>
          </div>
        </div>

        {/* Safeguards & Human Accountability */}
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Safeguards, Output Handling & Appeals</span>
          </div>
          <p className="leading-relaxed">
            All AI-generated content must be clearly labelled, reviewable, and freely editable or discardable by participants before submission or use. AI never decides credit awards, evidence verification, moderation actions, or appeals. Routine credits may be awarded automatically by deterministic system rules upon verified task completion, while substantive reviews, verification assessments, and moderation determinations are handled by human reviewers and facilitators, with human review and appeals remaining available where implemented.
          </p>
          <p className="text-[11px] text-slate-500 italic">
            Policy note: This panel establishes institutional governance requirements for potential future AI tools. No generative AI features or commercial model providers are currently active or operating in this fictional browser demo.
          </p>
        </div>
      </Card>

      {/* Role-Aware Assistant Surface (Change Plan v2 & Review Additions 5) */}
      <RoleAwareAssistantSurface />
    </div>
  );
};
