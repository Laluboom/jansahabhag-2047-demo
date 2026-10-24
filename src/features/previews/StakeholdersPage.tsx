import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import {
  Users2,
  X,
  Clock,
  FileCheck,
} from 'lucide-react';

interface StakeholderItem {
  id: string;
  name: string;
  role: string;
  status: string;
  contact: string;
  lastAction: string;
  responseNote: string;
  receiptNumber: string;
}

export const StakeholdersPage: React.FC = () => {
  const [selectedStakeholder, setSelectedStakeholder] = useState<StakeholderItem | null>(null);

  const stakeholders: StakeholderItem[] = [
    {
      id: 'STK-01',
      name: 'Jaipur Municipal Corporation (Greater)',
      role: 'Urban Local Body / Roads & Public Works Cell',
      status: 'Proposition Formally Tabled',
      contact: 'Er. R. S. Meena, Executive Engineer (Zone 8)',
      lastAction: 'Official delegation presented by student rapporteurs on 24 Sep 2026',
      responseNote:
        'Site inspection scheduled with Assistant Engineer. Speed table estimate queued for Zone 8 Standing Committee budget allocation.',
      receiptNumber: 'JMC-CIV-2026-8821',
    },
    {
      id: 'STK-02',
      name: 'Jaipur Development Authority (JDA)',
      role: 'Arterial Traffic Infrastructure & Signals Division',
      status: 'Signal Sync Under Review',
      contact: 'Director (Traffic Engineering & ITS)',
      lastAction: 'Crosswalk pedestrian phase timing request submitted',
      responseNote:
        'JDA ITS Cell is evaluating a 20-second dedicated pedestrian walking interval at the Mansarovar crossing.',
      receiptNumber: 'JDA-TE-2026-0419',
    },
    {
      id: 'STK-03',
      name: 'Navchetna School Parent-Teacher Association',
      role: 'Community Co-Sponsor & Parent Marshals',
      status: 'Endorsement Signed (500 Petitions)',
      contact: 'President & Secretary, PTA Civic Sub-Committee',
      lastAction: 'Parent volunteer crossing patrol roster operationalized',
      responseNote:
        'PTA co-signed the Youth Assembly resolution and committed 4 parent marshals during morning drop-off hours.',
      receiptNumber: 'PTA-RES-2026-012',
    },
    {
      id: 'STK-04',
      name: 'Jaipur Traffic Police (South Zone)',
      role: 'Law Enforcement & Speed Deflection',
      status: 'Speed Radar Deployment Approved',
      contact: 'Deputy Commissioner of Police (Traffic)',
      lastAction: 'Speed violation audit data shared with ACP Traffic',
      responseNote:
        'Mobile speed interceptor van assigned to school perimeter during 07:45-08:30 morning peak.',
      receiptNumber: 'JTP-ENF-2026-993',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DemoPreviewBadge
        size="banner"
        label="Stakeholder Engagement Preview"
        description="Tracking direct civic deputations to municipal authorities, transit agencies, and community associations."
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <Users2 className="w-6 h-6 text-civic-teal-600" />
          <span>Municipal & Stakeholder Engagement</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Follow the transmission and official responsiveness of Youth Assembly resolutions to government authorities.
        </p>
      </div>

      <div className="space-y-4">
        {stakeholders.map((st) => (
          <Card
            key={st.id}
            className="p-5 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {st.role}
                </span>
                <span className="text-[10px] font-mono text-slate-400">({st.id})</span>
              </div>
              <h3 className="text-base font-bold font-heading text-slate-900">
                {st.name}
              </h3>
              <p className="text-xs text-slate-600">Contact: <strong>{st.contact}</strong></p>
              <span className="text-[11px] text-slate-400 block">{st.lastAction}</span>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-civic-teal-50 text-civic-teal-800 border border-civic-teal-200">
                {st.status}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedStakeholder(st)}
                className="text-xs"
              >
                <span>View Deputation Log</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Stakeholder Deputation Modal */}
      {selectedStakeholder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-civic-teal-700 uppercase">
                  Receipt #{selectedStakeholder.receiptNumber}
                </span>
                <h3 className="text-base font-bold font-heading text-slate-900">
                  {selectedStakeholder.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStakeholder(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-900 block">Transmission Status</span>
                <p>{selectedStakeholder.lastAction}</p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Authority Lead: {selectedStakeholder.contact}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>Official Authority Response</span>
                </span>
                <p className="leading-relaxed text-[11px]">{selectedStakeholder.responseNote}</p>
              </div>

              <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-500">
                <strong>Simulated Transmission:</strong> JanSahabhag 2047 sends authenticated digital receipts to municipal tracking registries (ULB portal / RTI disclosure node).
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedStakeholder(null)}
              >
                Close Deputation Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
