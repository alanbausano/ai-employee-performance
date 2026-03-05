import { Box, Tooltip } from '@mui/material';

// Map account type → icon path
const ACCOUNT_ICONS: Record<string, { src: string; label: string }> = {
  vcs: { src: '/icons/github.png', label: 'GitHub' },
  tms: { src: '/icons/jira.png', label: 'Jira' },
  ims: { src: '/icons/pagerduty.png', label: 'PagerDuty' },
  cal: { src: '/icons/google-calendar.png', label: 'Google Calendar' },
};

interface Account {
  type: string;
  source: string;
  uid: string;
}

interface AccountIconsProps {
  accounts: Account[];
}

export function AccountIcons({ accounts }: AccountIconsProps) {
  if (accounts.length === 0) {
    return <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      {accounts.map((account) => {
        const icon = ACCOUNT_ICONS[account.type];
        if (!icon) {
          return (
            <Tooltip key={account.uid} title={account.source}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6rem',
                  color: '#64748b',
                  fontWeight: 700,
                }}
              >
                {account.source?.[0]?.toUpperCase() ?? '?'}
              </Box>
            </Tooltip>
          );
        }
        return (
          <Tooltip key={`${account.type}-${account.uid}`} title={`${icon.label} (${account.uid})`}>
            <img
              src={icon.src}
              alt={icon.label}
              width={20}
              height={20}
              style={{ objectFit: 'contain', borderRadius: 3 }}
              onError={(e) => {
                // Fallback if icon not found
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}
