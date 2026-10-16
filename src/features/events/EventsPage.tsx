import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Event, EventType } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  Calendar,
  MapPin,
  Users,
  Video,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const EventsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey } = useAppRefreshStore();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
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
  }, [refreshKey]);

  const filteredEvents = events.filter((e) => {
    if (selectedType === 'all') return true;
    return e.type === selectedType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <Calendar className="w-7 h-7 text-civic-indigo-600" />
          <span>Civic Events & Deliberation Sessions</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Workshops, expert masterclasses, school zone audits, and Youth Assembly deliberation chambers.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Type:
        </span>
        {[
          { id: 'all', label: `All Sessions (${events.length})` },
          {
            id: 'assembly',
            label: `Assembly Chambers (${events.filter((e) => e.type === 'assembly').length})`,
          },
          {
            id: 'field_audit',
            label: `Field Audits (${events.filter((e) => e.type === 'field_audit').length})`,
          },
          {
            id: 'expert_session',
            label: `Masterclasses (${events.filter((e) => e.type === 'expert_session').length})`,
          },
          {
            id: 'workshop',
            label: `Workshops (${events.filter((e) => e.type === 'workshop').length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedType === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredEvents.map((evt) => {
          const isRegistered = currentUser ? evt.attendeeUserIds.includes(currentUser.id) : false;

          return (
            <Card
              key={evt.id}
              hoverable
              className="p-6 border-slate-200 flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2.5 py-0.5 rounded border border-civic-indigo-200">
                      {evt.type.replace('_', ' ')}
                    </span>
                    {!evt.allocation?.isPrivacySuppressed && evt.allocation?.status === 'finalized_compliant' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        33% Compliant
                      </span>
                    )}
                    {!evt.allocation?.isPrivacySuppressed && evt.allocation?.status === 'finalized_exception' && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Owner Exception
                      </span>
                    )}
                    {!evt.allocation?.isPrivacySuppressed && evt.allocation?.status === 'blocked_noncompliant' && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Blocked
                      </span>
                    )}
                    {evt.allocation?.isPrivacySuppressed && (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200" data-testid="status-protected">
                        Protected
                      </span>
                    )}
                    {evt.allocation?.status === 'unvalidated_legacy' && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Legacy Unvalidated
                      </span>
                    )}
                  </div>
                  <StatusChip status={evt.status} />
                </div>

                <CardTitle className="text-base font-bold text-slate-900 font-heading leading-snug">
                  {evt.title}
                </CardTitle>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {evt.description}
                </p>

                <div className="space-y-1.5 pt-1 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-civic-indigo-600" />
                    <span className="font-semibold text-slate-800">
                      {formatDate(evt.date)} &bull; {evt.startTime} - {evt.endTime}
                    </span>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500">
                    {evt.registeredCount ?? evt.attendeeUserIds.length}/{evt.capacity} Registered
                  </span>
                  <span className="text-[11px] text-slate-400">
                    &bull; 33% Min: {evt.allocation?.reservedMinimum ?? Math.ceil(0.33 * evt.capacity)}
                    {!evt.allocation?.isPrivacySuppressed && evt.allocation?.vacanciesCount !== undefined ? ` (${evt.allocation.vacanciesCount} vacant)` : ''}
                  </span>
                  {isRegistered && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> RSVP'd
                    </span>
                  )}
                </div>

                <Link to={`/events/${evt.id}`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    <span>View Agenda</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
