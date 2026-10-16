import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Layers, X, AlertTriangle } from 'lucide-react';

interface DebateCapacityModalProps {
  roleName: string | null;
  currentCapacity: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (capacity: number) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

export const DebateCapacityModal: React.FC<DebateCapacityModalProps> = ({
  roleName,
  currentCapacity,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const [capacity, setCapacity] = useState(currentCapacity || 1);

  useEffect(() => {
    if (isOpen) {
      setCapacity(currentCapacity || 1);
    }
  }, [isOpen, currentCapacity]);

  if (!isOpen || !roleName) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (capacity < 1) return;
    await onSubmit(capacity);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      data-testid="debate-capacity-modal"
    >
      <Card className="max-w-md w-full bg-white p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-civic-indigo-600" />
            <h3 className="text-base font-bold font-heading text-slate-900">
              Update Capacity: {roleName}
            </h3>
          </div>
          <Button size="sm" variant="outline" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Changing capacity recalculates the 33% quota ({' '}
            <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">
              ceil(0.33 &times; capacity)
            </code>
            ). Any existing Platform Owner exception for this role will be immediately invalidated and reverted to pending status.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="capacity-number-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Planned Places (Minimum: 1)
            </label>
            <input
              id="capacity-number-input"
              type="number"
              min={1}
              max={20}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500 bg-white"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 1)}
              data-testid="capacity-number-input"
              required
            />
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <div>Resulting 33% Reserved Minimum: <strong>{Math.ceil(0.33 * capacity)}</strong></div>
            <div>Resulting Ordinary Places: <strong>{Math.max(0, capacity - Math.ceil(0.33 * capacity))}</strong></div>
          </div>

          {error && (
            <div
              className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs"
              data-testid="debate-capacity-error"
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={onClose}
              data-testid="cancel-debate-capacity-btn"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              disabled={isSubmitting || capacity < 1}
              className="bg-civic-indigo-600 hover:bg-civic-indigo-700 text-white"
              data-testid="submit-debate-capacity-btn"
            >
              {isSubmitting ? 'Updating...' : 'Update Capacity'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
