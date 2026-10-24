import React from 'react';
import { Image as ImageIcon, Video, Info } from 'lucide-react';
import { Card, CardTitle } from '../../components/ui/Card';

export const UhvWorkshopMediaPlaceholders: React.FC = () => {
  return (
    <div data-testid="uhv-media-placeholders" className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            Visual Media & Video Stream
          </span>
          <h2 className="text-lg font-bold font-heading text-slate-900 mt-1">
            Workshop Media & Documentation (Placeholders)
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          Publication-Ready Placeholders
        </span>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-700">
            Verified Media Disclosure
          </p>
          <p className="leading-relaxed">
            Visually clear placeholders for the separate UHV file's future pictures and 1–2 videos/YouTube links. No fake media or dead links are published in this demo. Workshop-owned YouTube links/embeds will be used later once released by the workshop organizers.
          </p>
        </div>
      </div>

      {/* Grid of Future Media Placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Placeholder 1: Future Pictures from Separate UHV File */}
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Future Pictures Placeholder
              </span>
              <ImageIcon className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 font-heading">
                Workshop Photography & Participant Documentation
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Clear placeholder for the separate UHV file's future pictures. High-resolution photographs from the Vadodara Savli youth workshop documenting small-group deliberations and exercises will be placed here.
              </p>
            </div>
          </div>

          <div
            className="w-full h-36 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-1.5"
            aria-label="Future workshop photo placeholder"
          >
            <ImageIcon className="w-8 h-8 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">
              Future Workshop Photographs
            </span>
            <span className="text-[11px] text-slate-500 max-w-xs">
              Separate UHV file image assets staged for integration upon verification.
            </span>
          </div>
        </Card>

        {/* Placeholder 2: Video 1 / YouTube Link */}
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-civic-indigo-800 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-200">
                Future Video Embed (1 of 2)
              </span>
              <Video className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 font-heading">
                Workshop Session: Foundations of Human Values
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Workshop-owned YouTube links/embeds will be used later. Placeholder ensures clean publication without dead URLs or unverified third-party embeds.
              </p>
            </div>
          </div>

          <div
            className="w-full h-36 rounded-xl border border-slate-200 bg-slate-900 flex flex-col items-center justify-center text-center p-4 text-slate-300 space-y-1.5"
            aria-label="Workshop video embed placeholder"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-inner">
              <Video className="w-5 h-5 text-civic-indigo-400" />
            </div>
            <span className="text-xs font-semibold text-slate-200">
              Workshop-Owned YouTube Video Embed (Later)
            </span>
            <span className="text-[10px] text-slate-400 max-w-xs">
              Direct workshop embed player will be connected here when published.
            </span>
          </div>
        </Card>

        {/* Placeholder 3: Video 2 / YouTube Link */}
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50 p-5 flex flex-col justify-between space-y-4 md:col-span-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-civic-teal-800 bg-civic-teal-50 px-2 py-0.5 rounded border border-civic-teal-200">
                Future Video Embed (2 of 2)
              </span>
              <Video className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 font-heading">
                Youth Activity: Small Group Inquiry & Mutual Understanding
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Workshop-owned YouTube links/embeds will be used later. Explores student self-inquiry on cooperation and distinguishing intention from competence.
              </p>
            </div>
          </div>

          <div
            className="w-full h-32 rounded-xl border border-slate-200 bg-slate-900 flex flex-col items-center justify-center text-center p-4 text-slate-300 space-y-1.5"
            aria-label="Workshop discussion video embed placeholder"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-inner">
              <Video className="w-5 h-5 text-civic-teal-400" />
            </div>
            <span className="text-xs font-semibold text-slate-200">
              Workshop-Owned YouTube Video Embed (Later)
            </span>
            <span className="text-[10px] text-slate-400 max-w-sm">
              Second workshop session recording and inquiry discussion embed will be activated here upon official release.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};
