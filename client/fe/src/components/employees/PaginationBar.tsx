import { Box, Select, MenuItem, IconButton, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface PaginationBarProps {
  page: number;           // 0-indexed
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNext: () => void;
  onPrev: () => void;
  onPageSizeChange: (size: number) => void;
}

export function PaginationBar({
  page,
  pageSize,
  totalCount,
  hasNextPage,
  hasPreviousPage,
  onNext,
  onPrev,
  onPageSizeChange,
}: PaginationBarProps) {
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalCount);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 1,
        py: 1.5,
        px: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Select
        value={pageSize}
        size="small"
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        sx={{ fontSize: '0.8rem', height: 30 }}
      >
        {[5, 10, 20, 50].map((n) => (
          <MenuItem key={n} value={n} sx={{ fontSize: '0.8rem' }}>
            {n} / page
          </MenuItem>
        ))}
      </Select>

      <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
        {totalCount === 0 ? '0' : `${start}–${end}`} of {totalCount}
      </Typography>

      <IconButton size="small" onClick={onPrev} disabled={!hasPreviousPage}>
        <ChevronLeftIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={onNext} disabled={!hasNextPage}>
        <ChevronRightIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
