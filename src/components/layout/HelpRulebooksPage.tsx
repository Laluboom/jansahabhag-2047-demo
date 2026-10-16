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
            <span>Help & Rulebooks (Draft Index)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Planned draft index and procedural overviews pending owner review. Fictional browser demo.
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
          This section serves as a draft index and navigational overview of platform guidelines. Detailed competition rubrics, deliberative standing orders, and verification criteria are planned summaries pending platform owner review. Fictional browser demo.
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
            Planned draft summary of stage progression, speaking turns, and dissent preservation for deliberative assembly mockups pending owner review.
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
            Planned draft outline of apex chamber motions, representative aggregation, and policy briefs pending owner review.
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
            Planned draft summary for observable field audits, verifiable timestamps, and mentor verification criteria pending owner review.
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
            Planned draft summary of exploratory study principles: voluntary inquiry, no grading of ideological conformity, and curriculum rights pending owner review.
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
