'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import type { User } from '@/lib/api/users';

interface DeactivateModalProps {
  user: User | null;
  onClose: () => void;
  onConfirm: (userId: string) => Promise<void>;
}

export function DeactivateModal({
  user,
  onClose,
  onConfirm,
}: DeactivateModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      await onConfirm(user.id);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${user.isActive ? 'deactivate' : 'activate'}`,
      );
    } finally {
      setLoading(false);
    }
  }

  const isDeactivate = user?.isActive ?? true;

  return (
    <Modal
      isOpen={user !== null}
      onClose={onClose}
      title={isDeactivate ? 'Deactivate User' : 'Activate User'}
    >
      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-red-600">{error}</div>
      )}
      <p className="text-gray-600">
        {isDeactivate ? (
          <>
            Are you sure you want to deactivate <strong>{user?.email}</strong>?
            The user will no longer be able to access the system.
          </>
        ) : (
          <>
            Are you sure you want to activate <strong>{user?.email}</strong>?
            The user will be able to access the system again.
          </>
        )}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={isDeactivate ? 'danger' : 'primary'}
          onClick={handleConfirm}
          loading={loading}
        >
          {isDeactivate ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </Modal>
  );
}
