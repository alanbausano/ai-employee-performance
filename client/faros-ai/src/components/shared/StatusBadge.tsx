import { Box, Chip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

interface StatusBadgeProps {
  trackingStatus: string | null;
  trackingCategory: string | null;
}

const STATUS_COLORS: Record<string, 'success' | 'default' | 'warning'> = {
  Included: 'success',
  Ignored: 'default',
};

export function StatusBadge({ trackingStatus, trackingCategory }: StatusBadgeProps) {
  const color = STATUS_COLORS[trackingStatus ?? ''] ?? 'default';
  const isInactive = trackingCategory === 'Inactive';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <PersonIcon
        sx={{
          fontSize: 18,
          color: isInactive
            ? 'error.main'
            : color === 'success'
            ? 'success.main'
            : 'text.disabled',
        }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b' }}>
          {trackingStatus ?? '—'}
        </span>
        {trackingCategory && (
          <span
            style={{
              fontSize: '0.75rem',
              color: isInactive ? '#ef4444' : '#64748b',
              fontWeight: isInactive ? 500 : 400,
            }}
          >
            {trackingCategory}
          </span>
        )}
      </Box>
    </Box>
  );
}

interface TeamChipsProps {
  teams: { uid: string; name: string }[];
}

const TEAM_COLOR_MAP: Record<string, string> = {
  Frontend: '#dbeafe', // blue
  Backend: '#fee2e2',  // red/red-100
  Security: '#fef9c3', // yellow
  Mobile: '#f3e8ff',   // purple
  Design: '#fce7f3',   // pink
  Data: '#dcfce7',     // green
  Infrastructure: '#ffedd5', // orange
};

const DEFAULT_CHIP_COLORS = [
  '#f1f5f9', // slate-100
  '#f8fafc', // slate-50
];

export function TeamChips({ teams }: TeamChipsProps) {
  if (teams.length === 0) return <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {teams.map((team, i) => {
        const bgColor = TEAM_COLOR_MAP[team.name] || DEFAULT_CHIP_COLORS[i % DEFAULT_CHIP_COLORS.length];
        return (
          <Chip
            key={`${team.uid}-${i}`}
            label={team.name}
            size="small"
            sx={{
              backgroundColor: bgColor,
              color: '#1e293b',
              fontWeight: 500,
              fontSize: '0.72rem',
              height: 22,
            }}
          />
        );
      })}
    </Box>
  );
}
