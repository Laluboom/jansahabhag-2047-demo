import React, { useState } from 'react';
import { User } from '../../types/domain';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { getInitials } from '../../components/session/types';
import {
  Users,
  ShieldCheck,
  Star,
  Award,
  Building2,
  X,
  MapPin,
} from 'lucide-react';

function getProjectMemberRole(userId: string, isLead: boolean): string {
  if (isLead) return 'Project Lead (Student Coordinator)';
  switch (userId) {
    case 'user_priya':
      return 'Field Surveyor & Data Lead';
    case 'user_vikram':
      return 'Site Marshal & Traffic Auditor';
    case 'user_kabir':
      return 'Municipal Liaison & Transit Specialist';
    case 'user_meera':
      return 'Community Voice & Pedestrian Advocate';
    case 'user_diya':
      return 'Public Mobilizer & Student Outreach';
    case 'user_tanya':
      return 'Evidence Documentation Specialist';
    case 'user_aditi':
      return 'Engineering Standards Analyst';
    case 'user_aryan':
      return 'IoT Sensor Telemetry Lead';
    case 'user_neha':
      return 'Environmental Canopy Lead';
    case 'user_rahul':
      return 'Urban Forestry & Water Specialist';
    case 'user_isha':
      return 'Transit Safety & Lighting Surveyor';
    case 'user_siddharth':
      return 'Technical Drafting & CAD Specialist';
    default:
      return 'Civic Action Team Member';
  }
}

interface ProjectTeamSeatsProps {
  teamMembers: User[];
  leadUserId: string;
  projectId: string;
  projectTitle: string;
}

export const ProjectTeamSeats: React.FC<ProjectTeamSeatsProps> = ({
  teamMembers,
  leadUserId,
  projectId,
  projectTitle,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedMember = teamMembers.find((m) => m.id === selectedUserId) || null;

  const handleToggleSeat = (userId: string) => {
    setSelectedUserId((prev) => (prev === userId ? null : userId));
  };

  const handleKeyDown = (e: React.KeyboardEvent, userId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleSeat(userId);
    }
  };

  return (
    <Card className="border-slate-200 p-4 sm:p-6 space-y-4 bg-white shadow-sm" data-testid="project-team-seats">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-civic-indigo-600" />
            <span>Action Team Seats ({teamMembers.length})</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Named student seats and operational civic roles for this initiative. Select a seat to inspect operational scope.
          </p>
        </div>
        <span className="text-[11px] font-bold text-civic-indigo-700 bg-civic-indigo-50 border border-civic-indigo-200 px-2.5 py-1 rounded-full self-start sm:self-auto">
          Active Team Board
        </span>
      </div>

      {/* Privacy-Safe 33% Policy Notice */}
      <div className="text-[11px] text-slate-700 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-civic-teal-600 shrink-0" />
          <span>
            <strong>Platform 33% Inclusion Standard:</strong> Seeded Jaipur student cohort conforms to platform inclusion standards without disclosing individual privacy declarations.
          </span>
        </div>
      </div>

      {/* Accessible Seats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {teamMembers.map((member) => {
          const isLead = member.id === leadUserId;
          const role = getProjectMemberRole(member.id, isLead);
          const initials = getInitials(member.name);
          const isSelected = selectedUserId === member.id;

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => handleToggleSeat(member.id)}
              onKeyDown={(e) => handleKeyDown(e, member.id)}
              tabIndex={0}
              aria-pressed={isSelected}
              aria-expanded={isSelected}
              aria-label={`${member.name}, Role: ${role}, Status: Active Team Member`}
              data-testid={`team-seat-${member.id}`}
              className={`p-3 rounded-xl border text-left transition-all motion-reduce:transition-none outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 focus-visible:ring-offset-2 flex items-start gap-3 min-w-0 ${
                isSelected
                  ? 'border-civic-indigo-600 bg-civic-indigo-50/80 shadow-sm ring-2 ring-civic-indigo-200'
                  : isLead
                  ? 'border-civic-saffron-300 bg-civic-saffron-50/30 hover:border-civic-saffron-400'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
              }`}
            >
              {/* Avatar / Initials */}
              <div className="relative shrink-0 mt-0.5">
                {member.avatar ? (
                  <Avatar src={member.avatar} alt={member.name} fallback={initials} size="md" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-civic-indigo-100 text-civic-indigo-800 font-bold text-xs flex items-center justify-center border border-civic-indigo-200">
                    {initials}
                  </div>
                )}
                {isLead && (
                  <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-civic-saffron-600 text-white flex items-center justify-center shadow-xs"
                    title="Project Lead"
                  >
                    <Star className="w-2.5 h-2.5 fill-current" />
                  </div>
                )}
              </div>

              {/* Seat Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900 truncate">{member.name}</span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{role}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isLead
                        ? 'bg-civic-saffron-100 text-civic-saffron-800'
                        : 'bg-slate-200/70 text-slate-700'
                    }`}
                  >
                    {isLead ? 'Lead' : 'Member'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Active</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Seat Details Panel */}
      {selectedMember && (
        <div
          data-testid={`seat-detail-${selectedMember.id}`}
          className="p-4 sm:p-5 rounded-xl border border-civic-indigo-200 bg-civic-indigo-50/50 text-xs space-y-3 transition-all motion-reduce:transition-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {selectedMember.avatar ? (
                <Avatar
                  src={selectedMember.avatar}
                  alt={selectedMember.name}
                  fallback={getInitials(selectedMember.name)}
                  size="lg"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-civic-indigo-200 text-civic-indigo-900 font-bold text-sm flex items-center justify-center border border-civic-indigo-300 shrink-0">
                  {getInitials(selectedMember.name)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 font-heading truncate">
                    {selectedMember.name}
                  </h3>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-civic-indigo-200 text-civic-indigo-900">
                    {getProjectMemberRole(selectedMember.id, selectedMember.id === leadUserId)}
                  </span>
                </div>
                <p className="text-slate-700 text-xs mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{selectedMember.institutionName || 'Navchetna Public School, Jaipur'}</span>
                </p>
                {selectedMember.location && (
                  <p className="text-slate-600 text-[11px] mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{selectedMember.location}</span>
                  </p>
                )}
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedUserId(null)}
              data-testid="btn-close-seat-detail"
              className="text-xs h-7 px-2 shrink-0"
              aria-label="Close team member details"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          {selectedMember.bio && (
            <div className="p-3 rounded-lg bg-white/80 border border-civic-indigo-100 text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-0.5">Civic Action Focus:</span>
              <p>{selectedMember.bio}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-civic-indigo-100 text-[11px] text-slate-600">
            <span>
              Assigned to Initiative: <strong>{projectTitle}</strong> ({projectId})
            </span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>Earns +2 Civic Action Credits on milestone completions</span>
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
