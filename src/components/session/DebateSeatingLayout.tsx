import React from 'react';
import { SeatModel } from './types';
import { SeatItem } from './SeatItem';
import { SpeakingQueueEntry, CANONICAL_DEBATE_ROLES, CanonicalDebateRole } from '../../types/domain';
import { Mic, Scale, Clock } from 'lucide-react';

interface DebateSeatingLayoutProps {
  seats: SeatModel[];
  selectedSeatId?: string | null;
  onSelectSeat?: (seat: SeatModel) => void;
  activeSpeakerId?: string | null;
  suppressAnimation?: boolean;
  textMode?: boolean;
  speakingQueue?: SpeakingQueueEntry[];
}

export const DebateSeatingLayout: React.FC<DebateSeatingLayoutProps> = ({
  seats,
  selectedSeatId,
  onSelectSeat,
  activeSpeakerId,
  suppressAnimation = false,
  textMode = false,
  speakingQueue,
}) => {
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

  // Facilitator seat: primary moderator
  const facilitatorSeat =
    seats.find((s) => s.role.toLowerCase().includes('facilitator')) || moderatorSeats[0];

  // The remaining six participants, ordered by CanonicalDebateRole union order
  const participantSeats = React.useMemo(() => {
    const list =
      forSeats.length > 0 || againstSeats.length > 0
        ? neutralSeats
        : seats.filter((s) => s.id !== facilitatorSeat?.id);

    return [...list].sort((a, b) => {
      const idxA = CANONICAL_DEBATE_ROLES.indexOf(a.role as CanonicalDebateRole);
      const idxB = CANONICAL_DEBATE_ROLES.indexOf(b.role as CanonicalDebateRole);
      const orderA = idxA !== -1 ? idxA : 999;
      const orderB = idxB !== -1 ? idxB : 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });
  }, [forSeats.length, againstSeats.length, neutralSeats, seats, facilitatorSeat?.id]);

  // Determine active speaker seat
  const activeSpeakerSeat = seats.find(
    (s) =>
      s.isSpeaking ||
      s.status === 'speaking' ||
      s.userId === activeSpeakerId ||
      s.id === activeSpeakerId
  );

  // Effective Speaking Queue: passed prop, or attached to seats array, or empty
  const effectiveQueue: SpeakingQueueEntry[] = React.useMemo(() => {
    if (speakingQueue && speakingQueue.length > 0) return speakingQueue;
    if ((seats as unknown as { speakingQueue?: SpeakingQueueEntry[] }).speakingQueue) {
      return (seats as unknown as { speakingQueue: SpeakingQueueEntry[] }).speakingQueue;
    }
    return [];
  }, [speakingQueue, seats]);

  // First waiting entry gets the 'Next' badge
  const firstWaitingQueueId = React.useMemo(() => {
    return effectiveQueue.find((q) => q.status === 'waiting')?.id;
  }, [effectiveQueue]);

  return (
    <div
      className="space-y-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg border border-slate-700/80 min-w-0 overflow-x-hidden"
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
        <span className="text-[11px] font-mono text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 self-start sm:self-auto">
          Structured Deliberation Layout
        </span>
      </div>

      {/* TOP: Facilitator single highlighted tile */}
      <div className="space-y-2" data-testid="debate-bench-moderator">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-civic-indigo-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-civic-indigo-300 font-heading">
              Facilitator
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Moderator &amp; Procedural Bench
          </span>
        </div>

        <div className="flex justify-center max-w-xs mx-auto">
          {facilitatorSeat ? (
            <div className="w-full sm:w-56 p-1 rounded-xl bg-civic-indigo-950/40 border-2 border-civic-indigo-500/60 shadow-lg ring-1 ring-civic-indigo-400/40">
              <SeatItem
                seat={facilitatorSeat}
                isSelected={selectedSeatId === facilitatorSeat.id}
                onSelect={onSelectSeat}
                suppressAnimation={suppressAnimation}
                textMode={textMode}
              />
            </div>
          ) : (
            <div className="text-xs text-slate-300 italic py-2">
              Facilitator / Moderator seated at procedural rostrum.
            </div>
          )}
        </div>
      </div>

      {/* CENTER: Active Speaker Rostrum / Floor Podium */}
      <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 max-w-md mx-auto text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
          <Mic
            className={`w-4 h-4 ${
              suppressAnimation || textMode ? '' : 'motion-safe:animate-pulse'
            }`}
          />
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
          <p className="text-xs text-slate-300 italic py-1">
            Podium open. Awaiting recognized turn from the speaking queue.
          </p>
        )}
      </div>

      {/* MAIN CHAMBER BODY: Remaining Participants Grid + Speaking Queue Beside It */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Remaining Participants Grid */}
        <div
          className={`${
            effectiveQueue.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'
          } p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-3`}
          data-testid="debate-bench-neutral"
        >
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 font-heading">
                Participants ({participantSeats.length})
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Functional Roles
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {participantSeats.map((seat) => (
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

        {/* Speaking Queue Beside Grid */}
        {effectiveQueue.length > 0 && (
          <div
            className="lg:col-span-4 p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-3"
            data-testid="chamber-speaking-queue"
          >
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-300 font-heading">
                  Speaking Queue ({effectiveQueue.length})
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {effectiveQueue.length} queued
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {effectiveQueue.map((entry, idx) => {
                const isNext = entry.id === firstWaitingQueueId;
                return (
                  <div
                    key={entry.id || idx}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/80 flex items-center justify-between text-xs gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-100 truncate">
                          {entry.userName}
                        </div>
                        {entry.userRole && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {entry.userRole}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isNext && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider"
                          data-testid="queue-next-badge"
                        >
                          Next
                        </span>
                      )}
                      {entry.status === 'speaking' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider">
                          Speaking
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
            <span className="text-[10px] text-slate-300 font-mono">
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
              <p className="text-xs text-slate-300 italic py-4 text-center">
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
            <span className="text-[10px] text-slate-300 font-mono">
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
              <p className="text-xs text-slate-300 italic py-4 text-center">
                Visual placeholder bench awaiting explicit participant stance.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
