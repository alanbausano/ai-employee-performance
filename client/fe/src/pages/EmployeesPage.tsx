import { useState, useCallback } from 'react';
import {
  Box, Typography, Snackbar, Alert,
  Breadcrumbs, Link,
} from '@mui/material';
import { useEmployees, type EmployeeFilter } from '../hooks/useEmployees';
import { type Employee } from '../api/employees';
import { useTelemetry } from '../hooks/useTelemetry';
import { SearchBar } from '../components/employees/SearchBar';
import { EmployeeFilters } from '../components/employees/EmployeeFilters';
import { EmployeeTable } from '../components/employees/EmployeeTable';
import { PaginationBar } from '../components/employees/PaginationBar';
import { EmployeeDrawer } from '../components/detail/EmployeeDrawer';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';

const DEFAULT_PAGE_SIZE = 10;

export function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<EmployeeFilter>({});
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);

  const { track } = useTelemetry();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
  } = useEmployees(search, filter);

  // Flatten all loaded pages; we'll show just one page at a time
  const allEdges = data?.pages.flatMap((p) => p.edges) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // Current page slice
  const pageStart = currentPageIndex * pageSize;
  const currentEmployees = allEdges.slice(pageStart, pageStart + pageSize).map((e) => e.node);

  const currentPageInfo = data?.pages[data.pages.length - 1]?.pageInfo;
  const hasNextPage = currentPageInfo?.hasNextPage ?? false;
  const hasPreviousPage = currentPageIndex > 0;

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setCurrentPageIndex(0);
    track({ type: 'search_performed', query: value });
  }, [track]);

  const handleFilterChange = useCallback((newFilter: EmployeeFilter) => {
    setFilter(newFilter);
    setCurrentPageIndex(0);
    const activeKeys = Object.entries(newFilter)
      .filter(([, v]) => v && (v as string[]).length > 0)
      .map(([k]) => k);
    if (activeKeys.length > 0) {
      track({ type: 'filter_applied', filter: activeKeys.join(','), value: JSON.stringify(newFilter) });
    }
  }, [track]);

  const handleNext = useCallback(async () => {
    const nextIndex = currentPageIndex + 1;
    // Fetch new data if we need more pages
    if (nextIndex >= (data?.pages.length ?? 0)) {
      const result = await fetchNextPage();
      if (result.isError) {
        const status = (result.error as { response?: { status?: number } })?.response?.status;
        if (status === 429) {
          setRateLimitMsg('Rate limit reached. Please slow down and try again shortly.');
          return;
        }
      }
    }
    setCurrentPageIndex(nextIndex);
  }, [currentPageIndex, data?.pages.length, fetchNextPage]);

  const handlePrev = useCallback(() => {
    setCurrentPageIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleView = useCallback((emp: Employee) => {
    setSelectedEmployee(emp);
    track({ type: 'employee_viewed', employeeId: emp.id });
  }, [track]);

  // Report 5xx errors to console (could feed telemetry)
  const httpError = error as { response?: { status?: number } } | null;
  const isRateLimited = httpError?.response?.status === 429;

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs separator="›" sx={{ mb: 2, fontSize: '0.8rem' }}>
        <Link underline="hover" color="inherit" href="#">Admin Settings</Link>
        <Link underline="hover" color="inherit" href="#">Organization Setup</Link>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>Employees Page</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 0.5 }}>Employees</Typography>
        <Typography variant="body2" color="text.secondary">
          Easily assign employees to teams, include them for tracking in team productivity status, and manage their connected accounts.
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <SearchBar onSearch={handleSearch} />
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 2 }}>
        <EmployeeFilters filter={filter} onChange={handleFilterChange} />
      </Box>

      {/* Table + Pagination */}
      <ErrorBoundary fallbackMessage="The employee table encountered an error.">
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}>
          <EmployeeTable
            employees={currentEmployees}
            isLoading={isLoading || isFetchingNextPage}
            isError={isError && !isRateLimited}
            onRetry={refetch}
            onView={handleView}
            selectedId={selectedEmployee?.id ?? null}
          />
          {!isLoading && !isError && (
            <PaginationBar
              page={currentPageIndex}
              pageSize={pageSize}
              totalCount={totalCount}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onNext={handleNext}
              onPrev={handlePrev}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPageIndex(0);
              }}
            />
          )}
        </Box>
      </ErrorBoundary>

      {/* Employee Detail Drawer */}
      <ErrorBoundary fallbackMessage="The employee panel encountered an error.">
        <EmployeeDrawer
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      </ErrorBoundary>

      {/* Rate-limit snackbar */}
      <Snackbar
        open={isRateLimited || !!rateLimitMsg}
        autoHideDuration={6000}
        onClose={() => setRateLimitMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={() => setRateLimitMsg(null)}>
          {rateLimitMsg ?? 'Too many requests — please wait a moment before trying again.'}
        </Alert>
      </Snackbar>
    </Box>
  );
}
