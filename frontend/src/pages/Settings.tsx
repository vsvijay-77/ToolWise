import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { ArrowRight, Bot, RotateCcw, Server, ShieldCheck, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelection } from '../context/SelectionContext'

export default function Settings() {
  const navigate = useNavigate()
  const { resetDemoData } = useSelection()

  const [plant, setPlant] = useState('Plant 01')
  const [currency, setCurrency] = useState('INR')
  const [wearWarningPct, setWearWarningPct] = useState('75')
  const [wearLockoutPct, setWearLockoutPct] = useState('92')
  const [autoLockout, setAutoLockout] = useState(true)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  const handleReset = () => {
    resetDemoData()
    setSavedNotice('Sample CNC fleet, tool wear telemetry, and batch queue reset to factory defaults.')
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={1.5}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            Configure plant defaults, flank-wear lockout thresholds, and sample demo data
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Bot size={15} />}
            endIcon={<ArrowRight size={14} />}
            onClick={() => navigate('/ai-assistance')}
            sx={{ fontWeight: 700 }}
          >
            AI Assistance
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Server size={15} />}
            endIcon={<ArrowRight size={14} />}
            onClick={() => navigate('/edge-gateway')}
            sx={{ fontWeight: 700 }}
          >
            Edge Gateway
          </Button>
        </Stack>
      </Stack>

      {savedNotice && (
        <Alert severity="success" onClose={() => setSavedNotice(null)}>
          {savedNotice}
        </Alert>
      )}

      {/* 1. Workspace Preferences */}
      <Card sx={{ bgcolor: '#14181D', border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            spacing={1.5}
            mb={2.5}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Sparkles size={19} color="#1565C0" />
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Workspace Preferences
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Plant floor defaults and cost comparison currency
                </Typography>
              </Box>
            </Stack>
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<RotateCcw size={14} />}
              onClick={handleReset}
            >
              Reset Sample Data
            </Button>
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Default Plant"
                fullWidth
                size="small"
                value={plant}
                onChange={e => setPlant(e.target.value)}
              >
                <MenuItem value="Plant 01">Plant 01 (Chennai CNC Cell)</MenuItem>
                <MenuItem value="Plant 02">Plant 02 (Pune Precision Line)</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Cost Comparison Currency"
                fullWidth
                size="small"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              >
                <MenuItem value="INR">INR (₹)</MenuItem>
                <MenuItem value="USD">USD ($)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 2. Tool Wear & Batch Lockout Thresholds */}
      <Card sx={{ bgcolor: '#14181D', border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            spacing={1.5}
            mb={2.5}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <ShieldCheck size={19} color="#2E7D32" />
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  Product Damage Shield & Wear Thresholds
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Control when ToolWise flags planned tool swaps or locks out high-risk batches
                </Typography>
              </Box>
            </Stack>

            <FormControlLabel
              control={<Switch checked={autoLockout} onChange={e => setAutoLockout(e.target.checked)} />}
              label={<Typography variant="body2" fontWeight={700}>Auto Batch Lockout</Typography>}
            />
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Planned Swap Warning (% VB Limit)"
                fullWidth
                size="small"
                value={wearWarningPct}
                onChange={e => setWearWarningPct(e.target.value)}
              >
                <MenuItem value="65">65% VB (Conservative)</MenuItem>
                <MenuItem value="75">75% VB (Recommended)</MenuItem>
                <MenuItem value="85">85% VB (High Utilization)</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Critical Cycle-Start Lockout (% VB Limit)"
                fullWidth
                size="small"
                value={wearLockoutPct}
                onChange={e => setWearLockoutPct(e.target.value)}
              >
                <MenuItem value="88">88% VB Limit</MenuItem>
                <MenuItem value="92">92% VB Limit (Default)</MenuItem>
                <MenuItem value="95">95% VB Limit</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  )
}
