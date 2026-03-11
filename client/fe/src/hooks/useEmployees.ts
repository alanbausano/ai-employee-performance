import { useInfiniteQuery } from '@tanstack/react-query';
import { getEmployees, type Employee } from '../api/employees';

export interface EmployeeFilter {
  teams?: string[];
  accountTypes?: string[];
  trackingStatuses?: string[];
  trackingCategories?: string[];
}

export function useEmployees(search: string, filter: EmployeeFilter) {
  return useInfiniteQuery({
    queryKey: ['employees', search, filter],
    queryFn: async ({ pageParam: _pageParam }) => {
      const response = await getEmployees();
      let filtered: Employee[] = response.edges.map(e => e.node);

      // Simple in-memory search
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(e => 
          e.name?.toLowerCase().includes(s) || 
          e.uid.toLowerCase().includes(s) || 
          e.email?.toLowerCase().includes(s)
        );
      }

      // Simple in-memory filtering
      if (filter.teams && filter.teams.length > 0) {
        filtered = filtered.filter(e => e.teams.some(t => filter.teams?.includes(t.uid)));
      }
      if (filter.trackingStatuses && filter.trackingStatuses.length > 0) {
        filtered = filtered.filter(e => filter.trackingStatuses?.includes(e.trackingStatus));
      }
      if (filter.trackingCategories && filter.trackingCategories.length > 0) {
        filtered = filtered.filter(e => e.trackingCategory && filter.trackingCategories?.includes(e.trackingCategory));
      }

      return {
        edges: filtered.map(node => ({ node, cursor: btoa(node.id) })),
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null,
        },
        totalCount: filtered.length,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: () => undefined,
  });
}
