import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { ArrowLeft, MapPin, AlertCircle, ShieldCheck } from 'lucide-react';

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link to="/issues" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Civic Issues</span>
      </Link>

      <DemoPreviewBadge
        size="banner"
        label="Issue Detail Preview"
        description="Linked directly to Aarav's Jaipur Madhyam Marg pedestrian safety audit."
      />

      <Card className="border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400 font-bold">{id}</span>
          <span className="text-xs font-bold uppercase text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
            Critical Severity
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold font-heading text-slate-900">
            Madhyam Marg Gate 1 Speed Corridor & Faded Crosswalk
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Mansarovar Sector 3, Jaipur (26.8524° N, 75.7638° E)</span>
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          High-velocity vehicle approach outside Navchetna Public School. Peak 508 vehicles/30-min with average speeds of 42 km/h. Faded zebra crossing markings and missing warning flashers.
        </p>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Deliberated in Youth Assembly #assembly_jaipur_pedestrian_2026</span>
          <Link to="/assemblies/assembly_jaipur_pedestrian_2026">
            <Button size="sm" variant="primary">
              View Assembly Resolution
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};
