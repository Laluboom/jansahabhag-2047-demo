import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Event, Session, User } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { Modal } from '../../components/ui/Modal';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Video,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  BookOpen,
  Sparkles,
  ExternalLink,
  UserCheck,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Info,
  Scale,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [attendees, setAttendees] = useState<User[]>([]);
  const [selectedRsvp, setSelectedRsvp] = useState<'attending' | 'maybe' | 'declined'>('attending');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isRsvping, setIsRsvping] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [resourceModal, setResourceModal] = useState<{ title: string; type: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Allocation & Reservation state
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [rulebookExpanded, setRulebookExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [evt, sess, allUsers] = await Promise.all([
          demoRepository.getEvent(id),
          demoRepository.getSessionByEvent(id),
          demoRepository.getUsers(),
        ]);
        setEvent(evt);
        setSession(sess);

        if (evt) {
          const attendeeUsers = allUsers.filter((u) => evt.attendeeUserIds.includes(u.id));
          setAttendees(attendeeUsers);

          if (currentUser) {
            const currentRsvp = evt.rsvpMap?.[currentUser.id] || (evt.attendeeUserIds.includes(currentUser.id) ? 'attending' : 'declined');
            setSelectedRsvp(currentRsvp);
            setIsCheckedIn(Boolean(evt.checkedInUserIds?.includes(currentUser.id)));
          }
        }
      } catch (err) {
        console.error('Failed to load event details', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser, refreshKey]);

  const handleSetRsvp = async (status: 'attending' | 'maybe' | 'declined') => {
    if (!id || !currentUser) return;
    setIsRsvping(true);
    setRsvpError(null);
    setCheckInError(null);
    setActionSuccess(null);
    try {
      await demoRepository.rsvpEvent(id, currentUser.id, status);
      setSelectedRsvp(status);
      triggerRefresh();
      setActionSuccess(`RSVP successfully updated to ${status}.`);
    } catch (err: any) {
      console.error('Failed to update RSVP', err);
      setRsvpError(err?.message || 'Failed to update RSVP');
    } finally {
      setIsRsvping(false);
    }
  };

  const handleCheckIn = async () => {
    if (!id || !currentUser) return;
    setIsCheckingIn(true);
    setCheckInError(null);
    setRsvpError(null);
    setActionSuccess(null);
    try {
      await demoRepository.checkInEvent(id, currentUser.id);
      setIsCheckedIn(true);
      triggerRefresh();
      setActionSuccess('Attendance verified and check-in recorded.');
    } catch (err: any) {
      console.error('Failed to check in', err);
      setCheckInError(err?.message || 'Failed to check in');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleFinalize = async () => {
    if (!id || !currentUser) return;
    setIsFinalizing(true);
    setRsvpError(null);
    setActionSuccess(null);
    try {
      await demoRepository.finalizeEventAllocation(id, currentUser.id);
      triggerRefresh();
      setActionSuccess('Allocation finalized successfully under compliant 33% reservation.');
    } catch (err: any) {
      console.error('Failed to finalize allocation', err);
      setRsvpError(err?.message || 'Finalization failed');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleApproveException = async () => {
    if (!id || !currentUser) return;
    setIsFinalizing(true);
    setRsvpError(null);
    setActionSuccess(null);
    try {
      await demoRepository.approveEventAllocationException(id, exceptionReason, currentUser.id);
      setExceptionModalOpen(false);
      setExceptionReason('');
      triggerRefresh();
      setActionSuccess('Platform Owner exception approved and allocation finalized under exception.');
    } catch (err: any) {
      console.error('Failed to approve exception', err);
      setRsvpError(err?.message || 'Exception approval failed');
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading event details">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Link>
        <Card className="p-8 text-center space-y-4 border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-slate-900">Event Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The requested civic event or assembly session "{id}" could not be found.
          </p>
          <div className="pt-2">
            <Link to="/events">
              <Button size="sm" variant="primary">
                View All Events
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isOwner = currentUser?.role === 'platform_admin';
  const isAllocated = Boolean(event.allocation && event.allocation.status !== 'unvalidated_legacy');
  const isProtectedRoster = isAllocated && !isOwner;
  const registeredCount = event.registeredCount ?? event.attendeeUserIds.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </Link>

      {/* Alerts */}
      {rsvpError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 shadow-sm"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-rose-950">RSVP / Allocation Restriction</span>
            <p className="mt-0.5 leading-relaxed">{rsvpError}</p>
          </div>
          <button
            type="button"
            onClick={() => setRsvpError(null)}
            className="text-rose-400 hover:text-rose-700 text-sm font-bold leading-none"
            aria-label="Dismiss alert"
          >
            &times;
          </button>
        </div>
      )}

      {checkInError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 shadow-sm"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-rose-950">Check-In Denied</span>
            <p className="mt-0.5 leading-relaxed">{checkInError}</p>
          </div>
          <button
            type="button"
            onClick={() => setCheckInError(null)}
            className="text-rose-400 hover:text-rose-700 text-sm font-bold leading-none"
            aria-label="Dismiss alert"
          >
            &times;
          </button>
        </div>
      )}

      {actionSuccess && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3 shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-emerald-950">Update Recorded</span>
            <p className="mt-0.5 leading-relaxed">{actionSuccess}</p>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-400 hover:text-emerald-700 text-sm font-bold leading-none"
            aria-label="Dismiss notification"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Event Card */}
      <Card className="border-slate-200 p-6 sm:p-8 space-y-5 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2.5 py-0.5 rounded border border-civic-indigo-200">
              {event.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400 font-mono">{event.id}</span>
          </div>
          <div className="flex items-center gap-2">
            {event.allocation?.isPrivacySuppressed ? (
              <span
                className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200"
                data-testid="header-status-privacy-suppressed"
              >
                Protected Allocation
              </span>
            ) : (
              <>
                {event.allocation?.status === 'finalized_compliant' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    33% Compliant
                  </span>
                )}
                {event.allocation?.status === 'finalized_exception' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                    Owner Exception
                  </span>
                )}
                {event.allocation?.status === 'unvalidated_legacy' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                    Legacy Unvalidated
                  </span>
                )}
              </>
            )}
            <StatusChip status={event.status} />
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            {event.title}
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Details Pill Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <Calendar className="w-4 h-4 text-civic-indigo-600 shrink-0" />
            <div>
              <span className="font-bold block text-slate-900">{formatDate(event.date)}</span>
              <span className="text-slate-500">{event.startTime} - {event.endTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            {event.isVirtual ? (
              <Video className="w-4 h-4 text-civic-teal-600 shrink-0" />
            ) : (
              <MapPin className="w-4 h-4 text-civic-saffron-600 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="font-bold block text-slate-900 truncate">{event.location}</span>
              <span className="text-slate-500">{event.isVirtual ? 'Online Video Chamber' : 'In-Person Civic Venue'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <Users className="w-4 h-4 text-slate-500 shrink-0" />
            <div>
              <span className="font-bold block text-slate-900">
                {registeredCount} / {event.capacity} Registered
              </span>
              <span className="text-slate-500">
                {event.capacity - registeredCount} total seats remaining
              </span>
            </div>
          </div>
        </div>

        {/* RSVP & Attendance Actions Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Your RSVP:</span>
            <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => handleSetRsvp('attending')}
                disabled={isRsvping}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedRsvp === 'attending'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Attending
              </button>
              <button
                type="button"
                onClick={() => handleSetRsvp('maybe')}
                disabled={isRsvping}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedRsvp === 'maybe'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tentative
              </button>
              <button
                type="button"
                onClick={() => handleSetRsvp('declined')}
                disabled={isRsvping}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  selectedRsvp === 'declined'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Declined
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCheckedIn ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Attendance Verified & Checked In</span>
              </div>
            ) : (
              <Button
                size="sm"
                variant="primary"
                isLoading={isCheckingIn}
                onClick={handleCheckIn}
                className="text-xs"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                <span>Simulate Check-In & Arrival</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 33% Reservation Allocation & Rulebook Section */}
      <Card className="border-slate-200 p-6 space-y-6 bg-white shadow-sm" data-testid="reservation-allocation-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-civic-indigo-50 border border-civic-indigo-100 flex items-center justify-center text-civic-indigo-600">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-slate-900">
                33% Women's Reservation Model & Allocation Status
              </h2>
              <p className="text-xs text-slate-500">
                Policy Version: <span className="font-mono">{event.allocation?.policyVersion || '2026.1-womens-reservation-33'}</span> &bull; Fictional Jaipur Prototype
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {event.allocation?.isPrivacySuppressed ? (
              <span
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5"
                data-testid="status-privacy-suppressed"
              >
                <Shield className="w-3.5 h-3.5 text-civic-indigo-600" />
                <span>Protected Allocation (Metrics Withheld)</span>
              </span>
            ) : (
              <>
                {event.allocation?.status === 'finalized_compliant' && (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5" data-testid="status-finalized-compliant">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Finalized — Compliant (33% Met)</span>
                  </span>
                )}
                {event.allocation?.status === 'finalized_exception' && (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1.5" data-testid="status-finalized-exception">
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                    <span>Finalized — Owner Exception Approved</span>
                  </span>
                )}
                {event.allocation?.status === 'blocked_noncompliant' && (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5" data-testid="status-blocked-noncompliant">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Finalization Blocked (Non-Compliant)</span>
                  </span>
                )}
                {event.allocation?.status === 'unvalidated_legacy' && (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5" data-testid="status-unvalidated-legacy">
                    <Info className="w-3.5 h-3.5 text-amber-600" />
                    <span>Legacy Unvalidated Record</span>
                  </span>
                )}
                {(!event.allocation?.status || event.allocation?.status === 'pending') && (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5" data-testid="status-pending">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Pending Allocation (RSVPs Open)</span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Aggregate Allocation Metrics Grid (Privacy Guard: Strictly Aggregate Figures Only) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Total Places</span>
            <span className="text-lg font-bold text-slate-900 font-mono" data-testid="metric-total-places">
              {event.capacity}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Maximum Capacity</span>
          </div>

          <div className="p-3 rounded-xl bg-civic-indigo-50/60 border border-civic-indigo-100">
            <span className="text-[11px] text-civic-indigo-700 block font-semibold">Reserved Minimum</span>
            <span className="text-lg font-bold text-civic-indigo-900 font-mono" data-testid="metric-reserved-minimum">
              {event.allocation?.reservedMinimum ?? Math.ceil(0.33 * event.capacity)}
            </span>
            <span className="text-[10px] text-civic-indigo-600 block mt-0.5">ceil(0.33 &times; {event.capacity})</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Ordinary Places</span>
            <span className="text-lg font-bold text-slate-900 font-mono" data-testid="metric-ordinary-places">
              {event.allocation?.ordinaryPlaces ?? (event.capacity - Math.ceil(0.33 * event.capacity))}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">General Sign-ups</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] text-emerald-700 block font-semibold">Reserved Occupied</span>
            <span className="text-lg font-bold text-emerald-900 font-mono" data-testid="metric-reserved-occupied">
              {event.allocation?.reservedOccupiedCount !== undefined
                ? event.allocation.reservedOccupiedCount
                : 'Withheld'}
            </span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">
              {event.allocation?.reservedOccupiedCount !== undefined ? 'Eligible Enrolled' : 'Withheld for Privacy'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 block">Ordinary Occupied</span>
            <span className="text-lg font-bold text-slate-900 font-mono" data-testid="metric-ordinary-occupied">
              {event.allocation?.ordinaryOccupiedCount !== undefined
                ? event.allocation.ordinaryOccupiedCount
                : 'Withheld'}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {event.allocation?.ordinaryOccupiedCount !== undefined ? 'General Enrolled' : 'Withheld for Privacy'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
            <span className="text-[11px] text-amber-700 block font-semibold">Reserved Vacancies</span>
            <span className="text-lg font-bold text-amber-900 font-mono" data-testid="metric-vacancies-count">
              {event.allocation?.vacanciesCount !== undefined
                ? event.allocation.vacanciesCount
                : 'Withheld'}
            </span>
            <span className="text-[10px] text-amber-600 block mt-0.5">
              {event.allocation?.vacanciesCount !== undefined ? 'Held Vacant by Default' : 'Withheld for Privacy'}
            </span>
          </div>
        </div>

        {/* Small Allocation Privacy Protection Notice */}
        {event.allocation?.isPrivacySuppressed && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 text-slate-700" data-testid="small-cohort-privacy-notice">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Shield className="w-4 h-4 text-civic-indigo-600 shrink-0" />
              <span>Small Cohort Privacy Guard Active</span>
            </div>
            <p className="leading-relaxed">
              In small allocation cohorts (1–3 places), individual reservation eligibility is protected from deductive inference. Reservation category breakdowns, occupancy counts, and vacancy metrics are withheld from public view. Only overall capacity, the mandatory formula <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">ceil(0.33 &times; places)</code>, and authorized Platform Owner validation records are maintained.
            </p>
            <p className="text-[11px] text-slate-500 italic">
              Note: Fictional single-browser demonstration. In production, privacy segregation is enforced server-side.
            </p>
          </div>
        )}

        {/* Exception Audit Record (if approved) */}
        {event.allocation?.isException && event.allocation.exceptionAudit && (
          <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-xs space-y-2" data-testid="exception-audit-box">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Simulated Platform Owner Exception Audit Record</span>
              </span>
              <span className="text-[10px] font-mono text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                Audit ID: {event.allocation.exceptionAudit.id}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-purple-950">
              <div>
                <span className="text-purple-600 block text-[11px]">Approver Persona:</span>
                <span className="font-semibold">{event.allocation.exceptionAudit.actorId ? `${event.allocation.exceptionAudit.actorId} (${event.allocation.exceptionAudit.actorRole})` : `Platform Owner (${event.allocation.exceptionAudit.actorRole})`}</span>
              </div>
              <div>
                <span className="text-purple-600 block text-[11px]">Policy Version & Timestamp:</span>
                <span className="font-mono text-[11px]">{event.allocation.exceptionAudit.policyVersion} &bull; {formatDate(event.allocation.exceptionAudit.timestamp)}</span>
              </div>
              {event.allocation.exceptionAudit.reason && (
                <div className="sm:col-span-2">
                  <span className="text-purple-600 block text-[11px]">Recorded Substantive Reason:</span>
                  <p className="italic bg-white/70 p-2 rounded border border-purple-100">{event.allocation.exceptionAudit.reason}</p>
                </div>
              )}
              <div className="sm:col-span-2 text-[11px] text-purple-700">
                <strong>Outcome:</strong> {event.allocation.exceptionAudit.outcome}
              </div>
            </div>
          </div>
        )}

        {/* Point-of-Use Rulebook Accordion */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
          <button
            type="button"
            onClick={() => setRulebookExpanded(!rulebookExpanded)}
            className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:bg-slate-100/70 transition-colors"
            data-testid="toggle-rulebook-btn"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-civic-indigo-600" />
              <span>Point-of-Use Rulebook: 33% Women's Reservation Model & Allocation Controls</span>
            </span>
            <span className="text-[11px] text-civic-indigo-600 font-semibold">
              {rulebookExpanded ? 'Hide Rulebook' : 'Read Rulebook'}
            </span>
          </button>

          {rulebookExpanded && (
            <div className="p-4 border-t border-slate-200 bg-white text-xs space-y-3 leading-relaxed text-slate-600" data-testid="rulebook-content">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">1. Mandatory Minimum Calculation</h4>
                <p>
                  Every limited civic activity independently calculates a mandatory 33% reservation using the formula{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">ceil(0.33 &times; allocatedPlaces)</code>.
                  Each allocation is calculated on its own capacity without cross-event pooling, including very small allocations of 1–3 places.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">2. Vacant Reserve & Non-Transferability</h4>
                <p>
                  If insufficient eligible participants register, unfilled reserved seats stay <strong>vacant by default</strong>.
                  Reserved places are strictly protected and cannot be silently transferred to ordinary applicants.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">3. Provisional Ordinary Sign-Ups</h4>
                <p>
                  Ordinary participants may only claim general places (total capacity minus reserved minimum). If general places
                  are fully subscribed, further ordinary sign-ups are blocked pending eligible candidate registration.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">4. Exception Authorization & Audit Standard</h4>
                <p>
                  Departures from the reservation quota are strictly disallowed for participants, teachers, organizers, and facilitators.
                  An exception can only be approved through explicit simulated Platform Owner authority with a logged substantive reason,
                  approver ID, timestamp, policy version (<code className="font-mono text-slate-700">2026.1-womens-reservation-33</code>),
                  and recorded outcome.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900">5. Privacy & Fair Treatment Standard</h4>
                <p>
                  Individual gender or reservation declarations are never derived from names or photos, and are never disclosed in
                  public views or attendee rosters. Only aggregate figures are published. Unseeded participants default to undeclared
                  without collecting real-world personal data.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                <strong>Single-Browser Demonstration Notice:</strong> This competition demo runs in a single browser with persona
                switching. Role authority is enforced based on the active persona profile.
              </div>
            </div>
          )}
        </div>

        {/* Platform Owner Simulated Authority Panel */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs" data-testid="owner-authority-panel">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-civic-indigo-600" />
                <span>Platform Owner Authority Simulation (Single-Browser Session)</span>
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Current active persona: <strong className="text-slate-800">{currentUser?.name}</strong> (<span className="capitalize font-mono">{currentUser?.role}</span>)
              </p>
            </div>

            <div className="flex items-center gap-2">
              {currentUser?.role === 'platform_admin' ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={isFinalizing}
                    onClick={handleFinalize}
                    className="text-xs"
                    data-testid="finalize-allocation-btn"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Finalize Allocation</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isFinalizing}
                    onClick={() => setExceptionModalOpen(true)}
                    className="text-xs"
                    data-testid="approve-exception-btn"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                    <span>Approve Exception & Finalize</span>
                  </Button>
                </>
              ) : (
                <div className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200 max-w-sm">
                  <span className="font-semibold text-slate-700 block">Authority Restricted:</span>
                  Only Platform Owner (<code className="font-mono">platform_admin</code>) can approve reservation exceptions. Switch to Platform Admin via Demo Login to simulate owner approval.
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Session Agenda & Materials */}
      {session ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Agenda Timeline (2 Cols) */}
          <Card className="md:col-span-2 border-slate-200 p-6 space-y-4 bg-white shadow-sm">
            <div>
              <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-civic-indigo-600" />
                <span>Structured Session Agenda</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Facilitator-guided stages for inquiry, evidence analysis, and youth deliberation.
              </p>
            </div>

            <div className="space-y-3 pt-2 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
              {session.agenda.map((item, idx) => (
                <div key={idx} className="relative flex items-start gap-4 pl-8">
                  <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-civic-indigo-600 border-2 border-white ring-2 ring-civic-indigo-100" />
                  <div className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-xs transition-colors">
                    <div className="flex items-center justify-between font-mono text-[11px] text-civic-indigo-700 font-bold">
                      <span>{item.time}</span>
                      <span className="font-sans text-slate-500 font-normal">Lead: {item.presenter}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs mt-1">{item.topic}</h3>
                  </div>
                </div>
              ))}
            </div>

            {session.notesSummary && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <span className="font-bold block text-slate-900">Deliberation Brief:</span>
                <p className="leading-relaxed">{session.notesSummary}</p>
              </div>
            )}
          </Card>

          {/* Session Resources & Cohort Roster (1 Col) */}
          <div className="space-y-6">
            {/* Downloadable Resources */}
            <Card className="border-slate-200 p-5 space-y-3 bg-white shadow-sm">
              <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-civic-teal-600" />
                <span>Session Study Pack</span>
              </h3>
              <div className="space-y-2 text-xs">
                {session.resources.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => setResourceModal({ title: res.title, type: res.type })}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-civic-teal-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{res.title}</span>
                    </div>
                    <Download className="w-3 h-3 text-slate-400 shrink-0" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Registered Cohort */}
            <Card className="border-slate-200 p-5 space-y-3 bg-white shadow-sm" data-testid="registered-cohort-card">
              <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <span>Participants Registered ({registeredCount})</span>
              </h3>
              {isProtectedRoster ? (
                <div className="space-y-3" data-testid="roster-protected-view">
                  {attendees.length > 0 && (
                    <div className="space-y-1.5 pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Status</span>
                      {attendees.map((user) => (
                        <div key={user.id} className="flex items-center justify-between text-xs py-1">
                          <span className="font-semibold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>You ({user.name})</span>
                          </span>
                          <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Confirmed Attendee
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5" data-testid="roster-protected-notice">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <ShieldCheck className="w-4 h-4 text-civic-teal-600 shrink-0" />
                      <span>Roster Protected for Allocation Privacy</span>
                    </div>
                    <p className="leading-relaxed">
                      Individual attendee identities in allocated cohorts are withheld to prevent indirect status deduction. Total confirmed places: {registeredCount}.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Single-Browser Local Simulation &bull; Full named cohort roster is accessible only to Platform Owner.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {attendees.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">No confirmed participants yet.</p>
                  ) : (
                    attendees.map((user) => (
                      <div key={user.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                        <span className="font-semibold text-slate-900">{user.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{user.role}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-3 border-slate-200 p-5 space-y-3 bg-white shadow-sm" data-testid="registered-cohort-card">
            <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span>Participants Registered ({registeredCount})</span>
            </h3>
            {isProtectedRoster ? (
              <div className="space-y-3" data-testid="roster-protected-view">
                {attendees.length > 0 && (
                  <div className="space-y-1.5 pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Status</span>
                    {attendees.map((user) => (
                      <div key={user.id} className="flex items-center justify-between text-xs py-1">
                        <span className="font-semibold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>You ({user.name})</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Confirmed Attendee
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1.5" data-testid="roster-protected-notice">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-civic-teal-600 shrink-0" />
                    <span>Roster Protected for Allocation Privacy</span>
                  </div>
                  <p className="leading-relaxed">
                    Individual attendee identities in allocated cohorts are withheld to prevent indirect status deduction. Total confirmed places: {registeredCount}.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Single-Browser Local Simulation &bull; Full named cohort roster is accessible only to Platform Owner.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {attendees.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">No confirmed participants yet.</p>
                ) : (
                  attendees.map((user) => (
                    <div key={user.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                      <span className="font-semibold text-slate-900">{user.name}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{user.role}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Resource Preview Modal */}
      <Modal
        isOpen={Boolean(resourceModal)}
        onClose={() => setResourceModal(null)}
        title={resourceModal?.title || 'Session Resource Document'}
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase text-civic-teal-700 bg-civic-teal-50 px-2 py-0.5 rounded border border-civic-teal-200">
              Verified Study Resource
            </span>
            <h4 className="font-bold text-sm text-slate-900">{resourceModal?.title}</h4>
            <p className="text-slate-600 leading-relaxed">
              This document contains empirical IRC guidelines, speed table gradients (IRC-99:2018), and standard desire-line audit protocols approved for JanSahabhag 2047 field sessions.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button size="sm" variant="outline" onClick={() => setResourceModal(null)}>
              Close
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                alert(`Downloaded mock file: ${resourceModal?.title}`);
                setResourceModal(null);
              }}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Download Mock PDF</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Exception Approval Modal */}
      <Modal
        isOpen={exceptionModalOpen}
        onClose={() => setExceptionModalOpen(false)}
        title="Simulate Platform Owner Exception Approval"
      >
        <div className="space-y-4 text-xs" data-testid="exception-modal">
          <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 space-y-1">
            <span className="font-bold block text-purple-950">
              Single-Browser Session: Simulating Platform Owner Authority
            </span>
            <p className="leading-relaxed text-purple-800">
              This action exercises simulated owner exception authority under policy version{' '}
              <strong className="font-mono">2026.1-womens-reservation-33</strong>. An immutable audit record will be logged with your
              approver ID (<strong>{currentUser?.id}</strong>) and provided justification.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="exception-reason-input" className="block font-semibold text-slate-800">
              Substantive Exception Justification:
            </label>
            <textarea
              id="exception-reason-input"
              value={exceptionReason}
              onChange={(e) => setExceptionReason(e.target.value)}
              placeholder="e.g., Targeted candidate outreach concluded; urgent local delivery exception authorized."
              rows={3}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-civic-indigo-500 focus:border-civic-indigo-500"
              data-testid="exception-reason-textarea"
            />
            <span className="text-[10px] text-slate-400 block">
              Minimum 5 characters required for administrative audit trail.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button size="sm" variant="outline" onClick={() => setExceptionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={exceptionReason.trim().length < 5 || isFinalizing}
              isLoading={isFinalizing}
              onClick={handleApproveException}
              data-testid="confirm-exception-btn"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              <span>Confirm & Record Exception Audit</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
