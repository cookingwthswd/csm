interface DateRange {
  dateFrom: string;
  dateTo: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <label className="flex items-center gap-1 text-gray-600">
        <span className="whitespace-nowrap">From</span>
        <input
          type="date"
          value={value.dateFrom}
          onChange={(e) =>
            onChange({
              ...value,
              dateFrom: e.target.value,
            })
          }
          className="rounded border px-2 py-1"
        />
      </label>

      <label className="flex items-center gap-1 text-gray-600">
        <span className="whitespace-nowrap">To</span>
        <input
          type="date"
          value={value.dateTo}
          onChange={(e) =>
            onChange({
              ...value,
              dateTo: e.target.value,
            })
          }
          className="rounded border px-2 py-1"
        />
      </label>
    </div>
  );
}

