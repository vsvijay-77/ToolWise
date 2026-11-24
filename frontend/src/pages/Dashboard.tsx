import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { BarChart } from '@mui/x-charts/BarChart'
import { LayoutGrid, Plus, RefreshCw, Table as TableIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCatalogue } from '../api'
import { useSelection } from '../context/SelectionContext'
import {
  jobs as defaultJobs,
  machines as fallbackMachines,
  materials as fallbackMaterials,
  tools as fallbackTools,
  type Job,
  type Machine,
  type Material,
  type Tool,
} from '../data'
import { getToolMetrics, type UnifiedToolStatus } from '../utils/toolMetrics'

const statusColor: Record<
  UnifiedToolStatus,
  { accent: string; chipBg: string; chipText: string }
> = {
  OK: { accent: '#22C55E', chipBg: 'rgba(34,197,94,0.14)', chipText: '#4ADE80' },
  Monitor: { accent: '#F59E0B', chipBg: 'rgba(245,158,11,0.14)', chipText: '#FBBF24' },
  Critical: { accent: '#EF4444', chipBg: 'rgba(239,68,68,0.14)', chipText: '#F87171' },
}

const severityRank: Record<UnifiedToolStatus, number> = {
  Critical: 0,
  Monitor: 1,
  OK: 2,
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { machines: apiMachines, tools: apiTools, isLoading, refresh } = useCatalogue()
  const {
    fleetMachines,
    fleetTools,
    fleetJobs,
    fleetMaterials,
    fleetQueues,
    setMachineId,
  } = useSelection()

  const [layoutMode, setLayoutMode] = useState<'table' | 'cards'>('table')

  const machinesList = fleetMachines.length
    ? fleetMachines
    : apiMachines.length
      ? apiMachines
      : fallbackMachines
  const toolsList = fleetTools.length ? fleetTools : apiTools.length ? apiTools : fallbackTools

  const rows = useMemo(() => {
    const list = machinesList.map((machine: Machine) => {
      const tool: Tool =
        toolsList.find((t) => t.id === machine.currentToolId) ??
        fallbackTools.find((t) => t.id === machine.currentToolId) ??
        toolsList[0] ??
        fallbackTools[0]
      const job: Job = fleetJobs[machine.id] ?? defaultJobs[machine.id] ?? defaultJobs['CNC-01']
      const material: Material =
        fleetMaterials.find((m) => m.id === job.materialId) ??
        fleetMaterials[0] ??
        fallbackMaterials[0]
      const metrics = getToolMetrics(tool, material, job)
      return { machine, tool, job, material, metrics }
    })

    return list.sort((a, b) => {
      const diff = severityRank[a.metrics.status] - severityRank[b.metrics.status]
      return diff !== 0 ? diff : a.metrics.score - b.metrics.score
    })
  }, [machinesList, toolsList, fleetJobs, fleetMaterials])

  const machineCounts = useMemo(() => {
    const total = machinesList.length
    const running = machinesList.filter((m) => m.status === 'Running').length
    const idle = machinesList.filter((m) => m.status === 'Idle').length
    const stopped = machinesList.filter(
      (m) => m.status === 'Offline' || m.status === 'Maintenance',
    ).length
    return { total, running, idle, stopped }
  }, [machinesList])

  const kpis = useMemo(() => {
    if (!rows.length) {
      return { avgScore: 0, critical: 0, monitor: 0, damageRisk: 0, avgRemMin: 0 }
    }
    const avgScore = Math.round(rows.reduce((s, r) => s + r.metrics.score, 0) / rows.length)
    const critical = rows.filter((r) => r.metrics.status === 'Critical').length
    const monitor = rows.filter((r) => r.metrics.status === 'Monitor').length
    const damageRisk = rows.reduce((s, r) => s + r.metrics.damageRiskParts, 0)
    const avgRemMin = Math.round(
      rows.reduce((s, r) => s + r.metrics.remainingMin, 0) / rows.length,
    )
    return { avgScore, critical, monitor, damageRisk, avgRemMin }
  }, [rows])

  const [showAllBatches, setShowAllBatches] = useState(false)

  const nextBatches = useMemo(() => {
    const items: {
      id: string
      machineId: string
      machineName: string
      materialName: string
      batchQty: number
      partNumber: string
      operationNumber: string
      operation: string
      toolId: string
      expectedStartOffsetMin: number
      expectedDurationMin: number
    }[] = []
    for (const m of machinesList) {
      const q = fleetQueues[m.id] ?? []
      for (const entry of q) {
        const mat = fleetMaterials.find((x) => x.id === entry.materialId)
        items.push({
          id: entry.id,
          machineId: m.id,
          machineName: m.name,
          materialName: mat?.name ?? entry.materialId,
          batchQty: entry.batchSize,
          partNumber: entry.partNumber,
          operationNumber: entry.operationNumber,
          operation: entry.operation,
          toolId: entry.toolId,
          expectedStartOffsetMin: entry.expectedStartOffsetMin,
          expectedDurationMin: entry.expectedDurationMin,
        })
      }
    }
    return items.sort((a, b) => a.expectedStartOffsetMin - b.expectedStartOffsetMin)
  }, [machinesList, fleetQueues, fleetMaterials])

  const chartData = useMemo(() => {
    const ordered = [...rows].sort((a, b) => a.machine.id.localeCompare(b.machine.id))
    return {
      labels: ordered.map((r) => `${r.machine.id} (${r.tool.id})`),
      predicted: ordered.map((r) => r.metrics.predictedLifeMin),
      actual: ordered.map((r) => r.metrics.actualCutMin),
      remaining: ordered.map((r) => r.metrics.remainingMin),
    }
  }, [rows])

  const openMachine = (id: string) => {
    setMachineId(id)
    navigate(`/machines/${id}`)
  }

  return (
    <Stack spacing={5} sx={{ maxWidth: 1280, mx: 'auto' }}>
      {/* Header: Title + Simulated data pill + Refresh icon */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#F8FAFC', lineHeight: 1.2 }}>
            Fleet Dashboard
          </Typography>
          <Tooltip title="Spindle telemetry and flank wear are simulated; tool life, health scores, and damage risk are calculated via Taylor physics.">
            <Chip
              label="Simulated data"
              size="small"
              sx={{
                borderRadius: '8px',
                bgcolor: 'rgba(255,255,255,0.06)',
                color: '#94A3B8',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          </Tooltip>
        </Stack>

        <Tooltip title="Refresh fleet telemetry">
          <IconButton
            onClick={() => refresh()}
            aria-label="Refresh fleet"
            sx={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', bgcolor: '#14181D' }}
          >
            <RefreshCw size={18} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Machine Fleet Status Strip: Total, Running, Idle, Stopped */}
      <Card sx={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none', bgcolor: '#14181D' }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
            spacing={{ xs: 2, sm: 0 }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            {[
              { label: 'Total machines', value: machineCounts.total, color: '#F8FAFC', dot: '#1565C0', sub: 'Connected cells' },
              { label: 'Running', value: machineCounts.running, color: '#15803D', dot: '#16A34A', sub: 'Active cutting' },
              { label: 'Idle', value: machineCounts.idle, color: '#B45309', dot: '#D97706', sub: 'Ready / standby' },
              { label: 'Stopped', value: machineCounts.stopped, color: '#B91C1C', dot: '#DC2626', sub: 'Offline / maintenance' },
            ].map((item) => (
              <Box key={item.label} sx={{ flex: 1, px: { sm: 2.5 }, '&:first-of-type': { pl: { sm: 0 } } }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.dot }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                    {item.label}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: 22,
                      fontWeight: 700,
                      fontFamily: '"JetBrains Mono", monospace',
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#64748B' }}>{item.sub}</Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Single Row of 4 Compact KPI Cards (96px tall) */}
      <Grid container spacing={3}>
        {[
          { label: 'Avg tool condition', value: `${kpis.avgScore} / 100`, sub: 'Fleet-wide score' },
          {
            label: 'Tools needing action',
            value: `${kpis.critical + kpis.monitor}`,
            sub: `${kpis.critical} critical · ${kpis.monitor} monitor`,
          },
          {
            label: 'Product damage risk',
            value: `${kpis.damageRisk} pcs`,
            sub: 'Before planned swap',
          },
          { label: 'Avg remaining life', value: `${kpis.avgRemMin} min`, sub: 'Across active tools' },
        ].map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              sx={{
                minHeight: 96,
                height: { xs: 'auto', sm: 96 },
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: 'none',
                bgcolor: '#14181D',
              }}
            >
              <CardContent
                sx={{
                  p: 2.5,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  '&:last-child': { pb: 2.5 },
                }}
              >
                <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                  {kpi.label}
                </Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" flexWrap="wrap" useFlexGap spacing={1} sx={{ mt: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: { xs: 20, sm: 22 },
                      fontWeight: 700,
                      fontFamily: '"JetBrains Mono", monospace',
                      color: '#F8FAFC',
                    }}
                  >
                    {kpi.value}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#64748B' }}>{kpi.sub}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Section: Needs attention */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
            Needs attention
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={layoutMode}
            onChange={(_, v) => v && setLayoutMode(v)}
            sx={{
              bgcolor: 'rgba(255,255,255,0.06)',
              borderRadius: '8px',
              p: 0.35,
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '6px !important',
                px: 1.25,
                py: 0.4,
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'none',
                color: '#94A3B8',
                '&.Mui-selected': { bgcolor: '#14181D', color: '#1565C0' },
              },
            }}
          >
            <ToggleButton value="table">
              <TableIcon size={14} style={{ marginRight: 6 }} />
              Table
            </ToggleButton>
            <ToggleButton value="cards">
              <LayoutGrid size={14} style={{ marginRight: 6 }} />
              Cards
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {isLoading && !rows.length ? (
          <Skeleton variant="rounded" height={240} sx={{ borderRadius: '12px' }} />
        ) : layoutMode === 'table' ? (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', bgcolor: '#14181D' }}
          >
            <Table size="medium" sx={{ minWidth: 620 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#94A3B8' }}>Machine</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#94A3B8' }}>Tool</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#94A3B8' }}>Score</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#94A3B8' }}>Remaining</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#94A3B8' }}>Damage risk</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#94A3B8' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, color: '#94A3B8' }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(({ machine, tool, metrics }) => {
                  const pal = statusColor[metrics.status]
                  return (
                    <TableRow
                      key={machine.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        borderLeft: `3px solid ${pal.accent}`,
                      }}
                      onClick={() => openMachine(machine.id)}
                    >
                      <TableCell>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
                          {machine.id} · {machine.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: 14, color: '#94A3B8' }}>{tool.id}</TableCell>
                      <TableCell sx={{ fontSize: 14, fontWeight: 700, color: pal.accent }}>
                        {metrics.score}
                      </TableCell>
                      <TableCell sx={{ fontSize: 14, color: '#F8FAFC' }}>
                        {metrics.remainingMin} min
                      </TableCell>
                      <TableCell sx={{ fontSize: 14, color: '#94A3B8' }}>
                        {metrics.damageRiskParts} pcs
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={metrics.status}
                          size="small"
                          sx={{
                            borderRadius: '8px',
                            bgcolor: pal.chipBg,
                            color: pal.chipText,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            openMachine(machine.id)
                          }}
                          sx={{ textTransform: 'none', fontWeight: 600, color: '#1565C0' }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Grid container spacing={3}>
            {rows.map(({ machine, tool, metrics }) => {
              const pal = statusColor[metrics.status]
              const lifePct = Math.max(
                0,
                Math.min(100, Math.round((metrics.remainingMin / Math.max(1, metrics.predictedLifeMin)) * 100)),
              )
              return (
                <Grid key={machine.id} size={{ xs: 12, md: 6 }}>
                  <Card
                    onClick={() => openMachine(machine.id)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderLeft: `3px solid ${pal.accent}`,
                      boxShadow: 'none',
                      '&:hover': { borderColor: '#CBD5E1' },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
                          {machine.id} · {tool.id}
                        </Typography>
                        <Chip
                          label={metrics.status}
                          size="small"
                          sx={{
                            borderRadius: '8px',
                            bgcolor: pal.chipBg,
                            color: pal.chipText,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        />
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: 14, color: '#94A3B8' }}>
                          Score: <strong>{metrics.score}</strong>
                        </Typography>
                        <Typography sx={{ fontSize: 14, color: '#F8FAFC', fontWeight: 600 }}>
                          {metrics.remainingMin} min left
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={lifePct}
                        sx={{
                          height: 8,
                          borderRadius: 8,
                          bgcolor: 'rgba(255,255,255,0.06)',
                          '& .MuiLinearProgress-bar': { bgcolor: pal.accent, borderRadius: 8 },
                        }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}
      </Box>

      {/* Full-width 280px Grouped Bar Chart: Actual vs Predicted tool life across fleet */}
      <Card sx={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none', bgcolor: '#14181D' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
                Actual vs Predicted tool life
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: '#64748B' }}>
                Taylor predicted life vs actual cutting time used and remaining minutes per machine
              </Typography>
            </Box>

            <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
              {[
                { label: 'Predicted life (min)', color: '#3B82F6' },
                { label: 'Actual cut time (min)', color: '#22C55E' },
                { label: 'Remaining life (min)', color: '#F59E0B' },
              ].map((item) => (
                <Stack key={item.label} direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: item.color }} />
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Box sx={{ height: 280, width: '100%' }}>
            <BarChart
              xAxis={[
                {
                  scaleType: 'band',
                  data: chartData.labels,
                  tickLabelStyle: { fontSize: 10.5 },
                },
              ]}
              yAxis={[{ label: 'Minutes (min)', min: 0 }]}
              grid={{ horizontal: true }}
              borderRadius={4}
              slotProps={{ legend: { hidden: true } }}
              series={[
                {
                  data: chartData.predicted,
                  label: 'Predicted life (min)',
                  color: '#3B82F6',
                },
                {
                  data: chartData.actual,
                  label: 'Actual cut time (min)',
                  color: '#22C55E',
                },
                {
                  data: chartData.remaining,
                  label: 'Remaining life (min)',
                  color: '#F59E0B',
                },
              ]}
              height={280}
              margin={{ top: 16, right: 16, bottom: 40, left: 50 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Next batches Card (shows full fleet queue with Show all toggle) */}
      <Card sx={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none', bgcolor: '#14181D' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
                Next batches
              </Typography>
              <Chip
                label={`${nextBatches.length} queued`}
                size="small"
                sx={{
                  borderRadius: '8px',
                  bgcolor: 'rgba(59,130,246,0.14)',
                  color: '#1565C0',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              {nextBatches.length > 5 && (
                <Button
                  size="small"
                  onClick={() => setShowAllBatches((prev) => !prev)}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: '#94A3B8' }}
                >
                  {showAllBatches ? 'Show top 5' : `Show all (${nextBatches.length})`}
                </Button>
              )}
              <Button
                size="small"
                variant="outlined"
                startIcon={<Plus size={15} />}
                onClick={() => navigate('/materials')}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                Queue Material
              </Button>
            </Stack>
          </Stack>

          {nextBatches.length === 0 ? (
            <Typography sx={{ fontSize: 14, color: '#64748B' }}>
              No upcoming material batches queued.
            </Typography>
          ) : (
            <Stack divider={<Divider />} spacing={1.5}>
              {(showAllBatches ? nextBatches : nextBatches.slice(0, 5)).map((b) => (
                <Stack
                  key={`${b.machineId}-${b.id}`}
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={1}
                  onClick={() => openMachine(b.machineId)}
                  sx={{
                    cursor: 'pointer',
                    py: 0.5,
                    borderRadius: '8px',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                  }}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
                        {b.partNumber}
                      </Typography>
                      <Chip
                        label={b.materialName}
                        size="small"
                        sx={{
                          height: 20,
                          borderRadius: '6px',
                          bgcolor: 'rgba(255,255,255,0.06)',
                          color: '#CBD5E1',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      />
                      <Typography sx={{ fontSize: 12.5, color: '#64748B' }}>
                        {b.operationNumber} · {b.operation}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 12, color: '#64748B', mt: 0.25 }}>
                      {b.machineId} ({b.machineName}) · Tool {b.toolId}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
                      {b.batchQty} pcs
                    </Typography>
                    <Chip
                      label={`in ${b.expectedStartOffsetMin} min · ${b.expectedDurationMin} min run`}
                      size="small"
                      sx={{
                        height: 22,
                        borderRadius: '8px',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#94A3B8',
                        fontSize: 11.5,
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}
