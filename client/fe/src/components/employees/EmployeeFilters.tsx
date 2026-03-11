import { useState } from 'react';
import {
  Box, Button, Chip, Popover, Typography, Divider,
  FormGroup, FormControlLabel, Checkbox, Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useFilterOptions } from '../../hooks/useFilterOptions';
import type { EmployeeFilter } from '../../hooks/useEmployees';

interface Props {
  filter: EmployeeFilter;
  onChange: (filter: EmployeeFilter) => void;
}

type FilterKey = keyof EmployeeFilter;

interface FilterSection {
  key: FilterKey;
  label: string;
  options: { value: string; label: string }[];
}

export function EmployeeFilters({ filter, onChange }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const { data: options } = useFilterOptions();

  const sections: FilterSection[] = [
    {
      key: 'teams',
      label: 'Team',
      options: (options?.teams ?? []).map((t) => ({ value: t.uid, label: t.name })),
    },
    {
      key: 'trackingStatuses',
      label: 'Tracking Status',
      options: (options?.trackingStatuses ?? []).map((s) => ({ value: s, label: s })),
    },
    {
      key: 'trackingCategories',
      label: 'Tracking Category',
      options: (options?.trackingCategories ?? []).map((c) => ({ value: c, label: c })),
    },
    {
      key: 'accountTypes',
      label: 'Account Type',
      options: (options?.accountTypes ?? []).map((a) => ({ value: a.type, label: a.source })),
    },
  ];

  const toggleValue = (key: FilterKey, value: string) => {
    const current = (filter[key] ?? []) as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filter, [key]: updated.length > 0 ? updated : undefined });
  };

  const removeFilter = (key: FilterKey, value: string) => {
    const current = (filter[key] ?? []) as string[];
    const updated = current.filter((v) => v !== value);
    onChange({ ...filter, [key]: updated.length > 0 ? updated : undefined });
  };

  const activeChips: { key: FilterKey; value: string; label: string }[] = [];
  sections.forEach(({ key, options: opts }) => {
    ((filter[key] ?? []) as string[]).forEach((val) => {
      const opt = opts.find((o) => o.value === val);
      if (opt) activeChips.push({ key, value: val, label: opt.label });
    });
  });

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <Button
        size="small"
        startIcon={<AddIcon />}
        variant="outlined"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ fontSize: '0.8rem', borderColor: '#e2e8f0', color: 'text.secondary', whiteSpace: 'nowrap' }}
      >
        Add Filter
      </Button>

      {activeChips.map(({ key, value, label }) => (
        <Chip
          key={`${key}-${value}`}
          label={label}
          size="small"
          onDelete={() => removeFilter(key, value)}
          sx={{ fontSize: '0.78rem', backgroundColor: '#dbeafe', color: '#1e40af' }}
        />
      ))}

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, minWidth: 260, borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
      >
        <Stack spacing={2}>
          {sections.map(({ key, label, options: opts }) => (
            <Box key={key}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </Typography>
              <FormGroup>
                {opts.map(({ value, label: optLabel }, i) => (
                  <FormControlLabel
                    key={`${key}-${value}-${i}`}
                    control={
                      <Checkbox
                        size="small"
                        checked={((filter[key] ?? []) as string[]).includes(value)}
                        onChange={() => toggleValue(key, value)}
                      />
                    }
                    label={<Typography variant="body2">{optLabel}</Typography>}
                    sx={{ ml: 0 }}
                  />
                ))}
              </FormGroup>
              <Divider sx={{ mt: 1 }} />
            </Box>
          ))}
        </Stack>
      </Popover>
    </Box>
  );
}
