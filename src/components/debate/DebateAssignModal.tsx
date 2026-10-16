import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { UserCheck, X } from 'lucide-react';
import { User } from '../../types/domain';

interface DebateAssignModalProps {
  roleName: string | null;
  currentOccupantName?: string;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userId: string) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

export const DebateAssignModal: React.FC<DebateAssignModalProps> = ({
  roleName,
  currentOccupantName,
  users,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId(users[0]?.id || '');
    }
  }, [isOpen, users]);

  if (!isOpen || !roleName) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    await onSubmit(selectedUserId);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      data-testid="debate-assign-modal"
    >
      <Card className="max-w-md w-full bg-white p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-civic-indigo-600" />
            <h3 className="text-base font-bold font-heading text-slate-900">
              Assign / Replace: {roleName}
            </h3>
          </div>
          <Button size="sm" variant="outline" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-xs text-slate-600 space-y-2">
          {currentOccupantName ? (
            <p>
              Current occupant: <strong className="text-slate-800">{currentOccupantName}</strong>. Selecting a different candidate will replace the existing occupant.
            </p>
          ) : (
            <p>
              This role is currently <span className="font-semibold text-amber-800">vacant</span>.
            </p>
          )}
          <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
            Policy Notice: If this role holds a reserved vacancy, ordinary candidates cannot be assigned without an approved Platform Owner exception.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="assign-user-select"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Select Candidate
            </label>
            <select
              id="assign-user-select"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500 bg-white"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              data-testid="assign-user-select"
              required
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div
              className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs"
              data-testid="debate-assign-error"
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
              data-testid="cancel-debate-assign-btn"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              disabled={isSubmitting || !selectedUserId}
              className="bg-civic-indigo-600 hover:bg-civic-indigo-700 text-white"
              data-testid="submit-debate-assign-btn"
            >
              {isSubmitting ? 'Assigning...' : 'Confirm Candidate'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
