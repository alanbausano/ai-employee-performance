import { useQuery } from '@tanstack/react-query';
import { getFilterOptions } from '../api/employees';

export interface FilterOptions {
  teams: { uid: string; name: string }[];
  trackingStatuses: string[];
  trackingCategories: string[];
  accountTypes: { type: string; source: string }[];
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['filterOptions'],
    queryFn: async () => {
      const data = await getFilterOptions();
      return data.filterOptions;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — filter options rarely change
  });
}
