import React, { useState } from 'react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { PointOfUseRulesButton } from '../../components/ui/PointOfUseRulesButton';
import {
  FlaskConical,
  BookOpen,
  Users,
  FileText,
  Download,
  X,
  Sparkles,
  Database,
  CheckCircle2,
  Table,
} from 'lucide-react';

interface StudyItem {
  id: string;
  title: string;
  lead: string;
  synopsis: string;
  findings: string[];
  sampleSize: string;
  datasetFormat: string;
}

export const ResearchLabPage: React.FC = () => {
  const [selectedStudy, setSelectedStudy] = useState<StudyItem | null>(null);

  const studies: StudyItem[] = [
    {
      id: 'RES-2026-04',
      title: 'Impact of Raised Speed Tables on Driver Deceleration in Jaipur School Zones',
      lead: 'Dr. M. K. Sen (Urban Planning Faculty, MNIT Jaipur) & Student Deliberators',
      synopsis:
        'Multi-institutional empirical study measuring 48-hour sensor telemetry outside Navchetna School before and after trial physical calming.',
      findings: [
        '85th percentile vehicular approach speed dropped from 44.8 km/h to 21.2 km/h',
        'Pedestrian crossing wait time decreased by 62%',
        'Zero rear-end braking incidents recorded during 14-day observation window',
      ],
      sampleSize: '14,200 vehicle passes across 4 school gates',
      datasetFormat: 'GeoJSON + High-Frequency CSV telemetry',
    },
    {
      id: 'DAT-2026-11',
      title: 'Rajasthan Urban School Zone Walking Audit Aggregated Open Dataset',
      lead: 'State Mission Cell & 500+ Youth Deliberators',
      synopsis:
        'Standardized open geospatial dataset compiling walking comfort metrics, curb height obstacles, and ambient street lux measurements.',
      findings: [
        '73% of surveyed school perimeter corridors lacked continuous 1.8m footpaths',
        'Ambient evening illumination averaged < 8.5 lux across secondary access roads',
        'Direct correlation observed between hawker encroachment and pedestrian roadway spillover',
      ],
      sampleSize: '520 verified student walking audit records across Jaipur, Kota, and Ajmer',
      datasetFormat: 'Open Data CSV & Shapefiles',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DemoPreviewBadge
        size="banner"
        label="Research Lab Preview"
        description="Collaborative research workspace linking student field data with university urban planning faculties and CRRI datasets."
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-civic-teal-600" />
            <span>Research Lab: Empirical Studies & Datasets</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Academic peer review, empirical urban data synthesis, and published research working papers.
          </p>
        </div>
        <PointOfUseRulesButton
          moduleName="Research Lab"
          triggerText="Lab Rules"
          modalTitle="Research Lab Academic & Data Standards"
          description="Guidelines governing open dataset publication and research inquiry."
          rules={[
            {
              title: 'Empirical Data Verification',
              description: 'Research papers must be backed by verifiable field observations, traffic counts, or surveyed sample sizes.',
            },
            {
              title: 'Open Data & Academic Ethics',
              description: 'Datasets are open for non-commercial educational review. Individual participant identities are protected.',
            },
          ]}
          testId="research-lab-rules-btn"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {studies.map((st) => (
          <Card key={st.id} className="p-6 border-slate-200 space-y-4 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-civic-teal-800 bg-civic-teal-50 px-2 py-0.5 rounded border border-civic-teal-200">
                  {st.id}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-civic-teal-600" />
                  {st.datasetFormat}
                </span>
              </div>

              <CardTitle className="text-base font-bold text-slate-900">{st.title}</CardTitle>
              <p className="text-xs text-slate-600 leading-relaxed">{st.synopsis}</p>

              <div className="pt-1 text-[11px] text-slate-500">
                <span>Investigator: <strong>{st.lead}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">{st.sampleSize}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedStudy(st)}
                className="text-xs"
              >
                <span>Inspect Abstract</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Study Abstract & Dataset Modal */}
      {selectedStudy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-civic-teal-700 uppercase">
                  {selectedStudy.id} &bull; Peer-Reviewed Working Paper
                </span>
                <h3 className="text-base font-bold font-heading text-slate-900 mt-0.5">
                  {selectedStudy.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudy(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 text-xs text-slate-600 flex-1 pr-1">
              <div>
                <span className="font-bold text-slate-900 uppercase tracking-wider block text-[10px] mb-1">
                  Research Abstract & Methodology
                </span>
                <p className="leading-relaxed">{selectedStudy.synopsis}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-[11px]">
                  Key Empirical Conclusions
                </span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  {selectedStudy.findings.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-[11px]">
                <strong>Open Science License:</strong> This dataset is published under CC BY-SA 4.0 for civic research and municipal infrastructure design.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudy(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedStudy(null)}
              >
                <Download className="w-4 h-4 mr-1.5" />
                <span>Simulated Download (CSV)</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
