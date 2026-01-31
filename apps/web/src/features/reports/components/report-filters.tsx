'use client';

import type { ReportQuery, ReportType, GroupByOption } from '@/lib/api/reports';
import { DateRangePicker } from './date-range-picker';

interface ReportFiltersProps {
  query: ReportQuery;
  onQueryChange: (q: ReportQuery) => void;
  showGroupBy?: boolean;
  showStoreFilter?: boolean;
  storeOptions?: { id: number; name: string }[];
  className?: string;
}

const GROUP_BY_OPTIONS: { value: GroupByOption; label: string }[] = [
  { value: 'day', label: 'By day' },
  { value: 'week', label: 'By week' },
  { value: 'month', label: 'By month' },
];

export function ReportFilters({
  query,
  onQueryChange,
  showGroupBy = true,
  showStoreFilter = false,
  storeOptions = [],
  className = '',
}: ReportFiltersProps) {
  const set = (partial: Partial<ReportQuery>) =>
    onQueryChange({ ...query, ...partial });

  return (
    <div className={`flex flex-wrap items-end gap-4 ${className}`}>
      <DateRangePicker
        dateFrom={query.dateFrom ?? ''}
        dateTo={query.dateTo ?? ''}
        onDateFromChange={(v) => set({ dateFrom: v || undefined })}
        onDateToChange={(v) => set({ dateTo: v || undefined })}
      />
      {showGroupBy && (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Group by</span>
          <select
            value={query.groupBy ?? 'day'}
            onChange={(e) => set({ groupBy: e.target.value as GroupByOption })}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
          >
            {GROUP_BY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {showStoreFilter && storeOptions.length > 0 && (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Store</span>
          <select
            value={query.storeId ?? ''}
            onChange={(e) =>
              set({ storeId: e.target.value ? Number(e.target.value) : undefined })
            }
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All stores</option>
            {storeOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
