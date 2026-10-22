import React from 'react';
import { SeatModel } from './types';
import { SeatItem } from './SeatItem';
import { Users, HelpCircle, ShieldAlert, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';

interface AssemblySeatingLayoutProps {
  seats: SeatModel[];
  selectedSeatId?: string | null;
  onSelectSeat?: (seat: SeatModel) => void;
  activeSpeakerId?: string | null;
}

export const AssemblySeatingLayout: React.FC<AssemblySeatingLayoutProps> = ({
  seats,
  selectedSeatId,
  onSelectSeat,
  activeSpeakerId,
}) => {
  // Categorize seats into:
  // 1. Procedural Leadership (Chair / Facilitator / Co-Chair)
  // 2. Thinker Zone (Question Setter)
  // 3. Enabler Zone (Feasibility Check)
  // 4. Troubleshooter Zone (Red Flag)
  // 5. Shaper Zone (Proposition Call)

  const isProcedural = (s: SeatModel) =>
    s.role.toLowerCase().includes('chair') ||
    s.role.toLowerCase().includes('facilitator') ||
    s.sideOrBench?.toLowerCase().includes('chair') ||
    s.sideOrBench?.toLowerCase().includes('facilitator');

  const proceduralSeats = seats.filter(isProcedural);

  const getZoneSeats = (zoneName: string) => {
    return seats.filter(
      (s) =>
        !isProcedural(s) &&
        (s.role.toLowerCase().includes(zoneName.toLowerCase()) ||
          s.sideOrBench?.toLowerCase().includes(zoneName.toLowerCase()))
    );
  };

  const thinkerSeats = getZoneSeats('Thinker');
  const enablerSeats = getZoneSeats('Enabler');
  const troubleshooterSeats = getZoneSeats('Troubleshooter');
  const shaperSeats = getZoneSeats('Shaper');

  // Any remaining seats that didn't match the four canonical functional roles
  const otherSeats = seats.filter(
    (s) =>
      !isProcedural(s) &&
      !thinkerSeats.includes(s) &&
      !enablerSeats.includes(s) &&
      !troubleshooterSeats.includes(s) &&
      !shaperSeats.includes(s)
  );

  const zones = [
    {
      id: 'thinker',
      title: 'Thinker Zone',
      subtitle: 'Question Setter & Problem Framing',
      icon: HelpCircle,
      borderColor: 'border-civic-teal-300',
      bgColor: 'bg-civic-teal-50/50',
      headerBg: 'bg-civic-teal-100 text-civic-teal-900',
      seats: thinkerSeats,
    },
    {
      id: 'enabler',
      title: 'Enabler Zone',
      subtitle: 'Feasibility, IRC Standards & Budgets',
      icon: CheckCircle2,
      borderColor: 'border-civic-indigo-300',
      bgColor: 'bg-civic-indigo-50/50',
      headerBg: 'bg-civic-indigo-100 text-civic-indigo-900',
      seats: enablerSeats,
    },
    {
      id: 'troubleshooter',
      title: 'Troubleshooter Zone',
      subtitle: 'Red Flags, Hazards & Unintended Consequences',
      icon: ShieldAlert,
      borderColor: 'border-amber-300',
      bgColor: 'bg-amber-50/50',
      headerBg: 'bg-amber-100 text-amber-900',
      seats: troubleshooterSeats,
    },
    {
      id: 'shaper',
      title: 'Shaper Zone',
      subtitle: 'Proposition Drafting & Binding Consensus',
      icon: Sparkles,
      borderColor: 'border-purple-300',
      bgColor: 'bg-purple-50/50',
      headerBg: 'bg-purple-100 text-purple-900',
      seats: shaperSeats,
    },
  ];

  return (
    <div
      className="space-y-6 p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm"
      data-testid="assembly-seating-layout"
      role="region"
      aria-label="Youth Assembly Four Functional Zones Chamber Layout"
    >
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-civic-teal-600" />
          <h3 className="font-bold text-sm font-heading tracking-wide text-slate-900">
            Youth Chamber: Four Balanced Functional Zones
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
          Deliberative Non-Hierarchical Model
        </span>
      </div>

      {/* TOP: Procedural Rostrum (Chair & Facilitator) */}
      {proceduralSeats.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <UserCheck className="w-4 h-4 text-civic-indigo-600" />
            <span>Chamber Procedural Rostrum (Chair & Facilitator)</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {proceduralSeats.map((seat) => (
              <div key={seat.id} className="w-full sm:w-64">
                <SeatItem
                  seat={seat}
                  isSelected={selectedSeatId === seat.id}
                  onSelect={onSelectSeat}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 BALANCED FUNCTIONAL ZONES (2x2 Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((zone) => {
          const Icon = zone.icon;
          return (
            <div
              key={zone.id}
              className={`p-4 rounded-xl border ${zone.borderColor} ${zone.bgColor} space-y-3`}
              data-testid={`assembly-zone-${zone.id}`}
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-lg ${zone.headerBg}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 font-heading">
                      {zone.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 block">
                      {zone.subtitle}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                  {zone.seats.length} Delegates
                </span>
              </div>

              <div className="space-y-2">
                {zone.seats.length > 0 ? (
                  zone.seats.map((seat) => (
                    <SeatItem
                      key={seat.id}
                      seat={seat}
                      isSelected={selectedSeatId === seat.id}
                      onSelect={onSelectSeat}
                    />
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-3 text-center">
                    No delegates seated in this zone.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Open Delegates if any */}
      {otherSeats.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <h4 className="font-bold text-xs text-slate-700">Additional Chamber Delegates</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {otherSeats.map((seat) => (
              <SeatItem
                key={seat.id}
                seat={seat}
                isSelected={selectedSeatId === seat.id}
                onSelect={onSelectSeat}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
