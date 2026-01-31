'use client';

import { ReactNode } from 'react';

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ChartContainer({ title, children, className = '' }: ChartContainerProps) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="mb-4 text-sm font-semibold text-gray-700">{title}</h3>
      <div className="h-64 w-full min-w-0">{children}</div>
    </div>
  );
}
