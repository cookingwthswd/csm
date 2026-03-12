'use client';

import { useEffect, useState } from 'react';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
} from '@/lib/api/notifications';
import type { NotificationSettings } from '@repo/types';

export function NotificationSettingsForm() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetchNotificationSettings()
      .then((s) => {
        setSettings(s);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function toggle(key: keyof Omit<NotificationSettings, 'userId'>) {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await updateNotificationSettings({ [key]: !settings[key] });
      setSettings(updated);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) {
    return <p className="text-gray-500">Dang tai...</p>;
  }

  if (!settings) {
    return <p className="text-gray-500">Khong the tai cai dat thong bao</p>;
  }

  const rows: { key: keyof Omit<NotificationSettings, 'userId'>; label: string; desc: string }[] = [
    { key: 'emailEnabled', label: 'Email', desc: 'Nhan thong bao qua email' },
    { key: 'pushEnabled', label: 'Push', desc: 'Thong bao day tren trinh duyet' },
    { key: 'orderUpdates', label: 'Don hang', desc: 'Thong bao khi co don hang moi hoac cap nhat' },
    { key: 'stockAlerts', label: 'Ton kho', desc: 'Canh bao khi ton kho thap' },
    { key: 'deliveryUpdates', label: 'Giao hang', desc: 'Cap nhat tinh trang giao hang' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Cai dat thong bao</h1>
      <div className="rounded-lg border bg-white shadow-sm divide-y">
        {rows.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <button
              disabled={saving}
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings[key] ? 'bg-blue-600' : 'bg-gray-200'
              } ${saving ? 'opacity-50' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  settings[key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
