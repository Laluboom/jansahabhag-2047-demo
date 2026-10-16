import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';
import {
  Home,
  BookOpen,
  FileCheck2,
  Scale,
  Vote,
  Landmark,
  Layers,
  Target,
  Users2,
  Award,
  HeartHandshake,
  User,
  Bell,
  Settings,
  HelpCircle,
  Building2,
  ShieldCheck,
  BarChart3,
  X,
} from 'lucide-react';

export interface DesktopSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  isMobile = false,
  onClose,
}) => {
  const { currentUser } = useAuthStore();
  const role = currentUser?.role || 'participant';

  // Master PRD §1 and §A4 canonical 11 learner entries in strict order
  const learnerNav = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/learn', label: 'Learn', icon: BookOpen },
    { to: '/assignments', label: 'Activities & Assignments', icon: FileCheck2 },
    { to: '/debate-room', label: 'Debate Room', icon: Scale, badge: 'Simulation' },
    { to: '/assemblies', label: 'Youth Assembly', icon: Vote },
    { to: '/parliament', label: 'Youth Parliament', icon: Landmark, badge: 'Prototype' },
    { to: '/workspace', label: 'Workspace', icon: Layers, badge: 'Simulation' },
    { to: '/projects', label: 'Labs & Projects', icon: Target },
    { to: '/community', label: 'Community', icon: Users2 },
    { to: '/passport', label: 'Civic Passport', icon: Award },
    { to: '/uhv', label: 'UHV / Jeevan Vidya', icon: HeartHandshake, badge: 'Stream' },
  ];

  // Administrative Navigation (role-gated)
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

  // Utilities Navigation (Master PRD: kept in utilities, not in learner sequence)
  const utilityNav = [
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/help', label: 'Help / Rulebooks', icon: HelpCircle },
  ];

  return (
    <aside
      className={cn(
        'flex flex-col bg-slate-900 text-slate-300',
        isMobile
          ? 'w-full h-full overflow-y-auto'
          : 'hidden lg:flex w-64 border-r border-slate-800 shrink-0 h-screen sticky top-0 overflow-y-auto'
      )}
      aria-label={isMobile ? 'Mobile Navigation Sidebar' : 'Main Navigation Sidebar'}
    >
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <Link
          to="/dashboard"
          onClick={() => onClose?.()}
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-400 rounded-lg"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-civic-indigo-600 via-civic-teal-500 to-civic-saffron-500 flex items-center justify-center text-white font-bold font-heading shadow-md shrink-0">
            JS
          </div>
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-base text-white tracking-tight flex items-center gap-1">
              <span>JanSahabhag</span>{' '}
              <span className="text-civic-saffron-400 text-xs px-1 py-0.2 bg-civic-saffron-950/80 rounded border border-civic-saffron-700/50">
                2047
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-normal truncate">Youth Civic Action Demo</p>
          </div>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-400"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-3 py-4 space-y-6">
        {/* Core Learner Navigation: Canonical Eleven Items */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Learner Navigation
          </p>
          <nav aria-label="Learner Navigation" className="space-y-1">
            {learnerNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium min-h-[44px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-400',
                      isActive
                        ? 'bg-civic-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    )
                  }
                  onClick={() => onClose?.()}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded border font-normal shrink-0 ml-1.5',
                        item.badge === 'Simulation' && 'bg-indigo-950/80 border-indigo-800/80 text-indigo-300',
                        item.badge === 'Planned' && 'bg-amber-950/80 border-amber-800/80 text-amber-300',
                        item.badge === 'Prototype' && 'bg-sky-950/80 border-sky-800/80 text-sky-300',
                        item.badge === 'Stream' && 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
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
            <nav aria-label="Administrative Navigation" className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium min-h-[40px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-teal-400',
                        isActive
                          ? 'bg-civic-teal-700 text-white font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      )
                    }
                    onClick={() => onClose?.()}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        {/* Utilities Section */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Utilities
          </p>
          <nav aria-label="Utilities Navigation" className="space-y-1">
            {utilityNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium min-h-[40px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-400',
                      isActive
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    )
                  }
                  onClick={() => onClose?.()}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Scenario Reminder */}
      <div className="p-3.5 m-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs shrink-0">
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
