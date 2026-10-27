import React from 'react';
import { SeatModel } from './types';
import { SeatItem } from './SeatItem';
import { Users, HelpCircle, ShieldAlert, Sparkles, CheckCircle2, UserCheck } from 'lucide-react';

interface AssemblySeatingLayoutProps {
  seats: SeatModel[];
  selectedSeatId?: string | null;
  onSelectSeat?: (seat: SeatModel) => void;
  activeSpeakerId?: string | null;
  suppressAnimation?: boolean;
  textMode?: boolean;
}

export const AssemblySeatingLayout: React.FC<AssemblySeatingLayoutProps> = ({
  seats,
  selectedSeatId,
  onSelectSeat,
  activeSpeakerId: _activeSpeakerId,
  suppressAnimation = false,
  textMode = false,
}) => {
  // Categorize seats into:
  // 1. Procedural Leadership (Chair / Facilitator / Co-Chair)
  // 2. Thinkers (indigo)
  // 3. Enablers (emerald)
  // 4. Troubleshooters (amber)
  // 5. Shapers (purple)

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
      title: 'Thinkers',
      purpose: 'Analyse & Research',
      icon: HelpCircle,
      borderColor: 'border-indigo-200',
      bgColor: 'bg-indigo-50/30',
      headerBg: 'bg-indigo-600 text-white',
      purposeColor: 'text-indigo-100',
      badgeBg: 'bg-indigo-700/80 text-indigo-100',
      seats: thinkerSeats,
    },
    {
      id: 'enabler',
      title: 'Enablers',
      purpose: 'Build Solutions',
      icon: CheckCircle2,
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50/30',
      headerBg: 'bg-emerald-600 text-white',
      purposeColor: 'text-emerald-100',
      badgeBg: 'bg-emerald-700/80 text-emerald-100',
      seats: enablerSeats,
    },
    {
      id: 'troubleshooter',
      title: 'Troubleshooters',
      purpose: 'Solve Challenges',
      icon: ShieldAlert,
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50/30',
      headerBg: 'bg-amber-600 text-white',
      purposeColor: 'text-amber-100',
      badgeBg: 'bg-amber-700/80 text-amber-100',
      seats: troubleshooterSeats,
    },
    {
      id: 'shaper',
      title: 'Shapers',
      purpose: 'Present & Lead',
      icon: Sparkles,
      borderColor: 'border-purple-200',
      bgColor: 'bg-purple-50/30',
      headerBg: 'bg-purple-600 text-white',
      purposeColor: 'text-purple-100',
      badgeBg: 'bg-purple-700/80 text-purple-100',
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
      {/* Procedural Leadership (Chair & Facilitator) above the zones */}
      {proceduralSeats.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
            <UserCheck className="w-4 h-4 text-civic-indigo-600" />
            <span>Procedural Leadership (Chair & Facilitator)</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {proceduralSeats.map((seat) => (
              <div key={seat.id} className="w-36 sm:w-44">
                <SeatItem
                  seat={seat}
                  isSelected={selectedSeatId === seat.id}
                  onSelect={onSelectSeat}
                  suppressAnimation={suppressAnimation}
                  textMode={textMode}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The four role zones as four columns (at 375px stack to one) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {zones.map((zone) => {
          const Icon = zone.icon;
          return (
            <div
              key={zone.id}
              className={`flex flex-col rounded-xl border ${zone.borderColor} ${zone.bgColor} overflow-hidden shadow-2xs`}
              data-testid={`assembly-zone-${zone.id}`}
            >
              {/* Coloured Header with Role Name and One-line Purpose */}
              <div className={`p-3 ${zone.headerBg} space-y-0.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <h4 className="font-bold text-sm font-heading truncate">{zone.title}</h4>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${zone.badgeBg} shrink-0`}>
                    {zone.seats.length} {zone.seats.length === 1 ? 'Seat' : 'Seats'}
                  </span>
                </div>
                <p className={`text-xs ${zone.purposeColor} font-medium leading-tight`}>{zone.purpose}</p>
              </div>

              {/* Zone Seat Tiles */}
              <div className="p-3 flex-1 space-y-2">
                {zone.seats.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2">
                    {zone.seats.map((seat) => (
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
                ) : (
                  <p className="text-xs text-slate-400 italic py-6 text-center">
                    No delegates seated in this zone.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Chamber Delegates if any */}
      {otherSeats.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <h4 className="font-bold text-xs text-slate-700">Additional Chamber Delegates</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {otherSeats.map((seat) => (
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
