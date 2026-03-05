import {
  Drawer, Box, Typography, IconButton, Divider, Chip,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { Employee } from '../../hooks/useEmployees';
import { AccountIcons } from '../employees/AccountIcons';
import { TeamChips } from '../shared/StatusBadge';
import { AIInsightsPanel } from './AIInsightsPanel';
import { useFeatureFlags } from '../../context/FeatureFlagContext';

const DRAWER_WIDTH = 340;

interface Props {
  employee: Employee | null;
  onClose: () => void;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem' }}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5, fontSize: '0.875rem' }}>
        {value}
      </Box>
    </Box>
  );
}

export function EmployeeDrawer({ employee, onClose }: Props) {
  const { aiInsightsEnabled } = useFeatureFlags();

  const trackingLabel = [employee?.trackingStatus, employee?.trackingCategory]
    .filter(Boolean)
    .join(' · ');

  const statusColor =
    employee?.trackingStatus === 'Included' ? 'success' :
    employee?.trackingStatus === 'Ignored' ? 'default' : 'default';

  return (
    <Drawer
      anchor="right"
      open={!!employee}
      onClose={onClose}
      variant="persistent"
      sx={{
        width: employee ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: 0,
          height: '100%',
          zIndex: (theme) => theme.zIndex.appBar + 1, // cover AppBar
        },
      }}
    >
      {employee && (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>
                {employee.name ?? employee.uid}
              </Typography>
              {trackingLabel && (
                <Chip
                  label={trackingLabel}
                  size="small"
                  color={statusColor}
                  sx={{ mt: 0.5, fontSize: '0.72rem', height: 22 }}
                />
              )}
            </Box>
            <Stack direction="row">
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <OpenInNewIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {/* Scrollable content */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.06em' }}>
              Profile Info
            </Typography>

            <InfoRow label="UID" value={<Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{employee.uid}</Typography>} />
            <InfoRow label="Name" value={<Typography variant="body2">{employee.name ?? '—'}</Typography>} />
            <InfoRow label="Email" value={<Typography variant="body2">{employee.email ?? '—'}</Typography>} />
            <InfoRow
              label="Teams"
              value={<TeamChips teams={employee.teams} />}
            />
            <InfoRow
              label="Accounts Connected"
              value={<AccountIcons accounts={employee.accounts} />}
            />

            <Divider sx={{ my: 2 }} />

            {/* AI Insights — feature-flagged */}
            {aiInsightsEnabled && (
              <AIInsightsPanel employeeId={employee.id} />
            )}
          </Box>

          {/* Footer */}
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
            <Box
              component="button"
              onClick={onClose}
              sx={{
                flex: 1, py: 0.75, border: '1px solid', borderColor: 'divider',
                borderRadius: 1, cursor: 'pointer', bgcolor: 'background.paper',
                fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 500,
                '&:hover': { bgcolor: '#f8fafc' },
              }}
            >
              Cancel
            </Box>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
