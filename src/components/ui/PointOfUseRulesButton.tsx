import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Scale, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

export interface ContextualRuleItem {
  title: string;
  description: string;
}

export interface PointOfUseRulesButtonProps {
  moduleName: string;
  triggerText?: string;
  modalTitle?: string;
  description?: string;
  rules: ContextualRuleItem[];
  hasSeatQuotaRule?: boolean;
  quotaContext?: string;
  fullRulebookLink?: string;
  variant?: 'outline' | 'ghost' | 'secondary' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  testId?: string;
}

export const PointOfUseRulesButton: React.FC<PointOfUseRulesButtonProps> = ({
  moduleName,
  triggerText = 'Rules',
  modalTitle,
  description,
  rules,
  hasSeatQuotaRule = false,
  quotaContext,
  fullRulebookLink = '/help',
  variant = 'outline',
  size = 'sm',
  className = '',
  testId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const titleText = modalTitle || `${moduleName} Rules`;
  const buttonTestId = testId || `rules-btn-${moduleName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`View ${moduleName} rules`}
        data-testid={buttonTestId}
      >
        <BookOpen className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
        <span>{triggerText}</span>
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={titleText}
        description={description || `Applicable operating standards and guidelines for ${moduleName}.`}
        maxWidth="lg"
        footer={
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <Link
              to={fullRulebookLink}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 font-semibold text-civic-indigo-700 hover:text-civic-indigo-900 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 rounded py-1"
              data-testid="link-to-full-rulebook"
            >
              <span>Open Full Rulebook Index</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(false)}
              data-testid="close-rules-modal-btn"
            >
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-700" data-testid="point-of-use-rules-modal-body">
          {/* 33% Platform Representation Rule - ONLY rendered when limited seats or named roles are allocated */}
          {hasSeatQuotaRule && (
            <div
              className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2 shadow-2xs"
              data-testid="rules-seat-quota-section"
            >
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-amber-900">
                <Scale className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                <span>33% Platform Representation Rule {quotaContext ? `(${quotaContext})` : ''}</span>
              </div>
              <p className="leading-relaxed text-slate-700">
                <strong>Platform Policy:</strong> At least one-third of limited seats and named roles are reserved for women, calculated as <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold text-slate-900">ceil(0.33 &times; places)</code> separately for each allocation without cross-cohort pooling.
              </p>
              <p className="leading-relaxed text-slate-700">
                <strong>Vacancy Default:</strong> If insufficient eligible candidates register or apply, unfilled reserved places remain <strong>vacant by default</strong>. General candidates cannot take reserved vacancies without an owner-approved, audited exception. This simulation rule is a platform policy rather than statutory legislation.
              </p>
            </div>
          )}

          {/* Module-specific Rules */}
          <div className="space-y-2.5">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                data-testid={`rule-item-${idx}`}
              >
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-civic-teal-600 shrink-0" aria-hidden="true" />
                  <span>{rule.title}</span>
                </h4>
                <p className="text-slate-600 leading-relaxed pl-5">{rule.description}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-slate-100/70 border border-slate-200 text-[11px] text-slate-500">
            For complete procedural charters, deliberative standing orders, and verification criteria, explore the full rulebook.
          </div>
        </div>
      </Modal>
    </>
  );
};
