import type { ReportQuery, ReportType } from '@repo/types';

interface ExportButtonProps {
  type: ReportType;
  query: ReportQuery;
}

export function ExportButton({ type, query }: ExportButtonProps) {
  const handleExport = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) return;

    const search = new URLSearchParams();
    search.set('type', type);
    search.set('format', 'csv');
    if (query.dateFrom) search.set('dateFrom', query.dateFrom);
    if (query.dateTo) search.set('dateTo', query.dateTo);
    if (query.groupBy) search.set('groupBy', query.groupBy);
    if (query.storeId) search.set('storeId', String(query.storeId));
    if (query.search) search.set('search', query.search);

    const url = `${baseUrl}/reports/export?${search.toString()}`;
    window.open(url, '_blank');
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
    >
      Export CSV
    </button>
  );
}

