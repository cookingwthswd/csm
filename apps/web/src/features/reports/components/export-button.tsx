'use client';

import { useState } from 'react';
import type { ReportQuery, ReportType } from '@/lib/api/reports';
import { reportsApi } from '@/lib/api/reports';

interface ExportButtonProps {
  query: ReportQuery & { type?: ReportType };
  format?: 'csv' | 'pdf';
  label?: string;
  className?: string;
}

export function ExportButton({
  query,
  format = 'csv',
  label = 'Export',
  className = '',
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const blob = await reportsApi.downloadExport({ ...query, format });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const type = query.type ?? 'orders';
      a.download = `report-${type}-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? 'Exporting...' : label}
      </button>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
