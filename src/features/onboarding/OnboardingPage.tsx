import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CheckCircle2, MapPin, Sparkles, ArrowRight, BookOpen, ShieldCheck, AlertCircle } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedTrack, setSelectedTrack] = useState('civic_academy');
  const [age, setAge] = useState<number>(currentUser?.age || 18);
  const [ageError, setAgeError] = useState<string | null>(null);

  const handleAgeChange = (val: string) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) {
      setAge(0);
      setAgeError('Please enter a valid age in years.');
    } else {
      setAge(parsed);
      if (parsed < 18) {
        setAgeError('Participants must be 18 or older to sign up. Demo participation is restricted to 18+ per platform policy (no real identity verification claimed).');
      } else {
        setAgeError(null);
      }
    }
  };

  const tracks = [
    {
      id: 'civic_academy',
      title: 'Civic Academy & Safe Streets',
      desc: 'Field observation, traffic counts, and road safety mapping.',
      icon: MapPin,
    },
    {
      id: 'uhv_values',
      title: 'Universal Human Values (UHV)',
      desc: 'Self-exploration, empathy, and constructive dialogue.',
      icon: BookOpen,
    },
    {
      id: 'action_skills',
      title: 'Participatory Civic Action',
      desc: 'Municipal engagement, project leadership, and policy proposals.',
      icon: Sparkles,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-600 bg-civic-indigo-50 px-2.5 py-1 rounded-full border border-civic-indigo-200">
          Step {step} of 2 &bull; Participant Setup
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          Welcome to JanSahabhag 2047, {currentUser?.name}!
        </h1>
        <p className="text-sm text-slate-600">
          Representing <strong>{currentUser?.institutionName}</strong> in Jaipur.
        </p>
      </div>

      {/* 18+ Participant Age Requirement Policy Banner */}
      <div
        className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs"
        data-testid="onboarding-age-requirement-notice"
      >
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-amber-900 block">
            18+ Participant Age Requirement
          </span>
          <p className="text-slate-700 leading-relaxed">
            Platform demo policy requires every participant to be 18 years of age or older. This is an owner-defined demo policy; no real identity verification is claimed or performed.
          </p>
        </div>
      </div>

      {step === 1 ? (
        <Card className="p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold font-heading text-slate-900 mb-1">
              Select Your Primary Civic Track
            </h2>
            <p className="text-xs text-slate-500">
              Choose the learning pathway you want to focus on for Term 1.
            </p>
          </div>

          <div className="space-y-3">
            {tracks.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedTrack === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrack(t.id)}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-civic-indigo-500 bg-civic-indigo-50/40 ring-1 ring-civic-indigo-500 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-civic-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 font-heading">{t.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{t.desc}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-civic-indigo-600 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Age Confirmation Input */}
          <div className="pt-4 border-t border-slate-100 space-y-2" data-testid="age-input-section">
            <div>
              <label htmlFor="participant-age-input" className="block text-xs font-bold text-slate-800">
                Participant Age Confirmation (Years)
              </label>
              <p className="text-[11px] text-slate-500">
                Platform requirement: Participants must be 18 or older to sign up and participate.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="participant-age-input"
                type="number"
                min={1}
                max={120}
                value={age === 0 ? '' : age}
                onChange={(e) => handleAgeChange(e.target.value)}
                className={`w-36 px-3 py-2 text-xs rounded-lg border font-medium ${
                  ageError || age < 18
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-civic-indigo-500'
                } focus:outline-none focus:ring-2`}
                data-testid="participant-age-input"
              />
              <span className="text-xs text-slate-500">
                {age >= 18 ? 'Eligible for demo participation (18+)' : 'Ineligible (< 18)'}
              </span>
            </div>
            {(ageError || age < 18) && (
              <div
                className="flex items-center gap-1.5 text-xs text-rose-600 font-medium"
                data-testid="age-error-message"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  {ageError ||
                    'Participants must be 18 or older to sign up. Demo participation is restricted to 18+ per platform policy.'}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              onClick={() => {
                if (age < 18) {
                  setAgeError(
                    'Participants must be 18 or older to sign up. Demo participation is restricted to 18+ per platform policy (no real identity verification claimed).'
                  );
                  return;
                }
                setStep(2);
              }}
              disabled={age < 18}
              data-testid="onboarding-continue-btn"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-900">
              Onboarding Complete!
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
              You are ready to access your personalized participant dashboard, track course modules, and prepare evidence for the upcoming Jaipur Pedestrian Safety Assembly.
            </p>
            <p className="text-xs font-semibold text-civic-teal-700 mt-2" data-testid="confirmed-age-display">
              Confirmed Age: {age} years &bull; 18+ Participant Requirement Satisfied
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button size="lg" onClick={() => navigate('/dashboard')}>
              <span>Enter Participant Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
