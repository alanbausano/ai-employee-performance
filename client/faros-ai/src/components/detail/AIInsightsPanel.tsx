import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Skeleton, Alert, Chip,
  LinearProgress, Tooltip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAIInsights, type InsightsStatus } from '../../hooks/useAIInsights';
import { useAIConsent } from '../../hooks/useAIConsent';
import { useTelemetry } from '../../hooks/useTelemetry';

interface Props {
  employeeId: string;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = confidence >= 0.7 ? 'success' : confidence >= 0.5 ? 'warning' : 'error';

  return (
    <Box sx={{ mt: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">Confidence</Typography>
        <Chip label={`${pct}%`} size="small" color={color} sx={{ height: 18, fontSize: '0.7rem' }} />
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color}
        sx={{ borderRadius: 4, height: 4 }}
      />
      {confidence < 0.5 && (
        <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />} sx={{ mt: 1, py: 0.25, fontSize: '0.75rem' }}>
          <strong>Low confidence</strong> — this insight may not be accurate. Always verify before sharing.
        </Alert>
      )}
    </Box>
  );
}

function PIIWarning({ onReveal, revealed }: { onReveal: () => void; revealed: boolean }) {
  if (revealed) {
    return (
      <Alert severity="warning" sx={{ mb: 1, py: 0.25, fontSize: '0.75rem' }}>
        ⚠️ This summary may contain sensitive personal information. Do not share externally.
      </Alert>
    );
  }
  return (
    <Alert
      severity="error"
      sx={{ mb: 1, fontSize: '0.75rem' }}
      action={
        <Button
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={onReveal}
          color="inherit"
          sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}
        >
          Reveal
        </Button>
      }
    >
      <strong>Sensitive content detected.</strong> This AI summary appears to contain personal identifiable information (PII) and has been hidden. It is likely inaccurate.
    </Alert>
  );
}

