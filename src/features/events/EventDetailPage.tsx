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
    try {
      await demoRepository.rsvpEvent(id, currentUser.id, status);
      setSelectedRsvp(status);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to update RSVP', err);
    } finally {
      setIsRsvping(false);
    }
  };

  const handleCheckIn = async () => {
    if (!id || !currentUser) return;
    setIsCheckingIn(true);
    try {
      await demoRepository.checkInEvent(id, currentUser.id);
      setIsCheckedIn(true);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to check in', err);
    } finally {
      setIsCheckingIn(false);
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </Link>

      {/* Main Event Card */}
      <Card className="border-slate-200 p-6 sm:p-8 space-y-5 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2.5 py-0.5 rounded border border-civic-indigo-200">
              {event.type.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400 font-mono">{event.id}</span>
          </div>
          <StatusChip status={event.status} />
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
                {event.attendeeUserIds.length} / {event.capacity} Registered
              </span>
              <span className="text-slate-500">
                {event.capacity - event.attendeeUserIds.length} seats remaining
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

      {/* Session Agenda & Materials */}
      {session && (
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
            <Card className="border-slate-200 p-5 space-y-3 bg-white shadow-sm">
              <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <span>Participants Registered ({attendees.length})</span>
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {attendees.map((user) => (
                  <div key={user.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <span className="font-semibold text-slate-900">{user.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{user.role}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
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
    </div>
  );
};
