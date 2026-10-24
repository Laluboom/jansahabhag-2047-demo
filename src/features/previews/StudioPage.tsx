import React, { useState } from 'react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import {
  Palette,
  Video,
  Wand2,
  Download,
  X,
  Info,
} from 'lucide-react';

interface StudioTool {
  id: string;
  title: string;
  icon: typeof Wand2;
  desc: string;
  badge: string;
  previewTitle: string;
  previewContent: string;
  sampleStats: { label: string; value: string }[];
}

export const StudioPage: React.FC = () => {
  const [activeTool, setActiveTool] = useState<StudioTool | null>(null);

  const tools: StudioTool[] = [
    {
      id: 'tool-infographic',
      title: 'Automated Evidence Infographic Generator',
      icon: Wand2,
      desc: 'Generate printable high-resolution PDF posters showing 30-minute vehicle traffic breakdowns outside Navchetna School.',
      badge: 'Simulated Layout Engine',
      previewTitle: 'Jaipur School Corridor Pedestrian Safety Snapshot',
      previewContent:
        'Visual summary infographic compiling 38 student traffic counts: 85% vehicle approach speed > 40 km/h, 320 morning pedestrian crossings, 0 signalized pedestrian phases.',
      sampleStats: [
        { label: 'Audited Corridors', value: '4 Gates' },
        { label: 'Morning Peak Volume', value: '620 veh/hr' },
        { label: 'Student Support', value: '94%' },
      ],
    },
    {
      id: 'tool-reel',
      title: 'Student Voice Reel Synthesizer',
      icon: Video,
      desc: 'Compile 15-second peer audio quotes into a municipal presentation deck with animated captions in Hindi & English.',
      badge: 'Simulated Audio Weaver',
      previewTitle: 'Ward 24 Youth Voice Compilation',
      previewContent:
        'Audio clip transcripts: "We have to wait 5 minutes just to cross to our morning assembly" (Aarav, Class 11) & "Vehicles do not brake until the last second" (Kavita, Class 10).',
      sampleStats: [
        { label: 'Voice Testimonials', value: '8 Clips' },
        { label: 'Audio Duration', value: '2m 15s' },
        { label: 'Subtitles', value: 'HI / EN' },
      ],
    },
    {
      id: 'tool-flyer',
      title: 'Multilingual Community Action Flyer',
      icon: Palette,
      desc: 'Format localized pamphlets in Hindi (हिन्दी), Rajasthani, and English for merchant association outreach.',
      badge: 'Multilingual Canvas Preview',
      previewTitle: 'Safe Crossings for Our Children - Community Notice',
      previewContent:
        'सुरक्षित स्कूल परिधि अभियान: कृपया स्कूल समय (प्रातः 7:30 - 8:30) में गति 25 किमी/घंटा रखें।',
      sampleStats: [
        { label: 'Languages', value: '3 Active' },
        { label: 'Print Format', value: 'A5 Flyer' },
        { label: 'Merchant QR Link', value: 'Active' },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DemoPreviewBadge
        size="banner"
        label="Civic Studio Preview"
        description="Multimedia creation suite for generating community infographics, video testimonials, and data charts for municipal campaigns."
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <Palette className="w-6 h-6 text-civic-saffron-600" />
          <span>Civic Studio & Campaign Creator</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Design visual posters, infographics, and social proof reels to support youth propositions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tools.map((t) => {
          const IconComponent = t.icon;
          return (
            <Card key={t.id} className="p-6 border-slate-200 space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-civic-saffron-50 text-civic-saffron-600 flex items-center justify-center border border-civic-saffron-100">
                  <IconComponent className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">{t.title}</CardTitle>
                <p className="text-xs text-slate-600 leading-relaxed">{t.desc}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <DemoPreviewBadge size="sm" label={t.badge} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTool(t)}
                  className="text-xs"
                >
                  Launch Creator
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Creator Modal */}
      {activeTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-civic-saffron-600 uppercase">
                  Studio Asset Preview &bull; {activeTool.badge}
                </span>
                <h3 className="text-base font-bold font-heading text-slate-900">
                  {activeTool.previewTitle}
                </h3>
              </div>
              <button
                onClick={() => setActiveTool(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2 text-[10px] text-civic-teal-400 font-bold uppercase">
                  <span>JanSahabhag 2047 Public Campaign Card</span>
                  <span>Jaipur Ward 24</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-200">
                  {activeTool.previewContent}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-700 text-center">
                  {activeTool.sampleStats.map((st, i) => (
                    <div key={i} className="p-1.5 bg-white/10 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">{st.label}</span>
                      <span className="text-xs font-bold text-white block mt-0.5">{st.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulated AI disclosure */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Simulated AI Engine:</strong> Studio layout templates are generated dynamically using simulated media components. Asset exports can be shared in community deliberative assemblies.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTool(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTool(null)}
              >
                <Download className="w-4 h-4 mr-1.5" />
                <span>Simulated Export Poster</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
