import React from 'react';
import { Badge } from './Badge';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, Archive, Sparkles } from 'lucide-react';

export type EntityStatus =
  | 'draft'
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'completed'
  | 'revision_requested'
  | 'flagged'
  | 'active'
  | 'archived'
  | 'upcoming'
  | 'deliberating'
  | 'concluded';

interface StatusChipProps {
  status: EntityStatus | string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, className }) => {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case 'verified':
    case 'completed':
    case 'concluded':
      return (
        <Badge variant="success" className={className}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span className="capitalize">{normalized.replace('_', ' ')}</span>
        </Badge>
      );
    case 'under_review':
    case 'in_progress':
    case 'deliberating':
    case 'active':
      return (
        <Badge variant="teal" className={className}>
          <RefreshCw className="w-3 h-3 text-civic-teal-600 animate-spin motion-reduce:animate-none" />
          <span className="capitalize">{normalized.replace('_', ' ')}</span>
        </Badge>
      );
    case 'submitted':
    case 'upcoming':
      return (
        <Badge variant="primary" className={className}>
          <Clock className="w-3 h-3 text-civic-indigo-600" />
          <span className="capitalize">{normalized.replace('_', ' ')}</span>
        </Badge>
      );
    case 'revision_requested':
      return (
        <Badge variant="warning" className={className}>
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>Revision Requested</span>
        </Badge>
      );
    case 'flagged':
      return (
        <Badge variant="danger" className={className}>
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Flagged</span>
        </Badge>
      );
    case 'draft':
    case 'not_started':
      return (
        <Badge variant="neutral" className={className}>
          <span className="capitalize">{normalized.replace('_', ' ')}</span>
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="outline" className={className}>
          <Archive className="w-3 h-3 text-slate-400" />
          <span>Archived</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="default" className={className}>
          <Sparkles className="w-3 h-3" />
          <span className="capitalize">{status}</span>
        </Badge>
      );
  }
};
