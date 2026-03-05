import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Button, Avatar, Box, Typography, Alert, IconButton,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { Employee } from '../../hooks/useEmployees';
import { StatusBadge, TeamChips } from '../shared/StatusBadge';
import { AccountIcons } from './AccountIcons';
import { SkeletonTable } from '../shared/SkeletonTable';

interface Props {
  employees: Employee[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onView: (employee: Employee) => void;
  selectedId: string | null;
}

function EmployeeAvatar({ name, photoUrl }: { name: string | null; photoUrl: string | null }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <Avatar
      src={photoUrl ?? undefined}
      alt={name ?? ''}
      sx={{ width: 32, height: 32, fontSize: '0.7rem', bgcolor: '#bfdbfe', color: '#1e40af' }}
    >
      {initials}
    </Avatar>
  );
}

export function EmployeeTable({ employees, isLoading, isError, onRetry, onView, selectedId }: Props) {
  if (isLoading) return <SkeletonTable rows={5} />;

  if (isError) {
    return (
      <Alert
        severity="error"
        action={
          <IconButton size="small" color="inherit" onClick={onRetry}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        }
        sx={{ m: 2 }}
      >
        Failed to load employees. Check your connection and try again.
      </Alert>
    );
  }

  if (employees.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">No employees found matching your search or filters.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox size="small" disabled />
            </TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Tracking Status</TableCell>
            <TableCell>Teams</TableCell>
            <TableCell>Accounts Connected</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {employees.map((emp) => (
            <TableRow
              key={emp.id}
              selected={emp.id === selectedId}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell padding="checkbox">
                <Checkbox size="small" />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmployeeAvatar name={emp.name} photoUrl={emp.photoUrl} />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: 'primary.main', lineHeight: 1.3 }}
                    >
                      {emp.name ?? emp.uid}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {emp.email ?? ''}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <StatusBadge
                  trackingStatus={emp.trackingStatus}
                  trackingCategory={emp.trackingCategory}
                />
              </TableCell>
              <TableCell>
                <TeamChips teams={emp.teams} />
              </TableCell>
              <TableCell>
                <AccountIcons accounts={emp.accounts} />
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onView(emp)}
                  sx={{
                    fontSize: '0.75rem',
                    py: 0.25,
                    px: 1.5,
                    borderColor: '#e2e8f0',
                    color: 'text.primary',
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                  }}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
