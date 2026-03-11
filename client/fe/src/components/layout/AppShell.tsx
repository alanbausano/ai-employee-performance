import { Box, AppBar, Toolbar, Typography } from '@mui/material';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: '52px !important' }}>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Employee Insights Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
