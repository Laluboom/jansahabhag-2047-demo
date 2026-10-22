import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { formatRoleName } from '../../utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import {
  User,
  RotateCcw,
  ShieldCheck,
  Award,
  Sparkles,
  MapPin,
  Mail,
  Building2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, switchPersona } = useAuthStore();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await demoRepository.resetDemo();
      await switchPersona('user_aarav');
      setIsResetModalOpen(false);
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      console.error('Failed to reset demo data', err);
    } finally {
      setIsResetting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-civic-indigo-600" />
          <span>Profile & Demo Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Active persona credentials, institutional affiliations, and local database management.
        </p>
      </div>

      {/* User Information Card */}
      <Card className="border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar src={currentUser.avatar} alt={currentUser.name} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2.5 py-0.5 rounded border border-civic-indigo-200">
                  {formatRoleName(currentUser.role)}
                </span>
                <span className="text-xs text-slate-400">ID: {currentUser.id}</span>
              </div>
              <h2 className="text-2xl font-bold font-heading text-slate-900 mt-1">
                {currentUser.name}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">{currentUser.bio}</p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0">
            <span className="text-xs font-semibold text-slate-500 uppercase block">Total Credits</span>
            <span className="text-3xl font-extrabold text-civic-saffron-700 font-heading">
              {currentUser.totalCredits}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Institution</span>
              <span className="font-semibold">{currentUser.institutionName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Email</span>
              <span className="font-semibold">{currentUser.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Location</span>
              <span className="font-semibold">{currentUser.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Declared Age</span>
              <span className="font-semibold text-civic-teal-700" data-testid="profile-user-age">
                {currentUser.age || 18} yrs (18+)
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Demo Controls & Reset Section */}
      <Card className="border-rose-200 bg-rose-50/30 p-6 sm:p-8 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-rose-600" />
              Demo State & Local Persistence Management
            </span>
            <h3 className="text-lg font-bold font-heading text-slate-900 mt-1">
              Reset Demo Data to Initial Canonical Seed
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
              Resetting restores all courses, completed lessons, submitted assignments, Assembly stages, propositions, and credit ledgers back to the original seed state under Aarav Sharma (including 10 starting credits and verified demo activity history).
            </p>
          </div>

          <Button
            variant="danger"
            size="md"
            onClick={() => setIsResetModalOpen(true)}
            className="shrink-0"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            <span>Reset Demo Data</span>
          </Button>
        </div>

        <div className="pt-3 border-t border-rose-200/60 flex items-center gap-4 text-[11px] text-slate-500">
          <span>Storage Key: <code>jansahbhag_demo_v1</code></span>
          <span>&bull;</span>
          <span>Schema Version: <strong>v{currentUser.schemaVersion}</strong></span>
        </div>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Confirm Reset Demo Data"
        description="Are you sure you want to restore the clean baseline state? All locally modified submissions, reflections, and reviews will be refreshed."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={isResetting} onClick={handleReset}>
              Yes, Restore Initial Seed
            </Button>
          </>
        }
      >
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Deterministic Reset Execution
          </p>
          <p>
            This action will safely purge local storage and reload the primary participant scenario for Aarav Sharma in Jaipur.
          </p>
        </div>
      </Modal>
    </div>
  );
};
