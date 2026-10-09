import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Proposition, Evidence, PropositionOutcome } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
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
} from 'lucide-react';

export const PropositionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [isFinalising, setIsFinalising] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const prop = await demoRepository.getProposition(id);
        setProposition(prop);

        if (prop?.evidenceIds.length) {
          const evs = await Promise.all(
            prop.evidenceIds.map((eid) => demoRepository.getEvidence(eid))
          );
          setEvidenceList(evs.filter((e): e is Evidence => e !== null));
        }
      } catch (err) {
        console.error('Failed to load proposition', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, refreshKey]);

  const handleFinalise = async (outcome: PropositionOutcome) => {
    if (!proposition || !currentUser) return;
    setIsFinalising(true);
    try {
      await demoRepository.finaliseProposition({
        propositionId: proposition.id,
        assemblyId: proposition.assemblyId,
        outcome,
        updatedBy: currentUser.name,
        changesSummary: `Final outcome resolved to ${outcome} by ${currentUser.name}`,
      });
      triggerRefresh();
    } catch (err) {
      console.error('Failed to finalise proposition', err);
    } finally {
      setIsFinalising(false);
    }
  };

  if (isLoading || !proposition) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const isFacilitator = currentUser?.role === 'facilitator' || currentUser?.role === 'programme_manager';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/assemblies" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assemblies</span>
      </Link>

      {/* Header */}
      <Card className="border-slate-200 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-700 bg-civic-indigo-50 px-2.5 py-0.5 rounded-full border border-civic-indigo-200">
              Civic Proposition v{proposition.version}
            </span>
            <Link to={`/propositions/${proposition.id}/revisions`} className="text-xs text-civic-indigo-600 font-medium hover:underline flex items-center gap-1">
              <History className="w-3.5 h-3.5" />
              <span>{proposition.revisions.length} Revisions</span>
            </Link>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md font-bold uppercase bg-civic-teal-100 text-civic-teal-800">
            Outcome: {proposition.outcome}
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

      {/* Structured Sections */}
      <div className="space-y-4">
        {/* Problem Statement */}
        <Card className="border-slate-200 p-5 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. Problem & Verified Ground Reality
          </h2>
          <p className="text-sm text-slate-800 leading-relaxed">{proposition.problem}</p>
        </Card>

        {/* Core Insight */}
        <Card className="border-slate-200 p-5 space-y-2">
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
          <Card className="border-slate-200 p-5 space-y-2">
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

          <Card className="border-slate-200 p-5 space-y-2">
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

        {/* Preserved Dissent Records */}
        <Card className="border-slate-200 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-civic-indigo-600" />
            <span>Preserved Dissent Records ({proposition.dissent.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Minority viewpoints and amendment requests preserved to protect democratic transparency.
          </p>

          <div className="space-y-2">
            {proposition.dissent.map((d) => (
              <div key={d.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Dissent by: {d.userName}</span>
                </div>
                <p className="text-slate-600 italic">"{d.reason}"</p>
                <div className="pt-1 text-[11px] text-civic-indigo-700">
                  <strong>Suggested Amendment:</strong> {d.suggestedAmendment}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Facilitator Finalisation Controls */}
        {isFacilitator && (
          <Card className="border-civic-saffron-200 bg-civic-saffron-50/40 p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-saffron-900 block">
              Facilitator Outcome Action
            </span>
            <p className="text-xs text-slate-600">
              Finalise the proposition outcome after the chamber vote to lock the resolution and sync to municipal deputation.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="primary"
                isLoading={isFinalising}
                onClick={() => handleFinalise('CONSENSUS')}
              >
                Declare Consensus
              </Button>
              <Button
                size="sm"
                variant="teal"
                isLoading={isFinalising}
                onClick={() => handleFinalise('QUALIFIED_SUPPORT')}
              >
                Declare Qualified Support
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
