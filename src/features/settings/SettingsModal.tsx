import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { SessionPreferencesService } from '../../services/sessionPreferencesService';
import { Zap, LayoutGrid, List, Info, Check } from 'lucide-react';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferenceChange?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onPreferenceChange,
}) => {
  const [isLowData, setIsLowData] = useState<boolean>(false);
  const [defaultViewMode, setDefaultViewMode] = useState<'chamber' | 'text'>('chamber');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLowData(SessionPreferencesService.getLowDataPreference());
      setDefaultViewMode(SessionPreferencesService.getSessionViewMode());
      setSavedMessage(null);
    }
  }, [isOpen]);

  const handleToggleLowData = () => {
    const nextVal = !isLowData;
    setIsLowData(nextVal);
    SessionPreferencesService.setLowDataPreference(nextVal);
    if (nextVal) {
      setDefaultViewMode('text');
      SessionPreferencesService.setSessionViewMode('text');
    }
    setSavedMessage('Preferences updated locally.');
    onPreferenceChange?.();
  };

  const handleViewModeChange = (mode: 'chamber' | 'text') => {
    setDefaultViewMode(mode);
    SessionPreferencesService.setSessionViewMode(mode);
    setSavedMessage('View mode preference saved.');
    onPreferenceChange?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Session & Data Preferences"
      description="Configure deliberative chamber view defaults and network bandwidth optimization for this browser demo."
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
            {savedMessage && (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{savedMessage}</span>
              </>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={onClose} data-testid="close-settings-modal-btn">
            Done
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-xs text-slate-700" data-testid="settings-surface-modal">
        {/* Low Data Mode Toggle Preference */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 font-heading">
                <Zap className="w-4 h-4 text-civic-saffron-600" />
                <span>Low Data Preference</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Defaults all new deliberative session views to lightweight Text Mode, suppresses decorative animations, uses initials rather than photo avatars, and avoids large media previews.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isLowData}
              onClick={handleToggleLowData}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-civic-indigo-600 focus:ring-offset-2 ${
                isLowData ? 'bg-civic-indigo-600' : 'bg-slate-300'
              }`}
              data-testid="low-data-toggle"
              aria-label="Toggle Low Data Preference"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  isLowData ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Status:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                isLowData
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200 text-slate-600'
              }`}
              data-testid="low-data-status"
            >
              {isLowData ? 'Active (Text-First Defaults)' : 'Standard (Chamber Layout)'}
            </span>
          </div>
        </div>

        {/* Default View Mode Preference */}
        <div className="space-y-2">
          <label className="font-bold text-xs uppercase tracking-wider text-slate-700 block font-heading">
            Default Deliberative Chamber View
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
            <button
              type="button"
              role="radio"
              aria-checked={defaultViewMode === 'chamber'}
              onClick={() => handleViewModeChange('chamber')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                defaultViewMode === 'chamber'
                  ? 'border-civic-indigo-600 bg-civic-indigo-50/70 text-civic-indigo-950 ring-1 ring-civic-indigo-500'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              data-testid="view-mode-chamber-option"
            >
              <LayoutGrid className="w-4 h-4 text-civic-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-xs">Chamber Layout</span>
                <span className="text-[11px] text-slate-500 leading-tight">
                  Visual benches & podium layout
                </span>
              </div>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={defaultViewMode === 'text'}
              onClick={() => handleViewModeChange('text')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                defaultViewMode === 'text'
                  ? 'border-civic-indigo-600 bg-civic-indigo-50/70 text-civic-indigo-950 ring-1 ring-civic-indigo-500'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
              data-testid="view-mode-text-option"
            >
              <List className="w-4 h-4 text-civic-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-xs">Accessible Text Mode</span>
                <span className="text-[11px] text-slate-500 leading-tight">
                  Initials, turns feed, zero animation
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Persistence & Backend Requirement Notice */}
        <div
          className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-start gap-2"
          data-testid="settings-backend-boundary-notice"
        >
          <Info className="w-4 h-4 text-civic-indigo-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Local Browser Persistence:</strong> Your view choices and data mode preference persist across route changes and reloads in this browser session. True multi-user reconnect continuity and live participant synchronisation require a production backend deliberative gateway.
          </p>
        </div>
      </div>
    </Modal>
  );
};
