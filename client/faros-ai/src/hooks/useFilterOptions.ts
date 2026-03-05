import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '../api/graphql';
import { GET_FILTER_OPTIONS } from '../api/employees';

export interface FilterOptions {
  teams: { uid: string; name: string }[];
  trackingStatuses: string[];
  trackingCategories: string[];
  accountTypes: { type: string; source: string }[];
}

interface FilterOptionsResponse {
  filterOptions: FilterOptions;
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['filterOptions'],
    queryFn: async () => {
      const data = await gqlClient.request<FilterOptionsResponse>(GET_FILTER_OPTIONS);
      return data.filterOptions;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes — filter options rarely change
  });
}
