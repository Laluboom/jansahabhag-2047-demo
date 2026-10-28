import React from 'react';
import { SeatModel, getInitials } from './types';
import { Avatar } from '../ui/Avatar';
import { Mic, MicOff, Video, VideoOff, Hand, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SeatItemProps {
  seat: SeatModel;
  isSelected?: boolean;
  onSelect?: (seat: SeatModel) => void;
  compact?: boolean;
  testId?: string;
  textMode?: boolean;
  suppressAnimation?: boolean;
}

export const SeatItem: React.FC<SeatItemProps> = ({
  seat,
  isSelected = false,
  onSelect,
  compact = false,
  testId,
  textMode = false,
  suppressAnimation = false,
}) => {
  const isSpeaking = Boolean(seat.isSpeaking || seat.status === 'speaking');
  const isVacant = seat.status === 'vacant';
  const initials = seat.initials || getInitials(seat.name);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
      e.preventDefault();
      onSelect(seat);
    }
  };

  const statusLabel =
    isSpeaking
      ? 'Speaking Now'
      : seat.status === 'waiting'
      ? 'In Speaking Queue'
      : seat.status === 'vacant'
      ? 'Vacant (Held by Default)'
      : seat.status === 'reserved'
      ? 'Reserved Place'
      : 'Active Delegate';

  const ariaLabel = `${seat.name}, Role: ${seat.role}, Side or Zone: ${seat.sideOrBench || 'General'}, Status: ${statusLabel}${
    isSpeaking ? ', Currently Speaking' : ''
  }${seat.hasDissent ? ', Registered Dissent' : ''}${
    seat.hasRaisedHand ? ', Hand raised' : ''
  }${seat.isMuted ? ', Microphone off' : ''}${
    seat.isCameraOff ? ', Camera off' : ''
  }`;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(seat)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={ariaLabel}
      className={`group relative text-left rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 focus-visible:ring-offset-2 motion-reduce:transition-none aspect-[3/4] w-full flex flex-col justify-end overflow-hidden ${
        isSelected
          ? 'bg-civic-indigo-50 border-2 border-civic-indigo-600 shadow-sm ring-2 ring-civic-indigo-400'
          : isSpeaking
          ? `bg-emerald-50/80 border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-200/60 ${
              textMode || suppressAnimation ? '' : 'motion-safe:animate-pulse'
            }`
          : isVacant
          ? 'bg-slate-50/80 border border-dashed border-slate-300 hover:border-slate-400 text-slate-400'
          : 'bg-white border border-slate-200 hover:border-civic-indigo-300 hover:shadow-2xs'
      }`}
      data-testid={testId || `seat-item-${seat.id}`}
    >
      {/* Avatar fills the tile */}
      <Avatar
        src={textMode ? undefined : seat.avatar}
        alt={seat.name}
        fallback={isVacant ? '—' : initials}
        data-testid={`initials-badge-${seat.id}`}
        className={`absolute inset-0 w-full h-full rounded-none border-0 text-2xl sm:text-3xl font-bold select-none ${
          isVacant
            ? 'bg-slate-100 text-slate-400 font-normal italic'
            : isSpeaking
            ? 'bg-emerald-100 text-emerald-800'
            : isSelected
            ? 'bg-civic-indigo-100 text-civic-indigo-900'
            : 'bg-slate-100 text-slate-700'
        }`}
      />

      {/* Speaking Wave / Mic Badge */}
      {isSpeaking && (
        <span
          className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs z-10"
          title="Currently Speaking"
          data-testid="speaking-badge"
        >
          <Mic className="w-3 h-3" />
        </span>
      )}

      {/* Assembly Dissent Marker */}
      {seat.hasDissent && (
        <span
          className="absolute top-2 right-2 shrink-0 inline-flex items-center text-amber-400 bg-slate-900/60 p-1 rounded-full z-10"
          title="Dissent or reservation recorded"
          data-testid={`dissent-marker-${seat.id}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 fill-amber-100 text-amber-400" />
        </span>
      )}

      {/* 33% Reserved Seat Badge */}
      {seat.isReserved && (
        <span
          className={`absolute top-2 ${seat.hasDissent ? 'right-8' : 'right-2'} shrink-0 inline-flex items-center text-purple-400 bg-slate-900/60 p-1 rounded-full z-10`}
          title="33% Women's Reserved Allocation"
          data-testid={`reserved-seat-marker-${seat.id}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
        </span>
      )}

      {/* Translucent dark name bar across the bottom */}
      <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 backdrop-blur-xs p-2 text-left z-10">
        <div className="flex items-end justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate text-xs text-white">
              {seat.name}
            </div>
            {!compact && (
              <div className="text-[10px] text-slate-300 truncate mt-0.5">
                {seat.role}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 pb-0.5">
            {seat.hasRaisedHand && (
              <span
                title="Hand raised"
                aria-label="Hand raised"
                className="text-amber-400"
                data-testid={`seat-indicator-hand-${seat.id}`}
              >
                <Hand className="w-3.5 h-3.5" />
              </span>
            )}
            <span
              title={seat.isMuted ? 'Microphone off' : 'Microphone on'}
              aria-label={seat.isMuted ? 'Microphone off' : 'Microphone on'}
              className={seat.isMuted ? 'text-rose-400' : 'text-slate-400'}
              data-testid={`seat-indicator-mic-${seat.id}`}
            >
              {seat.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </span>
            <span
              title={seat.isCameraOff ? 'Camera off' : 'Camera on'}
              aria-label={seat.isCameraOff ? 'Camera off' : 'Camera on'}
              className={seat.isCameraOff ? 'text-rose-400' : 'text-slate-400'}
              data-testid={`seat-indicator-camera-${seat.id}`}
            >
              {seat.isCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};
