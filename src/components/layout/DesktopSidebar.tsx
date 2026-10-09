import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';
import {
  Home,
  BookOpen,
  Users2,
  Vote,
  Target,
  Award,
  MessageSquare,
  Calendar,
  Bell,
  User,
  ShieldCheck,
  Building2,
  Layers,
  BarChart3,
  Landmark,
  Compass,
  FileCheck2,
} from 'lucide-react';

export const DesktopSidebar: React.FC = () => {
  const { currentUser } = useAuthStore();
  const role = currentUser?.role || 'participant';

  const participantNav = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/learn', label: 'Learn', icon: BookOpen },
    { to: '/participate', label: 'Participate', icon: Compass },
    { to: '/assemblies', label: 'Deliberate', icon: Vote },
    { to: '/projects', label: 'Act', icon: Target },
    { to: '/passport', label: 'Passport', icon: Award },
  ];

  const supportingNav = [
    { to: '/assignments', label: 'Assignments', icon: FileCheck2 },
    { to: '/community', label: 'Community', icon: MessageSquare },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile & Settings', icon: User },
  ];

  const adminNav = [
    ...(role === 'teacher' || role === 'institution_admin'
      ? [
          { to: '/institution/dashboard', label: 'Institution Hub', icon: Building2 },
          { to: '/institution/participants', label: 'Cohort Students', icon: Users2 },
        ]
      : []),
    ...(role === 'programme_manager' || role === 'platform_admin'
      ? [
          { to: '/admin/dashboard', label: 'Admin Command', icon: ShieldCheck },
          { to: '/admin/programmes', label: 'Programmes Mgmt', icon: Layers },
          { to: '/admin/moderation', label: 'Moderation Queue', icon: ShieldCheck },
          { to: '/analytics', label: 'Civic Analytics', icon: BarChart3 },
        ]
      : []),
  ];

  const previewNav = [
    { to: '/parliament', label: 'Youth Parliament' },
    { to: '/labs/ideas', label: 'Idea Lab' },
    { to: '/labs/research', label: 'Research Lab' },
    { to: '/labs/policy', label: 'Policy Lab' },
    { to: '/issues', label: 'Civic Issues Map' },
    { to: '/stakeholders', label: 'Stakeholders' },
    { to: '/studio', label: 'Civic Studio' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-400 rounded-lg">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-civic-indigo-600 via-civic-teal-500 to-civic-saffron-500 flex items-center justify-center text-white font-bold font-heading shadow-md">
            JS
          </div>
          <div>
            <h1 className="font-heading font-bold text-base text-white tracking-tight flex items-center gap-1">
              JanSahabhag <span className="text-civic-saffron-400 text-xs px-1 py-0.2 bg-civic-saffron-950/80 rounded border border-civic-saffron-700/50">2047</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-normal">Youth Civic Action Demo</p>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-4 space-y-6">
        {/* Core Participant Navigation */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Participant Journey
          </p>
          <nav className="space-y-1">
            {participantNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-400',
                      isActive
                        ? 'bg-civic-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Supporting Navigation */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Engagement & Tools
          </p>
          <nav className="space-y-1">
            {supportingNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-400',
                      isActive
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Admin Navigation if role is admin/teacher */}
        {adminNav.length > 0 && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-civic-teal-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Admin Workspace</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-civic-teal-950 border border-civic-teal-800 text-civic-teal-300">
                Active
              </span>
            </p>
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-teal-400',
                        isActive
                          ? 'bg-civic-teal-700 text-white font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      )
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        {/* Future Preview Modules */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Previews & Labs</span>
            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300">
              Demo Preview
            </span>
          </p>
          <div className="grid grid-cols-2 gap-1 px-1">
            {previewNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'px-2.5 py-1.5 rounded-md text-xs font-normal transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 truncate',
                    isActive && 'bg-slate-800 text-amber-300 font-medium'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Scenario Reminder */}
      <div className="p-3.5 m-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <Landmark className="w-3.5 h-3.5 text-civic-saffron-400" />
          <span className="font-semibold text-slate-200">Active Scenario</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Jaipur Pedestrian Safety &bull; Navchetna School
        </p>
      </div>
    </aside>
  );
};
