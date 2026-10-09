import React from 'react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { Scale, FileText, Landmark, ArrowRight } from 'lucide-react';

export const PolicyLabPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DemoPreviewBadge
        size="banner"
        label="Policy Lab Preview"
        description="Translating youth assembly consensus into formal statutory amendments and municipal standing committee model bylaws."
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <Scale className="w-6 h-6 text-civic-indigo-600" />
          <span>Policy Lab: Legislative Drafting & Model Bylaws</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Model municipal policies and legislative draft bills prepared from Youth Assembly propositions.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-6 border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-civic-indigo-800 bg-civic-indigo-50 px-2.5 py-0.5 rounded border border-civic-indigo-200">
              Model Policy Brief #PB-2026-01
            </span>
            <DemoPreviewBadge size="sm" label="Preview" />
          </div>

          <CardTitle className="text-base font-bold text-slate-900">
            Rajasthan Safe School Perimeter Zone Standard Bylaw 2026 (Draft)
          </CardTitle>

          <p className="text-xs text-slate-600 leading-relaxed">
            Statutory model ordinance mandating mandatory 25 km/h physical vertical deflection, continuous 1.8m sidewalks, and school-hour freight delivery bans within 200m of educational campuses.
          </p>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Derived from: <strong>Jaipur Youth Pedestrian Assembly #assembly_jaipur_pedestrian_2026</strong></span>
            <Button size="sm" variant="outline" disabled>
              <span>Download Draft Bill</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
