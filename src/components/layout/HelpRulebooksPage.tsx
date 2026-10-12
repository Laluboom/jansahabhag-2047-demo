import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  BookOpen,
  HelpCircle,
  Vote,
  Landmark,
  FileCheck2,
  HeartHandshake,
  ArrowRight,
  Home,
} from 'lucide-react';

export const HelpRulebooksPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-civic-indigo-600" />
            <span>Help & Point-of-Use Rulebooks</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Democratic protocols, deliberation guidelines, safeguarding standards, and ethical codes.
          </p>
        </div>

        <Link to="/dashboard">
          <Button size="sm" variant="outline">
            <Home className="w-4 h-4 mr-1.5" />
            <span>Dashboard</span>
          </Button>
        </Link>
      </div>

      {/* Rulebook Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-civic-indigo-700 font-semibold text-sm">
            <Vote className="w-5 h-5" />
            <CardTitle className="text-base font-bold text-slate-900">
              Youth Deliberative Assembly Protocol
            </CardTitle>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Covers stage progression (Problem Definition &rarr; Evidence &rarr; Deliberation &rarr; Voting), role powers (Chair, Presenter, Delegate), speaking turns, and dissent preservation during proposition revisions.
          </p>
          <div className="pt-2">
            <Link to="/assemblies">
              <Button size="sm" variant="outline">
                <span>View Live Assembly</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-5 border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-civic-saffron-700 font-semibold text-sm">
            <Landmark className="w-5 h-5" />
            <CardTitle className="text-base font-bold text-slate-900">
              National Youth Parliament Standing Orders
            </CardTitle>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Protocols for apex chamber motions, representative aggregation across 28 State Deliberation Grids, and official transmission to Urban Local Bodies and line ministries.
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
              Field Evidence & Verification Standard
            </CardTitle>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Requirements for observable field audits: verifiable timestamps, location-privacy tiers, ethical peer interviews, mentor review criteria, and non-tampering invariants.
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
              UHV / Jeevan Vidya Study Charter
            </CardTitle>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Charter governing the Universal Human Values study stream: self-exploration based on natural acceptance, voluntary inquiry, no grading of ideological conformity, and curriculum rights disclosure.
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
      </div>
    </div>
  );
};
