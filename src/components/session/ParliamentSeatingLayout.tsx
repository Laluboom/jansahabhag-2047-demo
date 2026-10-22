import React from 'react';
import { SeatModel } from './types';
import { SeatItem } from './SeatItem';
import { Landmark, AlertCircle } from 'lucide-react';

interface ParliamentSeatingLayoutProps {
  seats: SeatModel[];
  selectedSeatId?: string | null;
  onSelectSeat?: (seat: SeatModel) => void;
  activeSpeakerId?: string | null;
  isIllustrative?: boolean;
  suppressAnimation?: boolean;
  textMode?: boolean;
}

export const ParliamentSeatingLayout: React.FC<ParliamentSeatingLayoutProps> = ({
  seats,
  selectedSeatId,
  onSelectSeat,
  activeSpeakerId,
  isIllustrative = true,
  suppressAnimation = false,
  textMode = false,
}) => {
  // Categorize seats into:
  // 1. Speaker Bench (Presiding Speaker / Deputy Speaker)
  // 2. Government / Treasury Benches (Sponsors & State Delegations)
  // 3. Opposition / Scrutiny Benches
  // 4. Cross-benches (Regional / Independent Delegations, including Jaipur Delegation)

  const isSpeaker = (s: SeatModel) =>
    s.sideOrBench?.toLowerCase().includes('speaker') ||
    s.role.toLowerCase().includes('speaker') ||
    s.role.toLowerCase().includes('presiding');

  const isGovernment = (s: SeatModel) =>
    s.sideOrBench?.toLowerCase().includes('government') ||
    s.sideOrBench?.toLowerCase().includes('treasury') ||
    s.role.toLowerCase().includes('sponsor') ||
    s.role.toLowerCase().includes('minister');

  const isOpposition = (s: SeatModel) =>
    s.sideOrBench?.toLowerCase().includes('opposition') ||
    s.sideOrBench?.toLowerCase().includes('scrutiny') ||
    s.role.toLowerCase().includes('shadow') ||
    s.role.toLowerCase().includes('opposition');

  const speakerSeats = seats.filter(isSpeaker);
  const governmentSeats = seats.filter(isGovernment);
  const oppositionSeats = seats.filter(isOpposition);
  const crossBenchSeats = seats.filter(
    (s) => !isSpeaker(s) && !isGovernment(s) && !isOpposition(s)
  );

  return (
    <div
      className="space-y-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-700"
      data-testid="parliament-seating-layout"
      role="region"
      aria-label="National Youth Parliament Horseshoe Chamber Layout"
    >
      {/* Chamber Header & Illustrative Disclaimer Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-civic-saffron-400" />
          <div>
            <h3 className="font-bold text-sm font-heading tracking-wide text-slate-100">
              National Apex Chamber: Plenary Horseshoe Seating
            </h3>
            <span className="text-[11px] text-slate-400 block">
              Speaker &bull; Government / Treasury &bull; Opposition &bull; Cross-benches
            </span>
          </div>
        </div>

        {isIllustrative && (
          <span
            className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 self-start sm:self-auto"
            data-testid="parliament-illustrative-badge"
          >
            Illustrative Seating Prototype — No Statutory Claim
          </span>
        )}
      </div>

      {isIllustrative && (
        <div
          className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2 leading-relaxed"
          data-testid="parliament-illustrative-callout"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong>Chamber Notice:</strong> National parliament seating layout and apex plenary numbers are
            illustrative prototype representations for the competition demonstration. No national member
            enforcement or statutory quota allocation is claimed for the apex plenary.
          </p>
        </div>
      )}

      {/* APEX OF HORSESHOE: Speaker's Presiding Bench */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-civic-saffron-300 border border-civic-saffron-500/30 text-xs font-bold font-mono">
          <Landmark className="w-3.5 h-3.5" />
          <span>Speaker of the House & Presiding Rostrum</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 max-w-md mx-auto pt-1">
          {speakerSeats.length > 0 ? (
            speakerSeats.map((seat) => (
              <div key={seat.id} className="w-full sm:w-60">
                <SeatItem
                  seat={seat}
                  isSelected={selectedSeatId === seat.id}
                  onSelect={onSelectSeat}
                  suppressAnimation={suppressAnimation}
                  textMode={textMode}
                />
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">Presiding Speaker Rostrum</p>
          )}
        </div>
      </div>

      {/* HORSESHOE WINGS: Government (Left) vs Opposition (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* LEFT ARC: Government & Sponsoring Benches */}
        <div
          className="p-4 rounded-xl bg-slate-800/70 border border-civic-teal-700/50 space-y-3"
          data-testid="parliament-bench-government"
        >
          <div className="flex items-center justify-between border-b border-civic-teal-800/40 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-civic-teal-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-civic-teal-300 font-heading">
                Government & Sponsoring Benches
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {governmentSeats.length} Seats
            </span>
          </div>

          <div className="space-y-2.5">
            {governmentSeats.length > 0 ? (
              governmentSeats.map((seat) => (
                <SeatItem
                  key={seat.id}
                  seat={seat}
                  isSelected={selectedSeatId === seat.id}
                  onSelect={onSelectSeat}
                  suppressAnimation={suppressAnimation}
                  textMode={textMode}
                />
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                No delegates seated on Government benches.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT ARC: Opposition & Scrutiny Benches */}
        <div
          className="p-4 rounded-xl bg-slate-800/70 border border-rose-700/50 space-y-3"
          data-testid="parliament-bench-opposition"
        >
          <div className="flex items-center justify-between border-b border-rose-800/40 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-300 font-heading">
                Opposition & Scrutiny Benches
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {oppositionSeats.length} Seats
            </span>
          </div>

          <div className="space-y-2.5">
            {oppositionSeats.length > 0 ? (
              oppositionSeats.map((seat) => (
                <SeatItem
                  key={seat.id}
                  seat={seat}
                  isSelected={selectedSeatId === seat.id}
                  onSelect={onSelectSeat}
                  suppressAnimation={suppressAnimation}
                  textMode={textMode}
                />
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-3 text-center">
                No delegates seated on Opposition benches.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BASE OF HORSESHOE: Cross-benches (Connecting Arc) */}
      <div
        className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-3"
        data-testid="parliament-bench-crossbench"
      >
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-civic-saffron-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-civic-saffron-300 font-heading">
              Cross-benches & State Delegations (Connecting Arc)
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {crossBenchSeats.length} Seats
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {crossBenchSeats.length > 0 ? (
            crossBenchSeats.map((seat) => (
              <SeatItem
                key={seat.id}
                seat={seat}
                isSelected={selectedSeatId === seat.id}
                onSelect={onSelectSeat}
                suppressAnimation={suppressAnimation}
                textMode={textMode}
              />
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-3 text-center col-span-full">
              No delegates seated on Cross-benches.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
