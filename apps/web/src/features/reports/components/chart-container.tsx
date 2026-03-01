import type { ReactNode } from 'react';

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  description?: string;
}

export function ChartContainer({
  title,
  children,
  description,
}: ChartContainerProps) {
  return (
    <section className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <div className="h-64 w-full">{children}</div>
    </section>
  );
}

