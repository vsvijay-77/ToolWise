import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  Play,
  RefreshCw,
  Server,
} from 'lucide-react'

type GatewayEndpoint = {
  machineId: string
  machineName: string
  protocol: 'FANUC FOCAS' | 'OPC UA' | 'MTConnect' | 'Siemens S7'
  address: string
  spindleRpm: number
  spindleLoadPct: number
  vbWearMm: string
  rulMin: number
  plannedSwapInr: string
  failureLossInr: string
  latencyMs: number
  status: 'Streaming' | 'Warning' | 'Critical'
}

type SampleTelemetryPacket = {
  id: string
  label: string
  machineId: string
  controller: string
  timestamp: string
  toolId: string
  material: string
  rpm: number
  feedMmTooth: number
  spindleLoadPct: number
  vibrationMmS: number
  tempC: number
  vbWearMm: number
  predictedRulMin: number
  plannedSwapInr: number
  failureLossInr: number
  delayAvoidedMin: number
  verdict: string
}

const sampleEndpoints: GatewayEndpoint[] = [
  {
    machineId: 'CNC-01',
    machineName: 'VMC Alpha · Makino',
    protocol: 'FANUC FOCAS',
    address: '192.168.1.101:8193',
    spindleRpm: 4200,
    spindleLoadPct: 67,
    vbWearMm: '0.16 / 0.30 mm',
    rulMin: 71,
    plannedSwapInr: '₹9,130',
    failureLossInr: '₹78,400',
    latencyMs: 4,
    status: 'Streaming',
  },
  {
    machineId: 'CNC-02',
    machineName: 'MillTurn 500 · DMG Mori',
    protocol: 'OPC UA',
    address: '192.168.1.102:4840',
    spindleRpm: 1100,
    spindleLoadPct: 49,
    vbWearMm: '0.11 / 0.30 mm',
    rulMin: 47,
    plannedSwapInr: '₹4,980',
    failureLossInr: '₹64,200',
    latencyMs: 6,
    status: 'Streaming',
  },
  {
    machineId: 'CNC-03',
    machineName: 'VF-4SS · Haas 5-Axis',
    protocol: 'MTConnect',
    address: '192.168.1.103:5000',
    spindleRpm: 6100,
    spindleLoadPct: 42,
    vbWearMm: '0.09 / 0.25 mm',
    rulMin: 74,
    plannedSwapInr: '₹9,620',
    failureLossInr: '₹71,500',
    latencyMs: 5,
    status: 'Streaming',
  },
  {
    machineId: 'CNC-04',
    machineName: 'Nexturn 320 · Doosan',
    protocol: 'Siemens S7',
    address: '192.168.1.104:102',
    spindleRpm: 780,
    spindleLoadPct: 74,
    vbWearMm: '0.25 / 0.30 mm',
    rulMin: 29,
    plannedSwapInr: '₹5,230',
    failureLossInr: '₹82,900',
    latencyMs: 7,
    status: 'Warning',
  },
  {
    machineId: 'CNC-05',
    machineName: 'DMC 635 · DMG Mori',
    protocol: 'FANUC FOCAS',
    address: '192.168.1.105:8193',
    spindleRpm: 2350,
    spindleLoadPct: 78,
    vbWearMm: '0.27 / 0.35 mm',
    rulMin: 18,
    plannedSwapInr: '₹12,780',
    failureLossInr: '₹94,600',
    latencyMs: 4,
    status: 'Critical',
  },
]

