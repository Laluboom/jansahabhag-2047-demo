import React from 'react';
import { SeatModel, SessionTextTurn, getInitials } from './types';
import { Mic, AlertTriangle, Building2, Activity, ShieldCheck, MessageSquare, Clock, Info, UserCheck } from 'lucide-react';

interface AccessibleListViewProps {
  seats: SeatModel[];
  selectedSeatId?: string | null;
  onSelectSeat?: (seat: SeatModel) => void;
  layoutName?: string;
  activeSpeakerId?: string | null;
  sampleTurns?: SessionTextTurn[];
  missedTurns?: SessionTextTurn[];
  restoredSeatName?: string | null;
}

export const AccessibleListView: React.FC<AccessibleListViewProps> = ({
  seats,
  selectedSeatId,
  onSelectSeat,
  layoutName = 'Chamber',
  activeSpeakerId,
  sampleTurns = [],
  missedTurns = [],
  restoredSeatName,
}) => {
  // Group seats by sideOrBench without inferring stance from functional roles
  const groups: Record<string, SeatModel[]> = {};
  for (const seat of seats) {
    const key = seat.sideOrBench || 'General Seating (Unassigned Stance)';
    if (!groups[key]) groups[key] = [];
    groups[key].push(seat);
  }

  // Active floor speaker
  const activeSpeakerSeat = seats.find(
    (s) => s.isSpeaking || s.status === 'speaking' || s.userId === activeSpeakerId || s.id === activeSpeakerId
  );

  // Queue of waiting participants
  const waitingQueue = seats.filter(
    (s) => s.status === 'waiting' && s.id !== activeSpeakerSeat?.id
  );

  return (
    <section
      className="space-y-5 p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs"
      data-testid="accessible-seating-list-view"
      role="region"
      aria-label={`${layoutName} Accessible Text & List Mode`}
      aria-live="polite"
    >
      {/* Chamber Header & Text Mode Identification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm font-heading text-slate-900">
              Accessible Chamber Seating Directory ({seats.length} Seats)
            </h3>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300 font-mono"
              data-testid="text-mode-badge"
            >
              Text Mode Active (Initials • Zero Animation • Privacy Safe)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured text representation of chamber seating, functional roles, speaker queue, and deliberative turns.
          </p>
        </div>

        {restoredSeatName && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium self-start sm:self-auto shrink-0"
            data-testid="restored-seat-notice"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Restored seat: <strong>{restoredSeatName}</strong></span>
          </div>
        )}
      </div>

      {/* SPEAKER QUEUE & ACTIVE FLOOR SPEAKER SECTION */}
      <div
        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
        data-testid="speaker-queue-section"
      >
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-800 font-heading">
            <Mic className="w-3.5 h-3.5 text-emerald-600" />
            <span>Chamber Speaker Queue & Floor Status</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {waitingQueue.length} Waiting in Queue
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Active Speaker */}
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Recognized Floor Speaker
            </span>
            {activeSpeakerSeat ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 select-none"
                  data-testid={`queue-initials-${activeSpeakerSeat.id}`}
                >
                  {activeSpeakerSeat.initials || getInitials(activeSpeakerSeat.name)}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 block truncate">
                    {activeSpeakerSeat.name}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {activeSpeakerSeat.role} &bull; {activeSpeakerSeat.sideOrBench || 'General'}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-slate-400 italic text-[11px] block">
                Podium open. Facilitator recognizing next speaker from queue.
              </span>
            )}
          </div>

          {/* Waiting Queue */}
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
              Speaker Queue Order
            </span>
            {waitingQueue.length > 0 ? (
              <ol className="space-y-1.5" role="list">
                {waitingQueue.map((seat, idx) => (
                  <li
                    key={seat.id}
                    className="flex items-center justify-between gap-2 text-[11px] text-slate-700"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-4 text-slate-400 font-mono font-semibold">
                        #{idx + 1}
                      </span>
                      <div
                        className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-[10px] shrink-0 select-none"
                        data-testid={`queue-initials-${seat.id}`}
                      >
                        {seat.initials || getInitials(seat.name)}
                      </div>
                      <span className="font-medium text-slate-900 truncate">
                        {seat.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                      In Queue
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <span className="text-slate-400 italic text-[11px] block">
                Queue is empty. Any delegate may request speaking turn.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* MISSED SAMPLE TURNS SECTION (SURFACED UPON RELOAD / RETURN) */}
      {missedTurns && missedTurns.length > 0 && (
        <div
          className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs space-y-2.5"
          data-testid="missed-turns-container"
          role="region"
          aria-label="Missed Sample Turns"
        >
          <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Missed Sample Turns ({missedTurns.length} while disconnected)</span>
            </div>
            <span className="text-[10px] text-amber-800 font-mono bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
              Restored from Browser State
            </span>
          </div>

          <div className="space-y-2">
            {missedTurns.map((turn) => (
              <div
                key={turn.id}
                className="p-2 rounded-lg bg-white/90 border border-amber-200 text-xs space-y-1"
                data-testid={`missed-turn-${turn.id}`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-700 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[10px] font-bold">
                      {getInitials(turn.authorName)}
                    </span>
                    <span>{turn.authorName}</span>
                    {turn.authorRole && (
                      <span className="text-slate-400 font-normal">({turn.authorRole})</span>
                    )}
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">{turn.timestamp}</span>
                </div>
                <p className="text-slate-800 pl-6 leading-relaxed">{turn.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAMPLE DELIBERATIVE TEXT TURNS FEED */}
      {sampleTurns && sampleTurns.length > 0 && (
        <div
          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
          data-testid="sample-text-turns"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-800 font-heading">
              <MessageSquare className="w-3.5 h-3.5 text-civic-indigo-600" />
              <span>Sample Deliberative Text Turns</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {sampleTurns.length} Recent Turns
            </span>
          </div>

          <div className="space-y-2">
            {sampleTurns.map((turn) => (
              <div
                key={turn.id}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs space-y-1 shadow-2xs"
                data-testid={`sample-turn-${turn.id}`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-civic-indigo-100 text-civic-indigo-800 flex items-center justify-center text-[10px] font-bold select-none">
                      {getInitials(turn.authorName)}
                    </span>
                    <span data-testid={`sample-turn-author-${turn.id}`}>{turn.authorName}</span>
                    {turn.authorRole && (
                      <span className="text-slate-400 font-normal">({turn.authorRole})</span>
                    )}
                  </div>
                  <span
                    className="text-slate-400 text-[10px] font-mono shrink-0"
                    data-testid={`sample-turn-time-${turn.id}`}
                  >
                    {turn.timestamp}
                  </span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed pl-6" data-testid={`sample-turn-text-${turn.id}`}>
                  {turn.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHAMBER SEATING DIRECTORY (Organized by Bench/Zone without inferred stance) */}
      <div className="space-y-6" data-testid="text-mode-seating-directory">
        {Object.entries(groups).map(([groupTitle, groupSeats]) => (
          <div key={groupTitle} className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 font-heading">
                {groupTitle} ({groupSeats.length})
              </h4>
            </div>

            <ul className="space-y-2" role="list">
              {groupSeats.map((seat) => {
                const isSelected = selectedSeatId === seat.id;
                const isSpeaking = Boolean(seat.isSpeaking || seat.status === 'speaking');
                const initials = seat.initials || getInitials(seat.name);

                return (
                  <li
                    key={seat.id}
                    role="listitem"
                    className={`p-3 rounded-xl border text-xs ${
                      isSelected
                        ? 'border-civic-indigo-500 bg-civic-indigo-50/70 shadow-xs ring-1 ring-civic-indigo-400'
                        : isSpeaking
                        ? 'border-emerald-400 bg-emerald-50/60 ring-1 ring-emerald-300'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* INITIALS ONLY - NEVER PHOTOS */}
                          <div
                            className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 border select-none ${
                              isSpeaking
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-civic-indigo-100 text-civic-indigo-800 border-civic-indigo-200'
                            }`}
                            data-testid={`seat-initials-${seat.id}`}
                            title={`Initials for ${seat.name}`}
                          >
                            {initials}
                          </div>

                          <span className="font-bold text-slate-900 text-xs">
                            {seat.name}
                          </span>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {seat.role}
                          </span>

                          {isSpeaking && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300"
                              data-testid="list-speaking-indicator"
                            >
                              <Mic className="w-3 h-3" />
                              <span>Speaking Now</span>
                            </span>
                          )}

                          {seat.status === 'waiting' && !isSpeaking && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300"
                              data-testid="list-waiting-indicator"
                            >
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>In Queue</span>
                            </span>
                          )}

                          {seat.hasDissent && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300"
                              data-testid="list-dissent-indicator"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Registered Dissent</span>
                            </span>
                          )}

                          {seat.isReserved && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200"
                              data-testid="list-reserved-indicator"
                            >
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              <span>33% Reserved</span>
                            </span>
                          )}
                        </div>

                        {/* Public Institution */}
                        {seat.institution && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{seat.institution}</span>
                          </div>
                        )}

                        {/* Public Current Activity */}
                        {seat.currentActivity && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-600 pt-0.5">
                            <Activity className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{seat.currentActivity}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectSeat?.(seat)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium self-start sm:self-auto shrink-0 ${
                          isSelected
                            ? 'bg-civic-indigo-600 text-white border-civic-indigo-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                        aria-pressed={isSelected}
                      >
                        {isSelected ? 'Selected' : 'Inspect Seat'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* HONEST BACKEND RECONNECT CONTINUITY DISCLAIMER */}
      <div
        className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5"
        data-testid="reconnect-backend-disclaimer"
      >
        <Info className="w-4 h-4 text-civic-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed text-[11px]">
          <p className="font-semibold text-slate-800">
            Single-Browser Local Reconnect Continuity
          </p>
          <p>
            This demo restores seat selections, preferences, and sample turns locally from browser state. True multi-user reconnect continuity, synchronized queue arbitration, and live speaking turns require a production backend deliberative gateway.
          </p>
        </div>
      </div>
    </section>
  );
};
