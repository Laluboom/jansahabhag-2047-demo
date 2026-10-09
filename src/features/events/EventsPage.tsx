import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { Event } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { Calendar, MapPin, Users, Video, ArrowRight } from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const list = await demoRepository.getEvents();
        setEvents(list);
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-civic-indigo-600" />
          <span>Civic Events & Assembly Sessions</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Workshops, expert masterclasses, and Youth Assembly deliberation chambers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {events.map((evt) => (
          <Card key={evt.id} hoverable className="p-6 border-slate-200 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2.5 py-0.5 rounded border border-civic-indigo-200">
                  {evt.type}
                </span>
                <StatusChip status={evt.status} />
              </div>

              <CardTitle className="text-base font-bold text-slate-900 font-heading">
                {evt.title}
              </CardTitle>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {evt.description}
              </p>

              <div className="space-y-1.5 pt-1 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{evt.date} &bull; {evt.startTime} - {evt.endTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  {evt.isVirtual ? (
                    <Video className="w-3.5 h-3.5 text-civic-teal-600" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="truncate">{evt.location}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {evt.attendeeUserIds.length}/{evt.capacity} Attending
              </span>

              <Link to={`/events/${evt.id}`}>
                <Button size="sm" variant="outline">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