const samplePackets: SampleTelemetryPacket[] = [
  {
    id: 'PKT-CNC01',
    label: 'Sample #1 · CNC-01 Healthy Roughing (AISI 4140)',
    machineId: 'CNC-01',
    controller: 'Fanuc 31i-B5',
    timestamp: '2026-11-15T05:12:40.250Z',
    toolId: 'TL-001 (Ø12 Roughing End Mill)',
    material: 'AISI 4140 Alloy Steel (28 HRC)',
    rpm: 4200,
    feedMmTooth: 0.12,
    spindleLoadPct: 67,
    vibrationMmS: 2.8,
    tempC: 42,
    vbWearMm: 0.16,
    predictedRulMin: 71,
    plannedSwapInr: 9130,
    failureLossInr: 78400,
    delayAvoidedMin: 93,
    verdict: 'ALL OK · 71m RUL covers remaining 44 parts (59m). Schedule 3m swap after batch #120.',
  },
  {
    id: 'PKT-CNC04',
    label: 'Sample #2 · CNC-04 High-Wear Superalloy (Inconel 718)',
    machineId: 'CNC-04',
    controller: 'Siemens S7-1500 / 840D',
    timestamp: '2026-11-15T05:12:40.500Z',
    toolId: 'TL-005 (DNMG 150608 Insert)',
    material: 'Inconel 718 (36 HRC · ISO S)',
    rpm: 780,
    feedMmTooth: 0.14,
    spindleLoadPct: 74,
    vibrationMmS: 4.2,
    tempC: 56,
    vbWearMm: 0.25,
    predictedRulMin: 29,
    plannedSwapInr: 5230,
    failureLossInr: 82900,
    delayAvoidedMin: 96,
    verdict: 'WARNING · VB at 83% limit. Stage sister tool in T03 before next 4 parts to save ₹77,670.',
  },
  {
    id: 'PKT-CNC05',
    label: 'Sample #3 · CNC-05 Critical Lockout Alert (Gear Face Milling)',
    machineId: 'CNC-05',
    controller: 'Allen-Bradley ControlLogix',
    timestamp: '2026-11-15T05:12:40.750Z',
    toolId: 'TL-009 (Ø20 5F End Mill)',
    material: 'AISI 4140 Alloy Steel (28 HRC)',
    rpm: 2350,
    feedMmTooth: 0.15,
    spindleLoadPct: 78,
    vibrationMmS: 3.7,
    tempC: 48,
    vbWearMm: 0.27,
    predictedRulMin: 18,
    plannedSwapInr: 12780,
    failureLossInr: 94600,
    delayAvoidedMin: 105,
    verdict: 'CRITICAL · Replace immediately (3m swap = ₹12,780) to avoid ₹94,600 scrap + holder collision.',
  },
]

