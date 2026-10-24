import React, { useState } from 'react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { PointOfUseRulesButton } from '../../components/ui/PointOfUseRulesButton';
import {
  Scale,
  Download,
  X,
} from 'lucide-react';

interface PolicyDoc {
  id: string;
  title: string;
  category: string;
  statutoryLevel: string;
  summary: string;
  assemblySource: string;
  clauses: string[];
}

export const PolicyLabPage: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<PolicyDoc | null>(null);

  const policyDocs: PolicyDoc[] = [
    {
      id: 'PB-2026-01',
      title: 'Rajasthan Safe School Perimeter Zone Standard Bylaw 2026 (Model Ordinance)',
      category: 'Municipal Bylaw',
      statutoryLevel: 'Urban Local Bodies (ULB Section 42)',
      summary:
        'Statutory model ordinance mandating 25 km/h physical vertical deflection, continuous 1.8m sidewalks, and school-hour freight delivery bans within 200m of educational campuses.',
      assemblySource: 'Jaipur Youth Pedestrian Assembly #assembly_jaipur_pedestrian_2026',
      clauses: [
        'Clause 4.1: Mandatory 100mm raised speed table at all mid-block pedestrian desire lines within school zone perimeters.',
        'Clause 5.2: Minimum unobstructed clear walkway width of 1.8m with anti-skid concrete pavers.',
        'Clause 7.4: Peak-hour commercial delivery curbside restriction between 07:30-08:45 and 13:45-15:00.',
        'Clause 9.1: Civic audit mandate: annual joint safety inspection with student council representatives.',
      ],
    },
    {
      id: 'PB-2026-02',
      title: 'Pedestrian Crossing Safety Enforcement & Spot Penalty Regulations',
      category: 'Traffic Police Standing Order',
      statutoryLevel: 'Motor Vehicles Act Section 112/177',
      summary:
        'Standard operational protocol empowering automated camera and traffic warden citation for failure to yield to crossing schoolchildren.',
      assemblySource: 'Statewide Deliberation Synthesis 2026',
      clauses: [
        'Clause 3.1: Automated ANPR enforcement at painted zebra crossings within 50m of school entrances.',
        'Clause 6.3: Double penalty escalation for heavy commercial vehicles exceeding 25 km/h in marked school corridors.',
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DemoPreviewBadge
        size="banner"
        label="Policy Lab Preview"
        description="Translating youth assembly consensus into formal statutory amendments and municipal standing committee model bylaws."
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-civic-indigo-600" />
            <span>Policy Lab: Legislative Drafting & Model Bylaws</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Model municipal policies and legislative draft bills prepared directly from Youth Assembly propositions.
          </p>
        </div>
        <PointOfUseRulesButton
          moduleName="Policy Lab"
          triggerText="Policy Rules"
          modalTitle="Policy Lab Drafting & Deputation Guidelines"
          description="Guidelines governing municipal draft propositions and deputation packages."
          rules={[
            {
              title: 'Democratic Origin Requirement',
              description: 'Model bylaws must trace directly back to verified propositions finalized by youth assemblies.',
            },
            {
              title: 'Non-Partisan Technical Drafting',
              description: 'Drafts focus on concrete engineering specifications, municipal budget allocations, and road safety enforcement.',
            },
          ]}
          testId="policy-lab-rules-btn"
        />
      </div>

      <div className="space-y-4">
        {policyDocs.map((doc) => (
          <Card key={doc.id} className="p-6 border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-civic-indigo-800 bg-civic-indigo-50 px-2.5 py-0.5 rounded border border-civic-indigo-200">
                  {doc.id} &bull; {doc.category}
                </span>
                <span className="text-xs text-slate-500">{doc.statutoryLevel}</span>
              </div>
              <DemoPreviewBadge size="sm" label="Model Bill Preview" />
            </div>

            <CardTitle className="text-base font-bold text-slate-900">{doc.title}</CardTitle>

            <p className="text-xs text-slate-600 leading-relaxed">{doc.summary}</p>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
              <span>Derived from: <strong>{doc.assemblySource}</strong></span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedDoc(doc)}
                className="text-xs self-start sm:self-auto"
              >
                <span>Inspect Draft Bill</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Draft Bill Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-civic-indigo-600 uppercase">
                  {selectedDoc.id} &bull; Statutory Draft
                </span>
                <h3 className="text-base font-bold font-heading text-slate-900 mt-0.5">
                  {selectedDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 text-xs text-slate-600 flex-1 pr-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">Drafting Basis & Alignment</span>
                <p className="leading-relaxed">
                  Synthesized from 42 field audits and validated in the Jaipur Youth Assembly chamber. Matches IRC:103 (Guidelines for Pedestrian Facilities) standards.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-900 uppercase tracking-wider block text-[10px]">
                  Draft Legislative Provisions
                </span>
                <div className="space-y-2">
                  {selectedDoc.clauses.map((clause, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-slate-800">
                      {clause}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDoc(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedDoc(null)}
              >
                <Download className="w-4 h-4 mr-1.5" />
                <span>Simulated Export (PDF Draft)</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
