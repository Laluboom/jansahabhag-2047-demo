import React, { useState } from 'react';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { PointOfUseRulesButton } from '../../components/ui/PointOfUseRulesButton';
import {
  Lightbulb,
  ThumbsUp,
  X,
  Cpu,
  CheckCircle2,
  Plus,
} from 'lucide-react';

interface IdeaItem {
  id: string;
  title: string;
  author: string;
  desc: string;
  votes: number;
  status: string;
  specs: string[];
  estimatedCost: string;
}

export const IdeaLabPage: React.FC = () => {
  const [ideas, setIdeas] = useState<IdeaItem[]>([
    {
      id: 'IDEA-01',
      title: 'Solar-Powered Smart Crossing Flasher',
      author: 'Aarav Sharma & Team (Navchetna School)',
      desc: 'Synchronized amber flashers activated by thermal pedestrian movement at school crosswalks.',
      votes: 38,
      status: 'Incubation',
      specs: ['PIR motion detector (10m range)', '12V Solar panel & LiFePO4 battery', 'Wireless RF sync to road opposite'],
      estimatedCost: '₹14,500 / crossing',
    },
    {
      id: 'IDEA-02',
      title: 'Cool Mist Walking Canopy for Summer Rush',
      author: 'Aryan Sen (RTU Kota Civic Wing)',
      desc: 'Low-energy misting pergolas along unshaded pedestrian corridors near campus gates.',
      votes: 45,
      status: 'Prototyping',
      specs: ['High pressure brass misting nozzles (0.2mm)', 'Recycled stormwater cistern integration', 'Automated timer tied to temperature > 38°C'],
      estimatedCost: '₹32,000 / 20m run',
    },
    {
      id: 'IDEA-03',
      title: 'Tactile Warning Paving Blocks from Recycled Aggregates',
      author: 'Kavita Verma (Jaipur Youth Delegate)',
      desc: 'Durable yellow blister tiles molded from fly ash and recycled plastic to guide visually impaired students.',
      votes: 29,
      status: 'Design Testing',
      specs: ['IS:16075 compliant blister profile', 'Non-slip wet friction coefficient > 0.6', '100% recycled industrial waste'],
      estimatedCost: '₹450 / sq meter',
    },
  ]);

  const [selectedIdea, setSelectedIdea] = useState<IdeaItem | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleVote = (id: string) => {
    setIdeas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, votes: item.votes + 1 } : item))
    );
  };

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const newIdea: IdeaItem = {
      id: `IDEA-0${ideas.length + 1}`,
      title: newTitle.trim(),
      author: 'Current Student (Simulated Session)',
      desc: newDesc.trim(),
      votes: 1,
      status: 'Sandbox Concept',
      specs: ['Initial peer validation required', 'Empirical field testing pending'],
      estimatedCost: 'To be estimated',
    };

    setIdeas([newIdea, ...ideas]);
    setIsSubmitModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <DemoPreviewBadge
        size="banner"
        label="Idea Lab Preview"
        description="Youth civic innovation incubation sandbox for translating observations into grassroots technology and design prototypes."
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <span>Idea Lab: Civic Inventions & Prototypes</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Explore and endorse youth-designed civic hardware, spatial interventions, and low-cost street prototypes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <PointOfUseRulesButton
            moduleName="Idea Lab"
            triggerText="Lab Rules"
            modalTitle="Idea Lab Innovation Guidelines"
            description="Standards for proposing and endorsing civic innovations."
            rules={[
              {
                title: 'Community-Focused Innovation',
                description: 'Ideas must focus on practical, low-cost civic interventions supporting safer public spaces.',
              },
              {
                title: 'Open Knowledge & Safety',
                description: 'Proposals must adhere to basic safety standards and avoid proprietary or commercial advertising.',
              },
            ]}
            testId="idea-lab-rules-btn"
          />
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Propose Innovation</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {ideas.map((idea) => (
          <Card key={idea.id} className="p-6 border-slate-200 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {idea.status}
                </span>
                <button
                  onClick={() => handleVote(idea.id)}
                  className="text-xs text-slate-600 hover:text-civic-indigo-600 font-semibold flex items-center gap-1 p-1 rounded hover:bg-slate-100 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-civic-indigo-600" />
                  <span>{idea.votes}</span>
                </button>
              </div>

              <CardTitle className="text-base font-bold text-slate-900">{idea.title}</CardTitle>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{idea.desc}</p>
              <span className="text-xs text-slate-400 block pt-1">Lead: {idea.author}</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <DemoPreviewBadge size="sm" label="Prototype Sandbox" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedIdea(idea)}
                className="text-xs"
              >
                <span>View Prototype</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Prototype Detail Modal */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {selectedIdea.id} &bull; {selectedIdea.status}
                </span>
                <h3 className="text-base font-bold font-heading text-slate-900 mt-1">
                  {selectedIdea.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIdea(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">{selectedIdea.desc}</p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-civic-indigo-600" />
                  <span>Technical & Deployment Specifications</span>
                </span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  {selectedIdea.specs.map((spec, i) => (
                    <li key={i}>{spec}</li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-800">
                  <span>Unit Target Cost:</span>
                  <span className="text-civic-teal-700">{selectedIdea.estimatedCost}</span>
                </div>
              </div>

              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] text-indigo-900">
                <strong>Simulated Trial Phase:</strong> Municipal pilot deployment pending review by Jaipur Smart City Mission Cell.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleVote(selectedIdea.id);
                  setSelectedIdea(null);
                }}
              >
                <ThumbsUp className="w-3.5 h-3.5 mr-1 text-civic-indigo-600" />
                <span>Endorse (+1)</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedIdea(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Propose Idea Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <span>Propose Grassroots Innovation</span>
              </h3>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIdea} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Innovation Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Reflective Sidewalk Curb Bollards"
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Concept & Problem Solved
                </label>
                <textarea
                  rows={4}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe your design, target school zone, and why it improves pedestrian safety..."
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSubmitModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  <span>Submit to Sandbox</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
