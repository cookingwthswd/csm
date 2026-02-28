import type { ReportGroupBy, ReportQuery } from '@repo/types';
import { DateRangePicker } from './date-range-picker';

interface ReportFiltersProps {
  query: ReportQuery;
  onChange: (next: ReportQuery) => void;
  showGroupBy?: boolean;
}

const groupByOptions: { value: ReportGroupBy; label: string }[] = [
  { value: 'day', label: 'By day' },
  { value: 'week', label: 'By week' },
  { value: 'month', label: 'By month' },
];

export function ReportFilters({
  query,
  onChange,
  showGroupBy = true,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <DateRangePicker
        value={{ dateFrom: query.dateFrom, dateTo: query.dateTo }}
        onChange={(range) =>
          onChange({
            ...query,
            dateFrom: range.dateFrom,
            dateTo: range.dateTo,
          })
        }
      />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {showGroupBy && (
          <label className="flex items-center gap-1 text-gray-600">
            <span>Group by</span>
            <select
              value={query.groupBy}
              onChange={(e) =>
                onChange({
                  ...query,
                  groupBy: e.target.value as ReportGroupBy,
                })
              }
              className="rounded border px-2 py-1"
            >
              {groupByOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <input
          type="search"
          placeholder="Search..."
          value={query.search ?? ''}
          onChange={(e) =>
            onChange({
              ...query,
              search: e.target.value || undefined,
            })
          }
          className="min-w-[160px] rounded border px-2 py-1 text-sm"
        />
      </div>
    </div>
  );
}

