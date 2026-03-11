import {
  Table, TableBody, TableCell, TableHead, TableRow,
  Skeleton, Box,
} from '@mui/material';

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell width={40}><Skeleton width={16} height={16} /></TableCell>
          <TableCell>Name</TableCell>
          <TableCell>Tracking Status</TableCell>
          <TableCell>Teams</TableCell>
          <TableCell>Accounts Connected</TableCell>
          <TableCell width={80} />
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton width={16} height={16} /></TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="circular" width={32} height={32} />
                <Box>
                  <Skeleton width={120} height={14} />
                  <Skeleton width={90} height={12} sx={{ mt: 0.5 }} />
                </Box>
              </Box>
            </TableCell>
            <TableCell><Skeleton width={80} height={14} /></TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Skeleton width={70} height={22} sx={{ borderRadius: 1 }} />
                <Skeleton width={80} height={22} sx={{ borderRadius: 1 }} />
              </Box>
            </TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton variant="circular" width={20} height={20} />
              </Box>
            </TableCell>
            <TableCell><Skeleton width={48} height={28} sx={{ borderRadius: 1 }} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
