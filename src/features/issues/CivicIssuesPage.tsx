import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { MapPin, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const CivicIssuesPage: React.FC = () => {
  const issues = [
    {
      id: 'iss_01',
      title: 'Madhyam Marg Gate 1 Speed Corridor & Faded Crosswalk',
      location: 'Mansarovar, Jaipur',
      category: 'Pedestrian Hazard',
      severity: 'Critical',
      reportsCount: 14,
      status: 'In Deliberation',
    },
    {
      id: 'iss_02',
      title: 'Shipra Path Blind Curve & Obstructed Sightlines',
      location: 'Mansarovar, Jaipur',
      category: 'Road Geometry',
      severity: 'High',
      reportsCount: 8,
      status: 'Evidence Audited',
    },
    {
      id: 'iss_03',
      title: 'Civil Lines Station Approach Missing Sidewalk Verge',
      location: 'Ajmer',
      category: 'Accessibility',
      severity: 'Medium',
      reportsCount: 5,
      status: 'Charter Drafted',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DemoPreviewBadge
        size="banner"
        label="Civic Issues Map Preview"
        description="Geospatial crowd-sourced hazard tagging. Active data links directly to Aarav's Jaipur school zone audit."
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-civic-saffron-600" />
          <span>Civic Issues & Danger Spots Map</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Geospatial visualization of pedestrian hazards and infrastructure defects audited by youth.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {issues.map((iss) => (
          <Card key={iss.id} className="p-5 border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {iss.severity}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {iss.status}
                </span>
              </div>

              <CardTitle className="text-sm font-bold text-slate-900">
                {iss.title}
              </CardTitle>

              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{iss.location}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {iss.reportsCount} Field Audits
              </span>
              <Link to={`/issues/${iss.id}`}>
                <Button size="sm" variant="outline">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