export default function EdgeGatewayAi() {
  const [gatewayHost, setGatewayHost] = useState('192.168.1.45:8883')
  const [gatewayProtocol, setGatewayProtocol] = useState('OPC UA + FANUC FOCAS')
  const [pollingMs, setPollingMs] = useState('250')
  const [gatewayOnline, setGatewayOnline] = useState(true)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)
  const [selectedPacketIdx, setSelectedPacketIdx] = useState(0)

  const activePacket = samplePackets[selectedPacketIdx]

  const handleTestGateway = () => {
    setGatewayOnline(true)
    setSyncNotice(
      `Sample Gateway heartbeat verified at ${gatewayHost} · ${sampleEndpoints.length} CNC telemetry streams active (${pollingMs} ms polling).`
    )
  }

  const handleInjectSamplePacket = (idx: number) => {
    setSelectedPacketIdx(idx)
    const pkt = samplePackets[idx]
    setSyncNotice(
      `Loaded ${pkt.label} → VB Wear ${pkt.vbWearMm} mm, RUL ${pkt.predictedRulMin} min, Planned Swap ₹${pkt.plannedSwapInr.toLocaleString('en-IN')} vs. Failure Loss ₹${pkt.failureLossInr.toLocaleString('en-IN')}.`
    )
  }

  return (
    <Stack spacing={3}>
      {/* Top Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'center' }}
        spacing={2}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
            <Chip
              size="small"
              icon={<Database size={13} />}
              label="PRE-LOADED WITH SAMPLE CNC EDGE TELEMETRY"
              sx={{
                bgcolor: '#EFF6FF',
                color: '#1565C0',
                border: '1px solid #BFDBFE',
                fontWeight: 800,
                fontSize: 11,
              }}
            />
          </Stack>
          <Typography variant="h4" fontWeight={800}>
            Edge Gateway
          </Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            Live sample CNC edge streams and telemetry payload inspector for spindle load, flank wear (VB), and ₹ cost impact.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip
            icon={<CheckCircle2 size={14} />}
            label={gatewayOnline ? 'Gateway Online · 5 Sample Streams' : 'Gateway Paused'}
            color={gatewayOnline ? 'success' : 'default'}
            sx={{ fontWeight: 800 }}
          />
          <Button size="small" variant="outlined" startIcon={<RefreshCw size={14} />} onClick={handleTestGateway}>
            Verify Sample Streams
          </Button>
        </Stack>
      </Stack>

      {syncNotice && (
        <Alert severity="success" onClose={() => setSyncNotice(null)}>
          {syncNotice}
        </Alert>
      )}

      {/* 1. Edge Gateway Telemetry Bridge + Sample Endpoints Table */}
      <Card sx={{ bgcolor: '#14181D', border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            spacing={1.5}
            mb={2.5}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(46,125,50,.10)',
                  color: '#2E7D32',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Server size={20} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  1. Edge Gateway Telemetry Bridge (Sample CNC Fleet Data)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  GW-PLANT01-EDGE · Streaming sample RPM, spindle load, flank wear (VB), and ₹ replacement vs. failure loss metrics
                </Typography>
              </Box>
            </Stack>

            <Chip
              size="small"
              label="Avg Latency: 5.2 ms"
              sx={{ bgcolor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0', fontWeight: 800 }}
            />
          </Stack>

          <Grid container spacing={2} mb={2.5}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Gateway Host & Port"
                fullWidth
                size="small"
                value={gatewayHost}
                onChange={e => setGatewayHost(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label="Primary Protocol"
                fullWidth
                size="small"
                value={gatewayProtocol}
                onChange={e => setGatewayProtocol(e.target.value)}
              >
                <MenuItem value="OPC UA + FANUC FOCAS">OPC UA + FANUC FOCAS</MenuItem>
                <MenuItem value="MTConnect">MTConnect</MenuItem>
                <MenuItem value="Siemens S7 + Modbus TCP">Siemens S7 + Modbus TCP</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                label="Polling Interval"
                fullWidth
                size="small"
                value={pollingMs}
                onChange={e => setPollingMs(e.target.value)}
              >
                <MenuItem value="100">100 ms (High Frequency)</MenuItem>
                <MenuItem value="250">250 ms (Standard Sample Rate)</MenuItem>
                <MenuItem value="1000">1000 ms (Low Bandwidth)</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Machine &amp; Bay</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Protocol &amp; Endpoint</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Sample RPM &amp; Load</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Sample VB Wear &amp; RUL</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Planned Swap vs. Failure Loss</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Latency</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Stream State</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleEndpoints.map(ep => (
                  <TableRow key={ep.machineId} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Cpu size={15} color="#1565C0" />
                        <Box>
                          <Typography variant="body2" fontWeight={800}>
                            {ep.machineId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ep.machineName}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {ep.protocol}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace' }} color="text.secondary">
                        {ep.address}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5, fontWeight: 700 }}>
                      {ep.spindleRpm.toLocaleString()} RPM · {ep.spindleLoadPct}%
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {ep.vbWearMm}
                      </Typography>
                      <Typography variant="caption" color="primary.main" fontWeight={700}>
                        {ep.rulMin} min RUL remaining
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {ep.plannedSwapInr} (3m) vs. {ep.failureLossInr}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avoids 96–108m delay &amp; part scrap
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>
                      {ep.latencyMs} ms
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={ep.status}
                        color={ep.status === 'Streaming' ? 'success' : ep.status === 'Warning' ? 'warning' : 'error'}
                        sx={{ fontWeight: 700, height: 22 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {/* 2. Interactive Sample Telemetry Packet Inspector */}
      <Card sx={{ bgcolor: '#14181D', border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ md: 'center' }}
            spacing={1.5}
            mb={2}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Activity size={20} color="#1565C0" />
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  2. Sample Edge Signal Frames (Click to Load Sample Data)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inspect raw sample edge telemetry frames and see how ToolWise calculates RUL, delay savings, and rupee impact
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {samplePackets.map((pkt, idx) => {
                const active = idx === selectedPacketIdx
                return (
                  <ButtonBase
                    key={pkt.id}
                    onClick={() => handleInjectSamplePacket(idx)}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      fontSize: 12,
                      fontWeight: 800,
                      bgcolor: active ? '#1565C0' : '#F8FAFC',
                      color: active ? '#FFFFFF' : '#334155',
                      border: '1px solid',
                      borderColor: active ? '#1565C0' : '#CBD5E1',
                    }}
                  >
                    <Play size={12} style={{ marginRight: 6 }} />
                    {pkt.machineId} Sample
                  </ButtonBase>
                )
              })}
            </Stack>
          </Stack>

          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  color: '#E2E8F0',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 12,
                  overflowX: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#93C5FD', fontWeight: 800, display: 'block', mb: 1, fontFamily: '"JetBrains Mono", monospace' }}
                >
                  // ToolWiseSignalFrame v1 · {activePacket.label}
                </Typography>
                <Box component="pre" sx={{ m: 0, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                  {JSON.stringify(
                    {
                      contract: 'ToolWiseSignalFrame.v1',
                      machine_id: activePacket.machineId,
                      controller: activePacket.controller,
                      occurred_at: activePacket.timestamp,
                      active_tool: activePacket.toolId,
                      workpiece: activePacket.material,
                      telemetry: {
                        spindle_rpm: activePacket.rpm,
                        feed_mm_tooth: activePacket.feedMmTooth,
                        spindle_load_pct: activePacket.spindleLoadPct,
                        rms_vibration_mm_s: activePacket.vibrationMmS,
                        cutting_zone_temp_c: activePacket.tempC,
                      },
                      taylor_prediction: {
                        estimated_vb_wear_mm: activePacket.vbWearMm,
                        remaining_life_min: activePacket.predictedRulMin,
                        planned_swap_cost_inr: activePacket.plannedSwapInr,
                        unplanned_failure_loss_inr: activePacket.failureLossInr,
                        delay_avoided_min: activePacket.delayAvoidedMin,
                      },
                    },
                    null,
                    2
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.03)', height: '100%' }}>
                <Typography variant="subtitle2" fontWeight={800} color="primary.main" mb={1.5}>
                  PARSED SAMPLE TELEMETRY &amp; DECISION OUTPUT
                </Typography>

                <Grid container spacing={1.5} mb={2}>
                  <Grid size={6}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#14181D', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        ACTIVE TOOL &amp; WEAR
                      </Typography>
                      <Typography variant="body2" fontWeight={800} mt={0.25}>
                        {activePacket.toolId}
                      </Typography>
                      <Typography variant="caption" color="primary.main" fontWeight={700}>
                        VB: {activePacket.vbWearMm} mm · RUL: {activePacket.predictedRulMin} min
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={6}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#14181D', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>
                        PLANNED SWAP VS. BREAKDOWN
                      </Typography>
                      <Typography variant="body2" fontWeight={800} color="success.main" mt={0.25}>
                        Save ₹{(activePacket.failureLossInr - activePacket.plannedSwapInr).toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        ₹{activePacket.plannedSwapInr.toLocaleString('en-IN')} (3m) vs. ₹{activePacket.failureLossInr.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="caption" color="text.secondary" fontWeight={800} display="block" mb={0.5}>
                  AUTOMATED SHOP-FLOOR DECISION VERDICT
                </Typography>
                <Alert
                  severity={
                    activePacket.id === 'PKT-CNC05'
                      ? 'error'
                      : activePacket.id === 'PKT-CNC04'
                      ? 'warning'
                      : 'success'
                  }
                >
                  <Typography variant="body2" fontWeight={700}>
                    {activePacket.verdict}
                  </Typography>
                </Alert>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  )
}
