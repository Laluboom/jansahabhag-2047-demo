import React from 'react';
import { SeatModel } from './types';
import { Mic, AlertTriangle, Building2, Activity, ShieldCheck } from 'lucide-react';

interface AccessibleListViewProps {
  seats: SeatModel[];
  selectedSeatId?: string | null;
  onSelectSeat?: (seat: SeatModel) => void;
  layoutName?: string;
}

export const AccessibleListView: React.FC<AccessibleListViewProps> = ({
  seats,
  selectedSeatId,
  onSelectSeat,
  layoutName = 'Chamber',
}) => {
  // Group seats by sideOrBench
  const groups: Record<string, SeatModel[]> = {};
  for (const seat of seats) {
    const key = seat.sideOrBench || 'General Seating';
    if (!groups[key]) groups[key] = [];
    groups[key].push(seat);
  }

  return (
    <section
      className="space-y-4 p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs"
      data-testid="accessible-seating-list-view"
      role="region"
      aria-label={`${layoutName} Accessible Text & List Mode`}
      aria-live="polite"
    >
      <div className="border-b border-slate-200 pb-3">
        <h3 className="font-bold text-sm font-heading text-slate-900">
          Accessible Chamber Seating Directory ({seats.length} Seats)
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Structured text representation of chamber seating, functional roles, and active speaking turns.
        </p>
      </div>

      <div className="space-y-6">
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

                return (
                  <li
                    key={seat.id}
                    role="listitem"
                    className={`p-3 rounded-xl border transition-all text-xs motion-reduce:transition-none ${
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

                        {/* Institution */}
                        {seat.institution && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{seat.institution}</span>
                          </div>
                        )}

                        {/* Current Activity */}
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
    </section>
  );
};
