import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { formatRoleName } from '../../utils/formatters';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  Bell,
  Globe,
  RotateCcw,
  UserCheck,
  ChevronDown,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { User } from '../../types/domain';
import { cn } from '../../utils/cn';

interface TopUtilityBarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const TopUtilityBar: React.FC<TopUtilityBarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const { currentUser, switchPersona, activeLanguage, availableLanguages, setLanguage } = useAuthStore();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const users = await demoRepository.getUsers();
      setAllUsers(users);
      if (currentUser) {
        const notifs = await demoRepository.getNotifications(currentUser.id);
        setUnreadCount(notifs.filter((n) => !n.isRead).length);
      }
    }
    load();
  }, [currentUser]);

  const handleSwitch = async (userId: string) => {
    await switchPersona(userId);
    setIsPersonaModalOpen(false);
  };

  const handleReset = async () => {
    await demoRepository.resetDemo();
    await switchPersona('user_aarav');
    setIsResetModalOpen(false);
    navigate('/dashboard');
    window.location.reload();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left mobile menu toggle + breadcrumb/branding */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            id="mobile-menu-toggle"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-civic-indigo-500"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            data-testid="mobile-menu-toggle"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        {/* Active Persona Indicator Badge */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setIsPersonaModalOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500"
            title="Click to switch demo persona"
          >
            <Avatar
              src={currentUser?.avatar}
              alt={currentUser?.name || 'User'}
              size="sm"
            />
            <div className="hidden sm:block">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-civic-indigo-700 block -mb-0.5">
                Viewing as {formatRoleName(currentUser?.role || 'participant')}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {currentUser?.name || 'Loading...'}
              </span>
            </div>
            <span className="sm:hidden text-xs font-semibold text-slate-800">
              {currentUser?.name?.split(' ')[0] || 'Persona'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1" />
          </button>
        </div>
      </div>

      {/* Right utility items */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Selector */}
        <div className="relative flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-civic-indigo-500"
            aria-label="Select language"
            aria-expanded={isLangDropdownOpen}
            data-testid="language-selector-btn"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline uppercase font-semibold">
              {activeLanguage}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {activeLanguage === 'hi' && (
            <span
              className="hidden lg:inline-flex items-center text-[10px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
              data-testid="hindi-pending-review-badge"
            >
              Hindi Pending Review
            </span>
          )}

          {isLangDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsLangDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  Demo Languages
                </div>
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors',
                      activeLanguage === lang.code && 'bg-civic-indigo-50/70 text-civic-indigo-700 font-semibold'
                    )}
                    data-testid={`lang-option-${lang.code}`}
                  >
                    <span>{lang.label}</span>
                    {lang.isDemo && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-800 font-normal">
                        {lang.code === 'hi' ? 'Pending Review' : 'Simulated'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications Icon with Badge */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 transition-colors"
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-civic-saffron-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Reset Demo Quick Action */}
        <button
          type="button"
          onClick={() => setIsResetModalOpen(true)}
          className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 hidden sm:flex items-center gap-1.5 text-xs font-medium"
          title="Reset all demo data to default clean state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        {/* Persona Switcher direct shortcut */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsPersonaModalOpen(true)}
          className="hidden md:inline-flex text-xs font-medium"
        >
          <UserCheck className="w-3.5 h-3.5 mr-1" />
          Switch Persona
        </Button>
      </div>

      {/* Switch Persona Modal */}
      <Modal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        title="Switch Demo Persona"
        description="Experience JanSahabhag 2047 from distinct stakeholder viewpoints with shared live data."
        maxWidth="lg"
      >
        <div className="space-y-3">
          {allUsers.map((user) => {
            const isSelected = user.id === currentUser?.id;
            return (
              <button
                key={user.id}
                onClick={() => handleSwitch(user.id)}
                className={cn(
                  'w-full flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all hover:shadow-xs focus-visible:ring-2 focus-visible:ring-civic-indigo-500',
                  isSelected
                    ? 'border-civic-indigo-500 bg-civic-indigo-50/50 ring-1 ring-civic-indigo-500'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <Avatar src={user.avatar} alt={user.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-900 font-heading">
                      {user.name}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {formatRoleName(user.role)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{user.institutionName}</p>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{user.bio}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Reset Demo Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Demo Data?"
        description="This will restore all courses, assignments, assemblies, submissions, and credit transactions back to the clean canonical seed state."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleReset}>
              Yes, Restore Initial Seed
            </Button>
          </>
        }
      >
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Deterministic Local Reset
          </p>
          <p>
            Your browser's local database key (<code>jansahbhag_demo_v1</code>) will be purged and re-populated with Aarav Sharma's baseline Jaipur pedestrian safety journey.
          </p>
        </div>
      </Modal>
    </header>
  );
};
