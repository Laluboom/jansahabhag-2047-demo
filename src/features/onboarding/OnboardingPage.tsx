import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CheckCircle2, MapPin, Sparkles, ArrowRight, BookOpen } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedTrack, setSelectedTrack] = useState('civic_academy');

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

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button onClick={() => setStep(2)}>
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
