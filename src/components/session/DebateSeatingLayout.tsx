import React from 'react';
import { SeatModel } from './types';
import { SeatItem } from './SeatItem';
import { Mic, Scale, HelpCircle } from 'lucide-react';

interface DebateSeatingLayoutProps {
  seats: SeatModel[];
  selectedSeatId?: string | null;
  onSelectSeat?: (seat: SeatModel) => void;
  activeSpeakerId?: string | null;
  suppressAnimation?: boolean;
  textMode?: boolean;
}

export const DebateSeatingLayout: React.FC<DebateSeatingLayoutProps> = ({
  seats,
  selectedSeatId,
  onSelectSeat,
  activeSpeakerId,
  suppressAnimation = false,
  textMode = false,
}) => {
  // Categorize seats into:
  // 1. Moderator / Presiding bench (Facilitator, Rapporteur, or sideOrBench === 'Moderator')
  // 2. Active Speaker Podium (if someone is recognized or status === 'speaking')
  // 3. Proposition / For bench (explicitly sideOrBench === 'For' or 'Proposition')
  // 4. Opposition / Against bench (explicitly sideOrBench === 'Against' or 'Opposition')
  // 5. Unassigned / Neutral delegates (no explicit stance declared)
  //
  // NOTE: Functional roles (Evidence Analyst, Questioner, Civic Advocate, Synthesiser, Community Voice)
  // must NEVER be mapped to For or Against based on role name alone.

  const isModerator = (seat: SeatModel) =>
    seat.sideOrBench?.toLowerCase() === 'moderator' ||
    seat.role.toLowerCase().includes('facilitator') ||
    seat.role.toLowerCase().includes('rapporteur');

  const isExplicitFor = (seat: SeatModel) => {
    const s = seat.sideOrBench?.toLowerCase();
    return s === 'for' || s === 'proposition';
  };

  const isExplicitAgainst = (seat: SeatModel) => {
    const s = seat.sideOrBench?.toLowerCase();
    return s === 'against' || s === 'opposition';
  };

  const moderatorSeats = seats.filter(isModerator);
  const forSeats = seats.filter((s) => !isModerator(s) && isExplicitFor(s));
  const againstSeats = seats.filter((s) => !isModerator(s) && isExplicitAgainst(s));
  const neutralSeats = seats.filter(
    (s) => !isModerator(s) && !isExplicitFor(s) && !isExplicitAgainst(s)
  );

  // Determine active speaker seat
  const activeSpeakerSeat = seats.find(
    (s) => s.isSpeaking || s.status === 'speaking' || s.userId === activeSpeakerId || s.id === activeSpeakerId
  );

  return (
    <div
      className="space-y-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg border border-slate-700/80"
      data-testid="debate-seating-layout"
      role="region"
      aria-label="Debate Room Chamber Facing Benches Layout"
    >
      {/* Top Banner / Chamber Identifier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-civic-saffron-400" />
          <h3 className="font-bold text-sm font-heading tracking-wide text-slate-100">
            Debate Chamber: Facing Benches & Speaking Podium
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 self-start sm:self-auto">
          Structured Deliberation Layout
        </span>
      </div>

      {/* TOP: Moderator Bench & Rostrum */}
      <div className="space-y-2" data-testid="debate-bench-moderator">
        <div className="flex items-center justify-center gap-2 text-center">
          <span className="w-2 h-2 rounded-full bg-civic-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-300 font-heading">
            Moderator & Procedural Bench
          </span>
          <span className="w-2 h-2 rounded-full bg-civic-indigo-400" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg mx-auto">
          {moderatorSeats.length > 0 ? (
            moderatorSeats.map((seat) => (
              <div key={seat.id} className="w-full sm:w-56">
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
            <div className="text-xs text-slate-400 italic py-2">
              Facilitator / Moderator seated at procedural rostrum.
            </div>
          )}
        </div>
      </div>

      {/* CENTER: Active Speaker Rostrum / Floor Podium */}
      <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 max-w-md mx-auto text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
          <Mic className={`w-4 h-4 ${suppressAnimation || textMode ? '' : 'motion-safe:animate-pulse'}`} />
          <span>Central Speaker&apos;s Podium</span>
        </div>

        {activeSpeakerSeat ? (
          <div className="space-y-1">
            <div className="inline-block">
              <SeatItem
                seat={activeSpeakerSeat}
                testId={`seat-podium-${activeSpeakerSeat.id}`}
                isSelected={selectedSeatId === activeSpeakerSeat.id}
                onSelect={onSelectSeat}
                suppressAnimation={suppressAnimation}
                textMode={textMode}
              />
            </div>
            <p className="text-[11px] text-slate-300">
              Recognized by Facilitator for scheduled speaking turn.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-1">
            Podium open. Awaiting recognized turn from the speaking queue.
          </p>
        )}
      </div>

      {/* FACING BENCHES: Proposition (For) vs Opposition (Against) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* LEFT: Proposition / For Bench */}
        <div
          className="p-4 rounded-xl bg-slate-800/60 border border-emerald-900/60 space-y-3"
          data-testid="debate-bench-for"
        >
          <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-300 font-heading">
                Proposition Bench (For)
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {forSeats.length} Delegates
            </span>
          </div>

          <div className="space-y-2.5">
            {forSeats.length > 0 ? (
              forSeats.map((seat) => (
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
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Visual placeholder bench awaiting explicit participant stance.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: Opposition / Against / Inquiry Bench */}
        <div
          className="p-4 rounded-xl bg-slate-800/60 border border-amber-900/60 space-y-3"
          data-testid="debate-bench-against"
        >
          <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300 font-heading">
                Opposition Bench (Against)
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {againstSeats.length} Delegates
            </span>
          </div>

          <div className="space-y-2.5">
            {againstSeats.length > 0 ? (
              againstSeats.map((seat) => (
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
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Visual placeholder bench awaiting explicit participant stance.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* UNASSIGNED / NEUTRAL PARTICIPANTS (Awaiting Explicit Stance) */}
      {neutralSeats.length > 0 && (
        <div
          className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-3"
          data-testid="debate-bench-neutral"
        >
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 font-heading">
                Unassigned / Neutral Delegates (Awaiting Stance)
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {neutralSeats.length} Delegates
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Participants are deliberating with unassigned stance. Functional roles do not infer a For or Against position.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {neutralSeats.map((seat) => (
              <SeatItem
                key={seat.id}
                seat={seat}
                isSelected={selectedSeatId === seat.id}
                onSelect={onSelectSeat}
                suppressAnimation={suppressAnimation}
                textMode={textMode}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
