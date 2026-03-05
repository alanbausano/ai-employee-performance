import { useInfiniteQuery } from '@tanstack/react-query';
import { gqlClient } from '../api/graphql';
import { GET_EMPLOYEES } from '../api/employees';

export interface Employee {
  id: string;
  uid: string;
  name: string | null;
  email: string | null;
  photoUrl: string | null;
  inactive: boolean;
  trackingStatus: string | null;
  trackingCategory: string | null;
  teams: { id: string; uid: string; name: string }[];
  accounts: { type: string; source: string; uid: string }[];
}

export interface EmployeeFilter {
  teams?: string[];
  accountTypes?: string[];
  trackingStatuses?: string[];
  trackingCategories?: string[];
}

export interface EmployeesQueryResponse {
  employees: {
    edges: { cursor: string; node: Employee }[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      endCursor: string | null;
      startCursor: string | null;
    };
    totalCount: number;
  };
}

const PAGE_SIZE = 10;

export function useEmployees(search: string, filter: EmployeeFilter) {
  return useInfiniteQuery({
    queryKey: ['employees', search, filter],
    queryFn: async ({ pageParam }) => {
      const data = await gqlClient.request<EmployeesQueryResponse>(GET_EMPLOYEES, {
        first: PAGE_SIZE,
        after: pageParam ?? undefined,
        search: search || undefined,
        filter:
          Object.values(filter).some((v) => v && v.length > 0)
            ? filter
            : undefined,
      });
      return data.employees;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}
