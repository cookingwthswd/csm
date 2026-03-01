interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  status?: 'default' | 'warning' | 'danger';
}

const statusClasses: Record<NonNullable<StatCardProps['status']>, string> = {
  default: 'border-gray-200',
  warning: 'border-yellow-300 bg-yellow-50',
  danger: 'border-red-300 bg-red-50',
};

export function StatCard({
  title,
  value,
  trend,
  status = 'default',
}: StatCardProps) {
  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm transition-colors ${statusClasses[status]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {title}
      </p>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {trend && (
          <span className="text-xs font-medium text-emerald-600">{trend}</span>
        )}
      </div>
    </div>
  );
}

