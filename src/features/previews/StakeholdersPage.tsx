import React from 'react';
import { Card, CardTitle } from '../../components/ui/Card';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { Building2, Users2, ShieldCheck, ArrowRight } from 'lucide-react';

export const StakeholdersPage: React.FC = () => {
  const stakeholders = [
    {
      name: 'Jaipur Municipal Corporation (Greater)',
      role: 'Urban Local Body / Roads Cell',
      status: 'Proposition Received',
      contact: 'Executive Engineer (Zone 8)',
    },
    {
      name: 'Jaipur Development Authority (JDA)',
      role: 'Arterial Traffic Infrastructure',
      status: 'Signal Sync Under Review',
      contact: 'Director (Traffic Engineering)',
    },
    {
      name: 'Navchetna School Parent-Teacher Association',
      role: 'Community Co-Sponsor',
      status: 'Endorsement Signed (500 Petitions)',
      contact: 'PTA Civic Sub-Committee',
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
          Follow the transmission of Youth Assembly resolutions to government decision-makers.
        </p>
      </div>

      <div className="space-y-4">
        {stakeholders.map((st, i) => (
          <Card key={i} className="p-5 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                {st.role}
              </span>
              <h3 className="text-base font-bold font-heading text-slate-900 mt-0.5">
                {st.name}
              </h3>
              <span className="text-xs text-slate-500 block mt-0.5">Contact: {st.contact}</span>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-civic-teal-50 text-civic-teal-800 border border-civic-teal-200">
                {st.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
