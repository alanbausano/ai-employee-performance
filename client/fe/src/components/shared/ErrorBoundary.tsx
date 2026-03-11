import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            gap: 1,
            color: 'text.secondary',
          }}
        >
          <ErrorOutlineIcon color="error" sx={{ fontSize: 36 }} />
          <Typography variant="subtitle2" color="error">
            {this.props.fallbackMessage ?? 'Something went wrong'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {this.state.error?.message}
          </Typography>
          <Button size="small" variant="outlined" onClick={this.handleReset}>
            Try again
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
