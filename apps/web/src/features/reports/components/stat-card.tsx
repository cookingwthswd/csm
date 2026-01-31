'use client';

export type StatCardStatus = 'default' | 'warning' | 'danger' | 'success';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  status?: StatCardStatus;
}

const statusClasses: Record<StatCardStatus, string> = {
  default: 'border-gray-200 bg-white',
  warning: 'border-amber-200 bg-amber-50',
  danger: 'border-red-200 bg-red-50',
  success: 'border-emerald-200 bg-emerald-50',
};

export function StatCard({ title, value, trend, status = 'default' }: StatCardProps) {
  return (
    <div
      className={`rounded-lg border p-6 shadow-sm ${statusClasses[status]}`}
    >
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-800 md:text-3xl">
        {value}
      </p>
      {trend != null && (
        <p className="mt-1 text-sm text-gray-500">{trend}</p>
      )}
    </div>
  );
}
