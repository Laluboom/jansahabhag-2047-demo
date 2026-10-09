import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Proposition, Evidence, PropositionOutcome, DissentRecord, Reflection } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  History,
  Edit3,
  Save,
  X,
  FileCheck2,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react';
import { formatDateTime, formatDate } from '../../utils/formatters';

export const PropositionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isFinalising, setIsFinalising] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [finaliseError, setFinaliseError] = useState<string | null>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState('');
  const [editProblem, setEditProblem] = useState('');
  const [editInsight, setEditInsight] = useState('');
  const [editProposition, setEditProposition] = useState('');
  const [editEnablers, setEditEnablers] = useState<string[]>([]);
  const [newEnabler, setNewEnabler] = useState('');
  const [editRisks, setEditRisks] = useState<string[]>([]);
  const [newRisk, setNewRisk] = useState('');
  const [editNextStep, setEditNextStep] = useState('');
  const [editUnresolved, setEditUnresolved] = useState<string[]>([]);
  const [newUnresolved, setNewUnresolved] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Dissent Record State
  const [dissentReason, setDissentReason] = useState('');
  const [dissentAmendment, setDissentAmendment] = useState('');
  const [isAddingDissent, setIsAddingDissent] = useState(false);

  // Reflection State
  const [reflectionText, setReflectionText] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([
    'Trust (Vishwas)',
    'Empathy (Samvedana)',
    'Evidence-First',
  ]);
  const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);
  const [reflectionSuccess, setReflectionSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const prop = await demoRepository.getProposition(id);
        setProposition(prop);

        if (prop) {
          setEditQuestion(prop.question);
          setEditProblem(prop.problem);
          setEditInsight(prop.insight);
          setEditProposition(prop.proposition);
          setEditEnablers(prop.enablers || []);
          setEditRisks(prop.risks || []);
          setEditNextStep(prop.nextStep || '');
          setEditUnresolved(prop.unresolvedQuestions || []);

          if (prop.evidenceIds.length) {
            const evs = await Promise.all(
              prop.evidenceIds.map((eid) => demoRepository.getEvidence(eid))
            );
            setEvidenceList(evs.filter((e): e is Evidence => e !== null));
          }

          if (currentUser) {
            const reflList = await demoRepository.getReflections(currentUser.id);
            setReflections(reflList.filter((r) => r.contextId === prop.assemblyId || r.contextId === prop.id));
          }
        }
      } catch (err) {
        console.error('Failed to load proposition', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser, refreshKey]);

  const handleFinalise = async (outcome: PropositionOutcome) => {
    if (!proposition || !currentUser) return;
    setIsFinalising(true);
    setFinaliseError(null);
    try {
      await demoRepository.finaliseProposition({
        propositionId: proposition.id,
        assemblyId: proposition.assemblyId,
        outcome,
        updatedBy: currentUser.name,
        changesSummary: `Final outcome resolved to ${outcome} by ${currentUser.name}`,
      });
      triggerRefresh();
    } catch (err: any) {
      console.error('Failed to finalise proposition', err);
      setFinaliseError(err?.message || 'Proposition already finalised or failed to update.');
    } finally {
      setIsFinalising(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposition || !currentUser) return;
    setIsSavingEdit(true);
    try {
      const updated = await demoRepository.updateProposition({
        propositionId: proposition.id,
        updatedBy: currentUser.name,
        changesSummary: editSummary.trim() || `Amended structured proposition specifications to v${proposition.version + 1}`,
        question: editQuestion.trim(),
        problem: editProblem.trim(),
        insight: editInsight.trim(),
        proposition: editProposition.trim(),
        enablers: editEnablers,
        risks: editRisks,
        nextStep: editNextStep.trim(),
        unresolvedQuestions: editUnresolved,
      });
      setProposition(updated);
      setIsEditing(false);
      setEditSummary('');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to save proposition updates', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddDissent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposition || !currentUser || !dissentReason.trim()) return;
    setIsAddingDissent(true);
    try {
      const newDissent: DissentRecord = {
        id: `dis_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        reason: dissentReason.trim(),
        suggestedAmendment: dissentAmendment.trim() || 'No amendment supplied.',
      };
      const updated = await demoRepository.updateProposition({
        propositionId: proposition.id,
        updatedBy: currentUser.name,
        changesSummary: `Recorded formal dissent by ${currentUser.name}`,
        dissent: [...proposition.dissent, newDissent],
      });
      setProposition(updated);
      setDissentReason('');
      setDissentAmendment('');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to add dissent', err);
    } finally {
      setIsAddingDissent(false);
    }
  };

  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposition || !currentUser || !reflectionText.trim()) return;
    setIsSubmittingReflection(true);
    try {
      await demoRepository.addReflection({
        userId: currentUser.id,
        contextType: 'assembly',
        contextId: proposition.assemblyId,
        prompt: 'Reflect on how this deliberative process balanced differing stakeholder perspectives and which ethical values guided the resolution.',
        text: reflectionText.trim(),
        valuesHighlighted: selectedValues,
        isPublicInPassport: true,
      });
      setReflectionSuccess(true);
      setReflectionText('');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to submit reflection', err);
    } finally {
      setIsSubmittingReflection(false);
    }
  };

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      setSelectedValues(selectedValues.filter((v) => v !== val));
    } else {
      setSelectedValues([...selectedValues, val]);
    }
  };

  if (isLoading || !proposition) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const isFinalised =
    proposition.revisions.some((r) => r.changesSummary?.toLowerCase().includes('final outcome resolved')) ||
    proposition.outcome === 'CONSENSUS' ||
    proposition.outcome === 'QUALIFIED_SUPPORT';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link to={`/assemblies/${proposition.assemblyId}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assembly Overview</span>
        </Link>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Edit3 className="w-3.5 h-3.5 mr-1 text-civic-indigo-600" />
              <span>Edit Proposition</span>
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-3.5 h-3.5 mr-1" />
              <span>Cancel Edit</span>
            </Button>
          )}

          <Link to={`/propositions/${proposition.id}/revisions`}>
            <Button size="sm" variant="outline">
              <History className="w-3.5 h-3.5 mr-1 text-slate-600" />
              <span>Revisions ({proposition.revisions.length})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <Card className="border-slate-200 p-6 sm:p-8 space-y-4 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2.5 py-0.5 rounded-full border border-civic-indigo-200">
              Civic Proposition v{proposition.version}
            </span>
            <span className="text-xs text-slate-400">
              Updated: {formatDate(proposition.updatedAt)}
            </span>
          </div>
          <span className={`text-xs px-3 py-1 rounded-md font-bold uppercase border ${
            proposition.outcome === 'CONSENSUS'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : proposition.outcome === 'QUALIFIED_SUPPORT'
              ? 'bg-civic-teal-100 text-civic-teal-900 border-civic-teal-300'
              : 'bg-amber-100 text-amber-900 border-amber-300'
          }`}>
            Outcome: {proposition.outcome.replace('_', ' ')}
          </span>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase">Core Question</span>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mt-0.5">
            {proposition.question}
          </h1>
        </div>

        {/* Support Profile Summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <span className="text-lg font-bold text-emerald-600">{proposition.supportProfile.stronglySupport}</span>
            <span className="text-[11px] text-slate-500 block">Strongly Support</span>
          </div>
          <div>
            <span className="text-lg font-bold text-civic-teal-600">{proposition.supportProfile.supportWithModifications}</span>
            <span className="text-[11px] text-slate-500 block">With Amendments</span>
          </div>
          <div>
            <span className="text-lg font-bold text-slate-600">{proposition.supportProfile.neutral}</span>
            <span className="text-[11px] text-slate-500 block">Neutral</span>
          </div>
          <div>
            <span className="text-lg font-bold text-rose-600">{proposition.dissent.length}</span>
            <span className="text-[11px] text-slate-500 block">Dissent Records</span>
          </div>
        </div>
      </Card>

      {/* EDIT MODE: Structured Proposition Editor */}
      {isEditing ? (
        <Card className="border-civic-indigo-200 p-6 space-y-5 bg-white">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-civic-indigo-600" />
              <span>Structured Proposition Editor (Drafting v{proposition.version + 1})</span>
            </h2>
          </div>

          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Deliberative Question:</label>
              <Input value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} required />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">1. Verified Problem & Ground Reality:</label>
              <Textarea value={editProblem} onChange={(e) => setEditProblem(e.target.value)} rows={3} required />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">2. Core Deliberative Insight:</label>
              <Textarea value={editInsight} onChange={(e) => setEditInsight(e.target.value)} rows={3} required />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">3. Proposed Proposition & Engineering Specifications:</label>
              <Textarea value={editProposition} onChange={(e) => setEditProposition(e.target.value)} rows={5} required />
            </div>

            {/* Enablers Management */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="font-bold text-emerald-800 block">Key Implementation Enablers:</label>
              <div className="space-y-1.5">
                {editEnablers.map((en, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-1.5 bg-white rounded border text-slate-700">
                    <span>&bull; {en}</span>
                    <button
                      type="button"
                      onClick={() => setEditEnablers(editEnablers.filter((_, idx) => idx !== i))}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Add enabler (e.g. Ward councillor discretionary fund co-financing)..."
                  value={newEnabler}
                  onChange={(e) => setNewEnabler(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    if (newEnabler.trim()) {
                      setEditEnablers([...editEnablers, newEnabler.trim()]);
                      setNewEnabler('');
                    }
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add</span>
                </Button>
              </div>
            </div>

            {/* Risks Management */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="font-bold text-amber-800 block">Identified Risks & Mitigations:</label>
              <div className="space-y-1.5">
                {editRisks.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-1.5 bg-white rounded border text-slate-700">
                    <span>&bull; {r}</span>
                    <button
                      type="button"
                      onClick={() => setEditRisks(editRisks.filter((_, idx) => idx !== i))}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Add risk & mitigation (e.g. Monsoon waterlogging risk mitigated by side channels)..."
                  value={newRisk}
                  onChange={(e) => setNewRisk(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    if (newRisk.trim()) {
                      setEditRisks([...editRisks, newRisk.trim()]);
                      setNewRisk('');
                    }
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add</span>
                </Button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Next Implementation Step:</label>
              <Input value={editNextStep} onChange={(e) => setEditNextStep(e.target.value)} required />
            </div>

            {/* Unresolved Questions */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="font-bold text-slate-800 block">Unresolved Questions for Municipal Committee:</label>
              <div className="space-y-1.5">
                {editUnresolved.map((q, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-1.5 bg-white rounded border text-slate-700">
                    <span>&bull; {q}</span>
                    <button
                      type="button"
                      onClick={() => setEditUnresolved(editUnresolved.filter((_, idx) => idx !== i))}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Add unresolved question..."
                  value={newUnresolved}
                  onChange={(e) => setNewUnresolved(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    if (newUnresolved.trim()) {
                      setEditUnresolved([...editUnresolved, newUnresolved.trim()]);
                      setNewUnresolved('');
                    }
                  }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add</span>
                </Button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Revision Changes Summary:</label>
              <Input
                placeholder="e.g. Updated ramp slope standards and added municipal budget enabler"
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" type="submit" isLoading={isSavingEdit}>
                <Save className="w-3.5 h-3.5 mr-1" />
                <span>Save Revision (v{proposition.version + 1})</span>
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* VIEW MODE: Structured Sections */
        <div className="space-y-4">
          {/* Problem Statement */}
          <Card className="border-slate-200 p-5 space-y-2 bg-white">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Problem & Verified Ground Reality
            </h2>
            <p className="text-sm text-slate-800 leading-relaxed">{proposition.problem}</p>
          </Card>

          {/* Core Insight */}
          <Card className="border-slate-200 p-5 space-y-2 bg-white">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Core Deliberative Insight
            </h2>
            <p className="text-sm text-slate-800 leading-relaxed">{proposition.insight}</p>
          </Card>

          {/* Proposed Proposition */}
          <Card className="border-civic-teal-200 bg-civic-teal-50/20 p-5 space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-civic-teal-800">
              3. Proposed Action & Engineering Specifications
            </h2>
            <div className="text-sm text-slate-900 leading-relaxed whitespace-pre-line font-medium">
              {proposition.proposition}
            </div>
          </Card>

          {/* Enablers & Risks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-slate-200 p-5 space-y-2 bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Key Implementation Enablers
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {proposition.enablers.map((en, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500">&bull;</span>
                    <span>{en}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="border-slate-200 p-5 space-y-2 bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Identified Risks & Mitigations
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {proposition.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500">&bull;</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Next Step & Unresolved Questions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-slate-200 p-5 space-y-2 bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-civic-indigo-800">
                Next Implementation Step
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">{proposition.nextStep}</p>
            </Card>

            <Card className="border-slate-200 p-5 space-y-2 bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Unresolved Questions for Nagar Nigam
              </h3>
              <ul className="space-y-1 text-xs text-slate-700">
                {proposition.unresolvedQuestions.map((uq, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-slate-400">&bull;</span>
                    <span>{uq}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Traceable Cites Evidence Pool */}
          {evidenceList.length > 0 && (
            <Card className="border-slate-200 p-5 space-y-3 bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-civic-teal-600" />
                <span>Cited Field Evidence ({evidenceList.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {evidenceList.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-civic-teal-800 font-bold bg-civic-teal-50 px-1.5 py-0.2 rounded border border-civic-teal-200">
                        {ev.id}
                      </span>
                      <StatusChip status={ev.verificationStatus} />
                    </div>
                    <h4 className="font-bold text-slate-900">{ev.title}</h4>
                    <p className="text-[11px] text-slate-600">{ev.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Preserved Dissent Records */}
          <Card className="border-slate-200 p-5 space-y-3 bg-white">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-civic-indigo-600" />
              <span>Preserved Dissent Records ({proposition.dissent.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Minority viewpoints and amendment requests preserved to protect democratic transparency.
            </p>

            <div className="space-y-2">
              {proposition.dissent.map((d) => (
                <div key={d.id} className="p-3 rounded-lg bg-rose-50/40 border border-rose-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>Dissent by: {d.userName}</span>
                  </div>
                  <p className="text-slate-700 italic">"{d.reason}"</p>
                  <div className="pt-1 text-[11px] text-civic-indigo-700">
                    <strong>Suggested Amendment:</strong> {d.suggestedAmendment}
                  </div>
                </div>
              ))}
            </div>

            {/* Form to add dissent */}
            <form onSubmit={handleAddDissent} className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Record Chamber Dissent Record:</span>
              <Input
                placeholder="Reason for dissent or objection..."
                value={dissentReason}
                onChange={(e) => setDissentReason(e.target.value)}
                required
              />
              <Input
                placeholder="Suggested amendment to address your concern..."
                value={dissentAmendment}
                onChange={(e) => setDissentAmendment(e.target.value)}
              />
              <div className="flex justify-end">
                <Button size="sm" variant="outline" type="submit" isLoading={isAddingDissent}>
                  <span>Record Dissent</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Outcome Finalisation Controls */}
          <Card className="border-civic-saffron-200 bg-civic-saffron-50/40 p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-saffron-900 block">
              Chamber Outcome Resolution
            </span>

            {isFinalised ? (
              <div className="p-3.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Chamber resolution finalised as <strong>{proposition.outcome}</strong> (v{proposition.version}). Outcome is locked against duplicate finalisation.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Select and finalise the proposition outcome after chamber voting. This locks the resolution, alerts all delegates, and records verified Deliberation credits.
                </p>

                {finaliseError && (
                  <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {finaliseError}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['CONSENSUS', 'QUALIFIED_SUPPORT', 'SPLIT_DECISION', 'INSUFFICIENT_BASIS'] as PropositionOutcome[]).map((oc) => (
                    <Button
                      key={oc}
                      size="sm"
                      variant={oc === 'CONSENSUS' ? 'primary' : oc === 'QUALIFIED_SUPPORT' ? 'teal' : 'outline'}
                      isLoading={isFinalising}
                      onClick={() => handleFinalise(oc)}
                      className="text-[11px]"
                    >
                      {oc.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Post-Outcome Reflection */}
          <Card className="border-civic-indigo-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-civic-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-civic-indigo-600" />
                <span>Post-Outcome Civic & Ethical Reflection</span>
              </h3>
              <span className="text-[10px] font-bold text-civic-indigo-700 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-200">
                +5 Reflection Credits
              </span>
            </div>

            {reflectionSuccess ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <span>Reflection recorded! +5 Reflection credits have been saved to your Civic Passport.</span>
                <Link to="/passport">
                  <Button size="sm" variant="teal">View Passport</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitReflection} className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Reflect on the deliberative process, how disagreements were synthesised, and what universal values guided the resolution:
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Trust (Vishwas)',
                    'Empathy (Samvedana)',
                    'Evidence-First',
                    'Universal Safety',
                    'Civic Responsibility',
                  ].map((val) => {
                    const isSel = selectedValues.includes(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => toggleValue(val)}
                        className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                          isSel
                            ? 'bg-civic-indigo-600 text-white border-civic-indigo-700 font-semibold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        #{val}
                      </button>
                    );
                  })}
                </div>

                <Textarea
                  placeholder="Share your reflective takeaways from this chamber deliberation..."
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  rows={3}
                  required
                />

                <div className="flex justify-end">
                  <Button size="sm" variant="teal" type="submit" isLoading={isSubmittingReflection}>
                    <span>Save Reflection (+5 Credits)</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </form>
            )}

            {/* Past reflections */}
            {reflections.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Recorded Reflections in Passport
                </span>
                {reflections.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <p className="text-slate-800 italic">"{r.text}"</p>
                    <div className="flex gap-1 pt-1">
                      {r.valuesHighlighted.map((v) => (
                        <span key={v} className="text-[10px] text-civic-indigo-700 font-semibold">#{v}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

