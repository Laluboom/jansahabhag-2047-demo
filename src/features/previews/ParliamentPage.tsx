import React from 'react';
import { Card, CardTitle } from '../../components/ui/Card';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { Landmark, Users, Vote, Sparkles } from 'lucide-react';

export const ParliamentPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DemoPreviewBadge
        size="banner"
        label="National Youth Parliament Preview"
        description="National apex chamber aggregating verified youth assembly propositions across 28 states into parliamentary submissions."
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <Landmark className="w-6 h-6 text-civic-saffron-600" />
          <span>National Youth Parliament 2047</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Simulated parliamentary chamber where top youth propositions from all states are tabled for national consideration.
        </p>
      </div>

      <Card className="p-8 border-slate-200 text-center space-y-4 bg-gradient-to-br from-white via-slate-50 to-civic-indigo-50/20">
        <div className="w-16 h-16 rounded-2xl bg-civic-indigo-100 text-civic-indigo-700 flex items-center justify-center mx-auto shadow-sm">
          <Landmark className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900">
            Winter Session 2026: Sustainable Urban Mobility
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
            The Jaipur Pedestrian Safety Proposition is queued as <strong>Rajasthan State Motion #07</strong> for tabling in the youth apex assembly.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <DemoPreviewBadge size="md" label="Simulated National Chamber" />
        </div>
      </Card>
    </div>
  );
};
