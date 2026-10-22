import React from 'react';
import { SeatModel, getInitials } from './types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import {
  Building2,
  Activity,
  Mic,
  AlertTriangle,
  ShieldCheck,
  X,
} from 'lucide-react';

interface SeatDetailCardProps {
  seat: SeatModel;
  onClose?: () => void;
  className?: string;
}

export const SeatDetailCard: React.FC<SeatDetailCardProps> = ({
  seat,
  onClose,
  className = '',
}) => {
  const isSpeaking = Boolean(seat.isSpeaking || seat.status === 'speaking');
  const isVacant = seat.status === 'vacant';
  const initials = seat.initials || getInitials(seat.name);

  return (
    <Card
      className={`p-4 border-civic-indigo-200 bg-white shadow-md rounded-2xl relative space-y-3 ${className}`}
      data-testid="seat-detail-card"
      role="region"
      aria-label={`Seat Details for ${seat.name}`}
    >
      {/* Top Header Row with Dismiss Button */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            {seat.avatar && !isVacant ? (
              <Avatar
                src={seat.avatar}
                alt={seat.name}
                fallback={initials}
                size="md"
                className={isSpeaking ? 'ring-2 ring-emerald-500' : ''}
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs select-none ${
                  isVacant
                    ? 'bg-slate-100 border border-dashed border-slate-300 text-slate-400'
                    : isSpeaking
                    ? 'bg-emerald-600 text-white'
                    : 'bg-civic-indigo-100 text-civic-indigo-800'
                }`}
              >
                {isVacant ? '—' : initials}
              </div>
            )}
            {isSpeaking && (
              <span
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white"
                title="Active Speaker"
              >
                <Mic className="w-2.5 h-2.5" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-sm text-slate-900 truncate font-heading">
                {seat.name}
              </h3>
              {isSpeaking && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Speaking Now
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-semibold text-civic-indigo-700">{seat.role}</span>
              {seat.sideOrBench && (
                <>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-slate-600">{seat.sideOrBench}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {onClose && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close seat details"
            className="p-1 h-7 w-7 text-slate-400 hover:text-slate-700 rounded-lg shrink-0"
            data-testid="close-seat-detail-btn"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Institution */}
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
          <Building2 className="w-3.5 h-3.5 text-civic-indigo-600 shrink-0" />
          <span>Institution / Affiliation</span>
        </div>
        <p className="text-slate-800 pl-5 text-xs font-medium" data-testid="seat-detail-institution">
          {seat.institution || 'Affiliated Youth Civic Delegator'}
        </p>
      </div>

      {/* Current Activity */}
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px]">
          <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Current Activity</span>
        </div>
        <p className="text-slate-700 pl-5 text-xs leading-relaxed" data-testid="seat-detail-activity">
          {seat.currentActivity || 'Participating in chamber deliberation and review of evidence.'}
        </p>
      </div>

      {/* Assembly Dissent Marker Details */}
      {seat.hasDissent && (
        <div
          className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1"
          data-testid="seat-detail-dissent"
        >
          <div className="flex items-center gap-1.5 font-bold text-amber-800 text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Formal Assembly Dissent Recorded</span>
          </div>
          <p className="text-[11px] text-amber-900/90 leading-relaxed">
            {seat.dissentSummary ||
              'This delegate has formally recorded reservations or dissent on the proposition draft, preserved transparently per Assembly Rule 4.'}
          </p>
        </div>
      )}

      {/* 33% Women's Reserved Allocation Badge (Authorized verification only) */}
      {seat.isReserved ? (
        <div
          className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2"
          data-testid="seat-detail-reserved"
        >
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
          <span className="text-[11px] font-medium">
            Occupies 33% Women&apos;s Reserved Allocation seat (Authorized verification).
          </span>
        </div>
      ) : (
        <div
          className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2"
          data-testid="seat-detail-generic-policy"
        >
          <ShieldCheck className="w-4 h-4 text-civic-indigo-600 shrink-0" />
          <span className="text-[11px]">
            33% Reservation Policy applies per named role. Personal declarations remain confidential.
          </span>
        </div>
      )}

      {/* Bio / Descriptor if present */}
      {seat.bio && (
        <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
          {seat.bio}
        </p>
      )}
    </Card>
  );
};
