import React from 'react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { Sparkles, Palette, Video, Wand2, ArrowRight } from 'lucide-react';

export const StudioPage: React.FC = () => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6 border-slate-200 space-y-3">
          <Wand2 className="w-6 h-6 text-civic-indigo-600" />
          <CardTitle className="text-base font-bold text-slate-900">
            Automated Evidence Infographic Generator
          </CardTitle>
          <p className="text-xs text-slate-600 leading-relaxed">
            Generate printable high-resolution PDF posters showing 30-minute vehicle traffic breakdowns outside Navchetna School.
          </p>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <DemoPreviewBadge size="sm" label="Simulated Tool" />
            <Button size="sm" variant="outline" disabled>
              Launch Creator
            </Button>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 space-y-3">
          <Video className="w-6 h-6 text-civic-teal-600" />
          <CardTitle className="text-base font-bold text-slate-900">
            Student Voice Reel Synthesizer
          </CardTitle>
          <p className="text-xs text-slate-600 leading-relaxed">
            Compile 15-second peer audio quotes into a municipal presentation deck.
          </p>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <DemoPreviewBadge size="sm" label="Simulated Tool" />
            <Button size="sm" variant="outline" disabled>
              Launch Creator
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
