import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Assignment, Evidence } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { ArrowLeft, ArrowRight, FileCheck2, Sparkles, CheckCircle2 } from 'lucide-react';

export const SubmitAssignmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { triggerRefresh } = useAppRefreshStore();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [content, setContent] = useState('');
  const [availableEvidence, setAvailableEvidence] = useState<Evidence[]>([]);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id || !currentUser) return;
      setIsLoading(true);
      try {
        const [asg, evs] = await Promise.all([
          demoRepository.getAssignment(id),
          demoRepository.getEvidenceList({ ownerId: currentUser.id }),
        ]);
        setAssignment(asg);
        setAvailableEvidence(evs);
      } catch (err) {
        console.error('Failed to load submit screen', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await demoRepository.submitAssignment({
        assignmentId: id,
        userId: currentUser.id,
        content: content.trim(),
        evidenceIds: selectedEvidenceIds,
      });
      triggerRefresh();
      navigate(`/assignments/${id}`);
    } catch (err) {
      console.error('Failed to submit assignment', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEvidence = (eid: string) => {
    setSelectedEvidenceIds((prev) =>
      prev.includes(eid) ? prev.filter((x) => x !== eid) : [...prev, eid]
    );
  };

  if (isLoading || !assignment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link to={`/assignments/${id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Cancel and return</span>
      </Link>

      <Card className="border-slate-200 p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-600">
            Field Submission Form
          </span>
          <h1 className="text-2xl font-bold font-heading text-slate-900 mt-1">
            Submit: {assignment.title}
          </h1>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            {assignment.prompt}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Textarea
            label="Observation Notes & Field Findings"
            placeholder="Record your observation breakdown, timing, peak vehicle count, or interview findings here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            required
            helperText="Include timestamps, location specifics, and quantitative tallies."
          />

          {/* Select Attached Evidence */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Attach Collected Evidence Records ({selectedEvidenceIds.length} selected)
            </label>
            {availableEvidence.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No existing evidence items found for your account.</p>
            ) : (
              <div className="space-y-2">
                {availableEvidence.map((ev) => {
                  const isSelected = selectedEvidenceIds.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => toggleEvidence(ev.id)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-civic-indigo-500 bg-civic-indigo-50/50 ring-1 ring-civic-indigo-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <span className="font-semibold text-slate-900 block truncate">{ev.title}</span>
                        <span className="text-[11px] text-slate-500">{ev.type} &bull; {ev.source}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center ${
                          isSelected ? 'bg-civic-indigo-600 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/assignments/${id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!content.trim()}
            >
              <span>Submit for Verification (+{assignment.creditsReward} Credits)</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
