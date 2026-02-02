'use client';

import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useAuthStore } from '@/lib/stores/auth.store';
import { usersApi } from '@/lib/api/users';
import { Button, Input } from '@/components/ui';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  ck_staff: 'Central Kitchen Staff',
  store_staff: 'Store Staff',
  coordinator: 'Coordinator',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-purple-100 text-purple-700',
  ck_staff: 'bg-orange-100 text-orange-700',
  store_staff: 'bg-blue-100 text-blue-700',
  coordinator: 'bg-green-100 text-green-700',
};

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const setProfile = useAuthStore((state) => state.setProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const updatedProfile = await usersApi.update(profile.id, {
        fullName: fullName || undefined,
        phone: phone || undefined,
      });
      // Update auth store with new profile data
      setProfile(updatedProfile);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setFullName(profile?.fullName || '');
    setPhone(profile?.phone || '');
    setIsEditing(false);
    setError(null);
  }

  if (!profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      {error && (
        <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded bg-green-50 p-3 text-sm text-green-600">
          {success}
        </div>
      )}

      <div className="mt-6 rounded-lg border bg-white p-6">
        {/* Profile Header */}
        <div className="flex items-start justify-between border-b pb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {profile.fullName || 'No name set'}
            </h2>
            <p className="text-gray-500">{user?.email}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              ROLE_COLORS[profile.role] || 'bg-gray-100'
            }`}
          >
            {ROLE_LABELS[profile.role] || profile.role}
          </span>
        </div>

        {/* Profile Details */}
        {isEditing ? (
          <form onSubmit={handleSubmit} className="mt-6">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
            <Input
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 0901234567"
              pattern="[0-9+\-\s]+"
            />

            <div className="mt-6 flex gap-3">
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Full Name
              </label>
              <p className="mt-1 text-gray-800">
                {profile.fullName || '-'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Email
              </label>
              <p className="mt-1 text-gray-800">{user?.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Phone
              </label>
              <p className="mt-1 text-gray-800">{profile.phone || '-'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Store
              </label>
              <p className="mt-1 text-gray-800">
                {profile.store?.name || 'Not assigned'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Status
              </label>
              <p className="mt-1">
                <span
                  className={`rounded px-2 py-1 text-xs ${
                    profile.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {profile.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