export function AIInsightsPanel({ employeeId }: Props) {
  const [fetchEnabled, setFetchEnabled] = useState(false);
  const [piiRevealed, setPIIRevealed] = useState(false);

  const { isAccepted: consentAccepted, isReady: consentReady, giveConsent, isLoading: consentLoading } = useAIConsent();
  const { track } = useTelemetry();

  const { data, status, hasPII, retryAfter, refetch, isLoading } = useAIInsights(
    employeeId,
    fetchEnabled && consentReady
  );

  const handleGenerate = () => {
    setFetchEnabled(true);
    setPIIRevealed(false);
  };

  const handleAcceptConsent = () => {
    giveConsent();
    track({ type: 'consent_obtained' });
  };

  const handleRetry = () => {
    setPIIRevealed(false);
    refetch();
  };

  const handleRevealPII = () => {
    setPIIRevealed(true);
    track({ type: 'ai_insights_revealed', employeeId });
  };

  // Track events on status changes
  const prevStatus = useRef<InsightsStatus>('idle');
  useEffect(() => {
    if (status === prevStatus.current) return;

    if (status === 'success' && data) {
      track({
        type: 'ai_insights_loaded',
        employeeId,
        confidence: data.confidence,
        processingTimeMs: data.processingTimeMs,
      });
      if (hasPII) track({ type: 'ai_pii_detected', employeeId });
    }
    if (status === 'timeout' || status === 'rate-limited' || status === 'error') {
      track({
        type: 'ai_error',
        employeeId,
        errorType: status === 'timeout' ? 'timeout' : status === 'rate-limited' ? 'rate-limit' : 'error',
      });
    }

    prevStatus.current = status;
  }, [status, data, hasPII, employeeId, track]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
        <AutoAwesomeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
        <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
          AI Insights
        </Typography>
        <Chip label="Beta" size="small" sx={{ height: 16, fontSize: '0.65rem', bgcolor: '#ede9fe', color: '#7c3aed' }} />
      </Box>

      {/* No Consent — Explicit Agreement Required */}
      {!consentAccepted && (
        <Alert
          severity="info"
          icon={<AutoAwesomeIcon fontSize="small" />}
          sx={{
            fontSize: '0.8rem',
            bgcolor: '#f5f3ff',
            color: '#5b21b6',
            border: '1px solid #ddd6fe',
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Typography variant="subtitle2" sx={{ fontSize: '0.75rem', fontWeight: 700, mb: 0.5 }}>
            Enable AI Insights
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.72rem', mb: 1.5, lineHeight: 1.4 }}>
            By enabling AI, summaries of employee activity will be generated.
            Usage data and behavioral telemetry will be sent to the Faros AI backend to improve model quality.
          </Typography>
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={handleAcceptConsent}
            sx={{
              bgcolor: '#7c3aed',
              fontSize: '0.75rem',
              py: 0.5,
              '&:hover': { bgcolor: '#6d28d9' }
            }}
          >
            Accept & Enable
          </Button>
        </Alert>
      )}

      {/* Consent Ready but Idle — show button */}
      {consentAccepted && status === 'idle' && (
        <Button
          variant="outlined"
          size="small"
          fullWidth
          startIcon={<AutoAwesomeIcon />}
          onClick={handleGenerate}
          disabled={!consentReady || consentLoading}
          sx={{ fontSize: '0.8rem', borderStyle: 'dashed' }}
        >
          {consentReady ? 'Generate Insights' : 'Preparing AI…'}
        </Button>
      )}

      {/* Loading */}
      {isLoading && (
        <Box sx={{ mt: 1 }}>
          <Skeleton variant="text" height={14} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" height={14} width="90%" sx={{ mb: 0.5 }} />
          <Skeleton variant="text" height={14} width="80%" sx={{ mb: 0.5 }} />
          <Skeleton variant="text" height={14} width="70%" />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
            Generating insights…
          </Typography>
        </Box>
      )}

      {/* Timeout */}
      {status === 'timeout' && (
        <Alert
          severity="warning"
          action={
            <Button size="small" startIcon={<RefreshIcon />} onClick={handleRetry} color="inherit" sx={{ fontSize: '0.7rem' }}>
              Retry
            </Button>
          }
          sx={{ fontSize: '0.78rem' }}
        >
          The AI took too long to respond. This happens occasionally.
        </Alert>
      )}

      {/* Rate limited */}
      {status === 'rate-limited' && (
        <Alert severity="warning" sx={{ fontSize: '0.78rem' }}>
          AI rate limit reached.{retryAfter ? ` Try again in ${retryAfter}s.` : ' Please wait a moment.'}
        </Alert>
      )}

      {/* Generic error */}
      {status === 'error' && (
        <Alert
          severity="error"
          action={
            <Button size="small" startIcon={<RefreshIcon />} onClick={handleRetry} color="inherit" sx={{ fontSize: '0.7rem' }}>
              Retry
            </Button>
          }
          sx={{ fontSize: '0.78rem' }}
        >
          Failed to generate AI insights.
        </Alert>
      )}

      {/* Success */}
      {status === 'success' && data && (
        <Box>
          {hasPII && !piiRevealed && (
            <PIIWarning onReveal={handleRevealPII} revealed={false} />
          )}
          {hasPII && piiRevealed && (
            <PIIWarning onReveal={handleRevealPII} revealed />
          )}

          {/* Summary text — blurred if PII and not revealed */}
          <Box
            sx={{
              position: 'relative',
              ...(hasPII && !piiRevealed
                ? {
                    filter: 'blur(4px)',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }
                : {}),
            }}
          >
            <Typography variant="body2" sx={{ lineHeight: 1.65, color: 'text.primary', fontSize: '0.82rem' }}>
              {data.summary}
            </Typography>
          </Box>

          <ConfidenceBadge confidence={data.confidence} />

          {/* Disclaimer */}
          <Box
            sx={{
              mt: 1.5, p: 1, bgcolor: '#f8fafc', borderRadius: 1,
              border: '1px solid #e2e8f0',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
              🤖 AI-generated by <strong>{data.model}</strong> · Generated {new Date(data.generatedAt).toLocaleTimeString()} · Always verify before sharing
            </Typography>
          </Box>

          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title="Refresh insights">
              <Button size="small" startIcon={<RefreshIcon />} onClick={handleRetry} sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                Regenerate
              </Button>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Box>
  );
}
