import React from 'react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { Lightbulb, Sparkles, ArrowRight, ThumbsUp } from 'lucide-react';

export const IdeaLabPage: React.FC = () => {
  const ideas = [
    {
      title: 'Solar-Powered Smart Crossing Flasher',
      author: 'Aarav Sharma & Team',
      desc: 'Synchronized amber flashers activated by thermal pedestrian movement at school crosswalks.',
      votes: 38,
      status: 'Incubation',
    },
    {
      title: 'Cool Mist Walking Canopy for Summer Rush',
      author: 'Aryan Sen (RTU Kota)',
      desc: 'Low-energy misting pergolas along unshaded pedestrian corridors near campus gates.',
      votes: 45,
      status: 'Prototyping',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DemoPreviewBadge
        size="banner"
        label="Idea Lab Preview"
        description="Youth civic innovation incubation sandbox for translating observations into grassroots technology and design prototypes."
      />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-amber-500" />
          <span>Idea Lab: Civic Inventions & Prototypes</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Explore youth-designed civic innovations incubating for municipal trials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {ideas.map((idea, i) => (
          <Card key={i} className="p-6 border-slate-200 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {idea.status}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" /> {idea.votes} Youth Endorsements
                </span>
              </div>

              <CardTitle className="text-base font-bold text-slate-900">{idea.title}</CardTitle>
              <p className="text-xs text-slate-600 leading-relaxed">{idea.desc}</p>
              <span className="text-xs text-slate-400 block">Lead: {idea.author}</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <DemoPreviewBadge size="sm" label="Simulated Prototype" />
              <Button size="sm" variant="outline" disabled>
                <span>View Prototype</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
