import { useQuery } from '@tanstack/react-query';
import { dashboardApi, type DashboardPeriod } from '@/api/dashboard';

export function useDashboardSummary(period: DashboardPeriod = 'week') {
  return useQuery({
    queryKey: ['dashboard', 'summary', period],
    queryFn: () => dashboardApi.summary(period),
    staleTime: 60_000,
  });
}
