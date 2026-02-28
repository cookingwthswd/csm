"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import type {
  DeliveryReport,
  InventoryReport,
  OrdersReport,
  ProductionReport,
  ReportQuery,
  ReportType,
} from '@repo/types';

function createInitialQuery(partial?: Partial<ReportQuery>): ReportQuery {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);

  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

  return {
    type: partial?.type,
    dateFrom: partial?.dateFrom ?? toIsoDate(start),
    dateTo: partial?.dateTo ?? toIsoDate(end),
    storeId: partial?.storeId,
    groupBy: partial?.groupBy ?? 'day',
    search: partial?.search,
  };
}

type ReportData =
  | OrdersReport
  | ProductionReport
  | InventoryReport
  | DeliveryReport;

export function useReport(type: ReportType, initial?: Partial<ReportQuery>) {
  const [query, setQuery] = useState<ReportQuery>(
    createInitialQuery({ ...initial, type }),
  );

  const result = useQuery<ReportData>({
    queryKey: ['report', type, query],
    queryFn: () => {
      switch (type) {
        case 'orders':
          return reportsApi.getOrdersReport({ ...query, type }) as Promise<
            ReportData
          >;
        case 'production':
          return reportsApi.getProductionReport({ ...query, type }) as Promise<
            ReportData
          >;
        case 'inventory':
          return reportsApi.getInventoryReport({ ...query, type }) as Promise<
            ReportData
          >;
        case 'delivery':
          return reportsApi.getDeliveryReport({ ...query, type }) as Promise<
            ReportData
          >;
        default:
          return Promise.resolve({} as ReportData);
      }
    },
  });

  return {
    query,
    setQuery,
    ...result,
  };
}

