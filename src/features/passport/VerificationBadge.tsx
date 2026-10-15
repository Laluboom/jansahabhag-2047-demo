import React from 'react';
import { VerificationState, ReviewState, PassportVerifier } from '../../types/domain';
import { Badge } from '../../components/ui/Badge';
import { Clock, UserCheck, ShieldCheck, AlertCircle, Building2 } from 'lucide-react';

interface VerificationBadgeProps {
  verificationState?: VerificationState;
  reviewState?: ReviewState;
  isVerified?: boolean;
  verifier?: PassportVerifier;
  organisation?: string;
  className?: string;
  showDetails?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verificationState,
  reviewState,
  isVerified,
  verifier,
  organisation,
  className = '',
  showDetails = false,
}) => {
  // If explicitly revision_requested
  if (reviewState === 'revision_requested') {
    return (
      <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
        <Badge variant="warning" className="bg-amber-50 text-amber-900 border-amber-300">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>Revision Requested</span>
        </Badge>
        {showDetails && (
          <span className="text-[10px] text-amber-700 italic">
            Mentor requested updates &bull; dependent credits reconciled
          </span>
        )}
      </div>
    );
  }

  // If pending review
  if (reviewState === 'pending' || verificationState === 'self_reported' || (!isVerified && verificationState !== 'sample_unverified')) {
    return (
      <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
        <Badge variant="warning" className="bg-amber-50 text-amber-900 border-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Self-Reported &bull; Pending Review</span>
        </Badge>
        {showDetails && (
          <span className="text-[10px] text-slate-500">
            Awaiting facilitator review (Demo simulation)
          </span>
        )}
      </div>
    );
  }

  // Sample unverified seed
  if (verificationState === 'sample_unverified') {
    return (
      <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
        <Badge variant="neutral" className="bg-slate-100 text-slate-700 border-slate-300">
          <AlertCircle className="w-3 h-3 text-slate-500" />
          <span>Sample / Unverified Record</span>
        </Badge>
        {showDetails && (
          <span className="text-[10px] text-slate-400">
            Historical seed entry without verifiable author audit
          </span>
        )}
      </div>
    );
  }

  // Facilitator reviewed
  if (verificationState === 'facilitator_reviewed') {
    return (
      <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
        <Badge variant="success" className="bg-emerald-50 text-emerald-900 border-emerald-300">
          <UserCheck className="w-3 h-3 text-emerald-600" />
          <span>Facilitator Reviewed</span>
        </Badge>
        {showDetails && verifier && (
          <span className="text-[10px] text-emerald-700">
            {verifier.name} ({verifier.role}) &bull; {verifier.label || 'Demo Simulation'}
          </span>
        )}
      </div>
    );
  }

  // Institution verified
  if (verificationState === 'institution_verified') {
    return (
      <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
        <Badge variant="primary" className="bg-indigo-50 text-indigo-900 border-indigo-300">
          <Building2 className="w-3 h-3 text-indigo-600" />
          <span>Institution Verified</span>
        </Badge>
        {showDetails && organisation && (
          <span className="text-[10px] text-indigo-700 truncate max-w-xs">
            {organisation}
          </span>
        )}
      </div>
    );
  }

  // System recorded (default for platform-verified events like assembly join or proposition contribution)
  return (
    <div className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <Badge variant="teal" className="bg-sky-50 text-sky-900 border-sky-300">
        <ShieldCheck className="w-3 h-3 text-sky-600" />
        <span>System Recorded</span>
      </Badge>
      {showDetails && (
        <span className="text-[10px] text-slate-500">
          Platform-logged action &bull; No independent external audit
        </span>
      )}
    </div>
  );
};
