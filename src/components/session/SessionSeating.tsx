import React, { useState, useEffect, useMemo } from 'react';
import { SessionSeatingProps, SeatModel, SessionTextTurn } from './types';
import { DebateSeatingLayout } from './DebateSeatingLayout';
import { AssemblySeatingLayout } from './AssemblySeatingLayout';
import { ParliamentSeatingLayout } from './ParliamentSeatingLayout';
import { AccessibleListView } from './AccessibleListView';
import { SeatDetailCard } from './SeatDetailCard';
import { SeatingQuotaDisplay } from './SeatingQuotaDisplay';
import { ModeSwitcherBar } from './ModeSwitcherBar';
import { SettingsModal } from '../../features/settings/SettingsModal';
import { SessionPreferencesService } from '../../services/sessionPreferencesService';
import { Button } from '../ui/Button';
import { List, LayoutGrid, Radio, Users, Landmark, Settings, Zap } from 'lucide-react';

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
  sessionId,
  sampleTurns,
  viewMode: controlledViewMode,
  onViewModeChange,
  lowDataMode: controlledLowDataMode,
}) => {
  const sessionKey = sessionId || currentRoute || layout;

  // View Mode: 'chamber' | 'text'
  const [internalViewMode, setInternalViewMode] = useState<'chamber' | 'text'>(() => {
    return SessionPreferencesService.getSessionViewMode(sessionKey);
  });
  const currentViewMode = controlledViewMode !== undefined ? controlledViewMode : internalViewMode;
  const isTextMode = currentViewMode === 'text';

  // Low data preference
  const isLowData = controlledLowDataMode !== undefined
    ? controlledLowDataMode
    : SessionPreferencesService.getLowDataPreference();

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Restore seat from local browser session state
  const [internalSelectedSeatId, setInternalSelectedSeatId] = useState<string | null>(null);
  const [restoredSeatName, setRestoredSeatName] = useState<string | null>(null);

  const selectedSeatId = controlledSelectedSeatId !== undefined ? controlledSelectedSeatId : internalSelectedSeatId;

  // Check saved seat upon mount/initialization
  useEffect(() => {
    if (controlledSelectedSeatId === undefined && !internalSelectedSeatId) {
      const savedSeatId = SessionPreferencesService.getSavedSeatId(sessionKey);
      if (savedSeatId) {
        const found = seats.find((s) => s.id === savedSeatId);
        if (found) {
          setInternalSelectedSeatId(savedSeatId);
          setRestoredSeatName(found.name);
          controlledOnSelectSeat?.(found);
        }
      }
    }
  }, [sessionKey, seats, controlledSelectedSeatId, internalSelectedSeatId, controlledOnSelectSeat]);

  // Default turns fallback for standard deliberative chambers
  const defaultTurns: Record<string, SessionTextTurn[]> = useMemo(
    () => ({
      debate: [
        {
          id: 'turn_deb_1',
          authorName: 'Priya Sharma',
          authorRole: 'Evidence Analyst',
          timestamp: '10:14 AM',
          text: 'Field speed radar log indicates 420 vehicles/hour exceeding 40 km/h in school zone.',
        },
        {
          id: 'turn_deb_2',
          authorName: 'Aarav Sharma',
          authorRole: 'Questioner',
          timestamp: '10:18 AM',
          text: 'How will raised crosswalk tables accommodate heavy emergency fire tender access?',
        },
        {
          id: 'turn_deb_3',
          authorName: 'Rohan Mehta',
          authorRole: 'Facilitator',
          timestamp: '10:22 AM',
          text: 'Recognized floor questioner. Response window opened for evidence presentation.',
        },
      ],
      assembly: [
        {
          id: 'turn_asm_1',
          authorName: 'Priya Sharma',
          authorRole: 'Thinker',
          timestamp: '10:05 AM',
          text: 'Defined problem frame: peak morning drop-off pedestrian bottleneck outside Gate 2.',
        },
        {
          id: 'turn_asm_2',
          authorName: 'Vikram Joshi',
          authorRole: 'Enabler',
          timestamp: '10:15 AM',
          text: 'Verified IRC-99 bulb-out engineering geometry feasibility along northern pedestrian path.',
        },
        {
          id: 'turn_asm_3',
          authorName: 'Karan Deshmukh',
          authorRole: 'Troubleshooter',
          timestamp: '10:25 AM',
          text: 'Logged formal reservation on monsoon drainage runoff and side road deflection.',
        },
      ],
      parliament: [
        {
          id: 'turn_parl_1',
          authorName: 'Priya Sharma',
          authorRole: 'Lead Motion Sponsor',
          timestamp: '11:00 AM',
          text: 'Tabled National Motion #07: Mandatory 25 km/h school perimeter zones and safe pedestrian corridors.',
        },
        {
          id: 'turn_parl_2',
          authorName: 'Ananya Sen',
          authorRole: 'Civic Scrutiny Spokesperson',
          timestamp: '11:08 AM',
          text: 'Chamber Inquiry: AMRUT 2.0 capital allocation guarantees vs municipal engineering capacity.',
        },
        {
          id: 'turn_parl_3',
          authorName: 'Youth Advisory Panel',
          authorRole: 'Presiding Speaker',
          timestamp: '11:15 AM',
          text: 'Chamber recognized Government sponsor for two-minute clarification on statutory guidelines.',
        },
      ],
    }),
    []
  );

  const effectiveTurns = useMemo(() => {
    return sampleTurns && sampleTurns.length > 0
      ? sampleTurns
      : defaultTurns[layout] || defaultTurns.debate;
  }, [sampleTurns, layout, defaultTurns]);

  // Compute and track missed sample turns
  const [missedTurns, setMissedTurns] = useState<SessionTextTurn[]>([]);

  useEffect(() => {
    const missed = SessionPreferencesService.getMissedTurns(sessionKey, effectiveTurns);
    if (missed && missed.length > 0) {
      setMissedTurns(missed);
    }
    // Record current session visit and known turns
    SessionPreferencesService.recordSessionVisit(
      sessionKey,
      effectiveTurns.map((t) => t.id)
    );
  }, [sessionKey, effectiveTurns]);

  const handleToggleViewMode = () => {
    const nextMode = isTextMode ? 'chamber' : 'text';
    setInternalViewMode(nextMode);
    SessionPreferencesService.setSessionViewMode(nextMode, sessionKey);
    onViewModeChange?.(nextMode);
  };

  const handleSelectSeat = (seat: SeatModel | null) => {
    const seatId = seat ? seat.id : null;
    if (controlledOnSelectSeat) {
      controlledOnSelectSeat(seat);
    } else {
      setInternalSelectedSeatId(seatId);
    }
    // Persist seat selection in browser demo state
    SessionPreferencesService.saveSeatId(sessionKey, seatId);
    if (seat) {
      setRestoredSeatName(null); // Clear restored tag once explicitly selected
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-base font-heading text-slate-900">
                  {meta.title}
                </h2>
                {isLowData && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                    data-testid="low-data-indicator"
                  >
                    <Zap className="w-3 h-3 text-amber-600" />
                    <span>Low Data</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {/* View Mode Toggle: Visual Chamber vs Accessible Text / List Mode */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleToggleViewMode}
              className="text-xs flex items-center gap-1.5"
              aria-pressed={isTextMode}
              data-testid="toggle-seating-view-btn"
            >
              {isTextMode ? (
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

            {/* Hidden hook with text-mode-toggle test id for dedicated testing */}
            <span className="sr-only" data-testid="text-mode-toggle" onClick={handleToggleViewMode}>
              {isTextMode ? 'Text Mode Active' : 'Chamber Mode Active'}
            </span>

            {/* Session Settings / Low Data Preferences Modal Trigger */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs flex items-center gap-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50"
              data-testid="session-settings-btn"
              title="Deliberative chamber preferences & Low Data settings"
              aria-label="Open Session & Data Preferences"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Preferences</span>
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
            textMode={isTextMode}
            suppressAnimation={isTextMode || isLowData}
            onClose={() => handleSelectSeat(null)}
          />
        )}

        {/* Render Layout or Accessible Text / List View */}
        {isTextMode ? (
          <AccessibleListView
            seats={seats}
            selectedSeatId={selectedSeatId}
            onSelectSeat={(seat) => handleSelectSeat(seat)}
            layoutName={meta.title}
            activeSpeakerId={activeSpeakerId}
            sampleTurns={effectiveTurns}
            missedTurns={missedTurns}
            restoredSeatName={restoredSeatName}
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onPreferenceChange={() => {
          setInternalViewMode(SessionPreferencesService.getSessionViewMode(sessionKey));
        }}
      />
    </div>
  );
};
