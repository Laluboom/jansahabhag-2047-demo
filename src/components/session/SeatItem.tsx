import React from 'react';
import { SeatModel, getInitials } from './types';
import { Avatar } from '../ui/Avatar';
import { Mic, AlertTriangle, ShieldCheck } from 'lucide-react';

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

  const statusColors: Record<string, string> = {
    speaking: textMode || suppressAnimation
      ? 'bg-emerald-500 ring-2 ring-emerald-200'
      : 'bg-emerald-500 ring-2 ring-emerald-200 motion-safe:animate-pulse',
    active: 'bg-civic-teal-500',
    present: 'bg-civic-indigo-500',
    waiting: 'bg-amber-500',
    vacant: 'bg-slate-300 border border-dashed border-slate-400',
    reserved: 'bg-purple-500',
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

  return (
    <button
      type="button"
      onClick={() => onSelect?.(seat)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${seat.name}, Role: ${seat.role}, Side or Zone: ${seat.sideOrBench || 'General'}, Status: ${statusLabel}${
        isSpeaking ? ', Currently Speaking' : ''
      }${seat.hasDissent ? ', Registered Dissent' : ''}`}
      className={`group relative text-left rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 focus-visible:ring-offset-2 motion-reduce:transition-none ${
        compact ? 'p-2' : 'p-2.5'
      } ${
        isSelected
          ? 'bg-civic-indigo-50 border-2 border-civic-indigo-600 shadow-sm'
          : isSpeaking
          ? 'bg-emerald-50/80 border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-200/60'
          : isVacant
          ? 'bg-slate-50/80 border border-dashed border-slate-300 hover:border-slate-400 text-slate-400'
          : 'bg-white border border-slate-200 hover:border-civic-indigo-300 hover:shadow-2xs'
      }`}
      data-testid={testId || `seat-item-${seat.id}`}
    >
      <div className="flex items-center gap-2">
        {/* Avatar or Initials Badge with Speaking Indicator */}
        <div className="relative shrink-0">
          {!textMode && seat.avatar && !isVacant ? (
            <Avatar
              src={seat.avatar}
              alt={seat.name}
              fallback={initials}
              size={compact ? 'sm' : 'md'}
              className={isSpeaking ? (suppressAnimation ? 'ring-2 ring-emerald-500 ring-offset-1' : 'ring-2 ring-emerald-500 ring-offset-1') : ''}
            />
          ) : (
            <div
              className={`flex items-center justify-center font-bold text-xs rounded-full shrink-0 border select-none ${
                compact ? 'w-7 h-7' : 'w-9 h-9'
              } ${
                isVacant
                  ? 'border-dashed border-slate-300 bg-slate-100 text-slate-400 font-normal text-[11px]'
                  : isSpeaking
                  ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-300'
                  : 'bg-civic-indigo-100 text-civic-indigo-800 border-civic-indigo-200'
              }`}
              data-testid={`initials-badge-${seat.id}`}
            >
              {isVacant ? '—' : initials}
            </div>
          )}

          {/* Speaking Wave / Mic Badge */}
          {isSpeaking && (
            <span
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs"
              title="Currently Speaking"
              data-testid="speaking-badge"
            >
              <Mic className="w-2.5 h-2.5" />
            </span>
          )}

          {/* Status Dot */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
              statusColors[isSpeaking ? 'speaking' : seat.status] || 'bg-slate-400'
            }`}
            aria-hidden="true"
          />
        </div>

        {/* Name, Role & Side/Zone Information */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span
              className={`font-semibold truncate text-xs block ${
                isVacant
                  ? 'text-slate-400 italic'
                  : isSelected
                  ? 'text-civic-indigo-950 font-bold'
                  : 'text-slate-900'
              }`}
            >
              {seat.name}
            </span>

            {/* Assembly Dissent Marker */}
            {seat.hasDissent && (
              <span
                className="shrink-0 inline-flex items-center text-amber-600 text-[10px]"
                title="Dissent or reservation recorded"
                data-testid={`dissent-marker-${seat.id}`}
              >
                <AlertTriangle className="w-3.5 h-3.5 fill-amber-100 text-amber-600" />
              </span>
            )}

            {/* 33% Reserved Seat Badge */}
            {seat.isReserved && (
              <span
                className="shrink-0 inline-flex items-center text-purple-600 text-[10px]"
                title="33% Women's Reserved Allocation"
                data-testid={`reserved-seat-marker-${seat.id}`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
            <span className="font-medium text-slate-700 truncate max-w-[110px]">
              {seat.role}
            </span>
            {seat.sideOrBench && (
              <>
                <span className="text-slate-300" aria-hidden="true">&bull;</span>
                <span className="text-slate-500 font-mono truncate max-w-[90px]">
                  {seat.sideOrBench}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
