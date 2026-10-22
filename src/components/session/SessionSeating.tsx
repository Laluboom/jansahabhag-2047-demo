import React, { useState } from 'react';
import { SessionSeatingProps, SeatModel } from './types';
import { DebateSeatingLayout } from './DebateSeatingLayout';
import { AssemblySeatingLayout } from './AssemblySeatingLayout';
import { ParliamentSeatingLayout } from './ParliamentSeatingLayout';
import { AccessibleListView } from './AccessibleListView';
import { SeatDetailCard } from './SeatDetailCard';
import { SeatingQuotaDisplay } from './SeatingQuotaDisplay';
import { ModeSwitcherBar } from './ModeSwitcherBar';
import { Button } from '../ui/Button';
import { List, LayoutGrid, Radio, Users, Landmark } from 'lucide-react';

export const SessionSeating: React.FC<SessionSeatingProps> = ({
  layout,
  title,
  subtitle,
  seats,
  quotaSummary,
  activeSpeakerId,
  selectedSeatId: controlledSelectedSeatId,
  onSelectSeat: controlledOnSelectSeat,
  isIllustrative = false,
  illustrativeDisclaimer,
  currentRoute,
  className = '',
}) => {
  const [internalSelectedSeatId, setInternalSelectedSeatId] = useState<string | null>(null);
  const [isListView, setIsListView] = useState<boolean>(false);

  const selectedSeatId = controlledSelectedSeatId !== undefined ? controlledSelectedSeatId : internalSelectedSeatId;

  const handleSelectSeat = (seat: SeatModel | null) => {
    if (controlledOnSelectSeat) {
      controlledOnSelectSeat(seat);
    } else {
      setInternalSelectedSeatId(seat ? seat.id : null);
    }
  };

  const selectedSeat = seats.find((s) => s.id === selectedSeatId);

  const layoutTitles: Record<string, { title: string; subtitle: string; icon: any }> = {
    debate: {
      title: title || 'Debate Room Chamber Seating',
      subtitle: subtitle || 'Facing Proposition (For) & Opposition (Against) benches with Facilitator podium',
      icon: Radio,
    },
    assembly: {
      title: title || 'Youth Assembly Deliberative Chamber',
      subtitle: subtitle || 'Four non-hierarchical functional zones: Thinker, Enabler, Troubleshooter, Shaper',
      icon: Users,
    },
    parliament: {
      title: title || 'National Youth Parliament Apex Chamber',
      subtitle: subtitle || 'Plenary horseshoe with Presiding Speaker, Government, Opposition & Cross-benches',
      icon: Landmark,
    },
  };

  const meta = layoutTitles[layout] || layoutTitles.debate;
  const LayoutIcon = meta.icon;

  return (
    <div
      className={`space-y-4 ${className}`}
      data-testid="session-seating-container"
      role="region"
      aria-label={`${meta.title} Component`}
    >
      {/* Chamber Mode Switcher Navigation (Links across the 3 pages) */}
      {currentRoute && (
        <ModeSwitcherBar currentRoute={currentRoute} />
      )}

      {/* Main Seating Frame Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-4 sm:p-5 space-y-4">
        {/* Top Header & View Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-civic-indigo-50 text-civic-indigo-700 shrink-0">
              <LayoutIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base font-heading text-slate-900">
                {meta.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* View Mode Toggle: Visual Chamber vs Accessible Text / List Mode */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsListView(!isListView)}
              className="text-xs flex items-center gap-1.5"
              aria-pressed={isListView}
              data-testid="toggle-seating-view-btn"
            >
              {isListView ? (
                <>
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Switch to Chamber Layout</span>
                </>
              ) : (
                <>
                  <List className="w-3.5 h-3.5" />
                  <span>Accessible Text / List Mode</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 33% Reservation Allocation Quota Display */}
        {quotaSummary && (
          <SeatingQuotaDisplay quota={quotaSummary} />
        )}

        {/* Detail Card when a seat is selected */}
        {selectedSeat && (
          <SeatDetailCard
            seat={selectedSeat}
            onClose={() => handleSelectSeat(null)}
          />
        )}

        {/* Render Layout or Accessible Text / List View */}
        {isListView ? (
          <AccessibleListView
            seats={seats}
            selectedSeatId={selectedSeatId}
            onSelectSeat={(seat) => handleSelectSeat(seat)}
            layoutName={meta.title}
          />
        ) : layout === 'debate' ? (
          <DebateSeatingLayout
            seats={seats}
            selectedSeatId={selectedSeatId}
            onSelectSeat={(seat) => handleSelectSeat(seat)}
            activeSpeakerId={activeSpeakerId}
          />
        ) : layout === 'assembly' ? (
          <AssemblySeatingLayout
            seats={seats}
            selectedSeatId={selectedSeatId}
            onSelectSeat={(seat) => handleSelectSeat(seat)}
            activeSpeakerId={activeSpeakerId}
          />
        ) : (
          <ParliamentSeatingLayout
            seats={seats}
            selectedSeatId={selectedSeatId}
            onSelectSeat={(seat) => handleSelectSeat(seat)}
            activeSpeakerId={activeSpeakerId}
            isIllustrative={isIllustrative}
          />
        )}
      </div>
    </div>
  );
};
