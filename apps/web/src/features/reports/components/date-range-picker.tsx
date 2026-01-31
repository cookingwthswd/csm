'use client';

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  className?: string;
}

export function DateRangePicker({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  className = '',
}: DateRangePickerProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <label className="flex items-center gap-2">
        <span className="text-sm text-gray-600">From</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
      </label>
      <label className="flex items-center gap-2">
        <span className="text-sm text-gray-600">To</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
        />
      </label>
    </div>
  );
}
