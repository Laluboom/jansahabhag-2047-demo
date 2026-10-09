import React from 'react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { FlaskConical, BookOpen, Users, FileText } from 'lucide-react';

export const ResearchLabPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DemoPreviewBadge
        size="banner"
        label="Research Lab Preview"
        description="Collaborative research workspace linking student field data with university urban planning faculties and CRRI datasets."
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-civic-teal-600" />
          <span>Research Lab: Empirical Studies & Datasets</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Academic peer review, empirical urban data synthesis, and published research working papers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6 border-slate-200 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-civic-teal-800 bg-civic-teal-50 px-2 py-0.5 rounded border border-civic-teal-200">
            Active Study #RES-2026-04
          </span>
          <CardTitle className="text-base font-bold text-slate-900">
            Impact of Raised Speed Tables on Driver Deceleration in Jaipur School Zones
          </CardTitle>
          <p className="text-xs text-slate-600 leading-relaxed">
            Multi-institutional study analyzing 48-hour sensor telemetry from Navchetna School and RTU Kota corridors.
          </p>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Faculty Lead: Dr. M. K. Sen</span>
            <DemoPreviewBadge size="sm" label="Preview" />
          </div>
        </Card>

        <Card className="p-6 border-slate-200 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-civic-teal-800 bg-civic-teal-50 px-2 py-0.5 rounded border border-civic-teal-200">
            Dataset #DAT-2026-11
          </span>
          <CardTitle className="text-base font-bold text-slate-900">
            Rajasthan Urban School Zone Walking Audit Aggregated Open Dataset
          </CardTitle>
          <p className="text-xs text-slate-600 leading-relaxed">
            Anonymized 500+ student field observation logs covering pedestrian desire lines, curb heights, and ambient lux levels.
          </p>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>520 Verified Records</span>
            <DemoPreviewBadge size="sm" label="Preview" />
          </div>
        </Card>
      </div>
    </div>
  );
};
