import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { Event, Session } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { ArrowLeft, Calendar, MapPin, Video, Users, CheckCircle2 } from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isRsvping, setIsRsvping] = useState(false);
  const [hasRsvped, setHasRsvped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const evt = await demoRepository.getEvent(id);
        setEvent(evt);
        if (currentUser && evt?.attendeeUserIds.includes(currentUser.id)) {
          setHasRsvped(true);
        }
      } catch (err) {
        console.error('Failed to load event details', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser]);

  const handleRsvp = async () => {
    if (!id || !currentUser) return;
    setIsRsvping(true);
    try {
      await demoRepository.rsvpEvent(id, currentUser.id);
      setHasRsvped(true);
    } catch (err) {
      console.error('Failed to RSVP', err);
    } finally {
      setIsRsvping(false);
    }
  };

  if (isLoading || !event) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link to="/events" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Events</span>
      </Link>

      <Card className="border-slate-200 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2.5 py-0.5 rounded border border-civic-indigo-200">
            {event.type}
          </span>
          <StatusChip status={event.status} />
        </div>

        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">
            {event.title}
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{event.date} &bull; {event.startTime} - {event.endTime}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            {event.isVirtual ? <Video className="w-4 h-4 text-civic-teal-600" /> : <MapPin className="w-4 h-4 text-slate-500" />}
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Users className="w-4 h-4 text-slate-500" />
            <span>Capacity: {event.attendeeUserIds.length}/{event.capacity} Registered</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          {hasRsvped ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>You are Registered for this Session</span>
            </div>
          ) : (
            <Button size="md" variant="primary" isLoading={isRsvping} onClick={handleRsvp}>
              RSVP for Session
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
