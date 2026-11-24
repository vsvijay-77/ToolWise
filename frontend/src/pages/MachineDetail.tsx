import { useEffect, useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  Menu,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronDown,
  MoreVertical,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react'
import { CNCMachine3D } from '../components/cnc/CNCMachine3D'
import { ToolMagazineTwinPanel } from '../components/cnc/ToolMagazineTwinPanel'
import { AiAssistantCard } from '../components/cards/AiAssistantCard'
import { ToolLifeDecisionCard } from '../components/cards/ToolLifeDecisionCard'
import { MachineSubTabs } from '../components/nav/MachineSubTabs'
import { useCatalogue } from '../api'
import { createLiveSignals, type LiveSignals, type Machine } from '../data'
import { selectedFrom, useSelection } from '../context/SelectionContext'
import { mrr } from '../utils/calculations'
import { getToolMetrics } from '../utils/toolMetrics'

const statusColor: Record<Machine['status'], { bg: string; color: string }> = {
  Running: { bg: 'rgba(34,197,94,0.14)', color: '#22C55E' },
  Idle: { bg: 'rgba(245,158,11,0.14)', color: '#F59E0B' },
  Offline: { bg: 'rgba(255,255,255,0.08)', color: '#CBD5E1' },
  Maintenance: { bg: 'rgba(239,68,68,0.14)', color: '#EF4444' },
}

function SignalTile({
  label,
  value,
  unit,
}: {
  label: string
  value: string | number
  unit: string
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '10px',
        bgcolor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Typography sx={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={0.75} alignItems="baseline" sx={{ mt: 0.5 }}>
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: '"JetBrains Mono", monospace',
            color: '#F8FAFC',
          }}
        >
          {value}
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#64748B' }}>{unit}</Typography>
      </Stack>
    </Box>
  )
}

export default function MachineDetail() {
  const { id = 'CNC-01' } = useParams()
  const navigate = useNavigate()
  const { isLoading: catalogueLoading, refresh: refreshCatalogue } = useCatalogue()
  const {
    fleetMachines,
    fleetTools,
    fleetJobs,
    fleetMaterials,
    setMachineId,
    setToolId,
    setMaterialId,
    mountToolOnMachine,
    assignMaterialToMachine,
    deleteMachine,
  } = useSelection()

  const activeMachine = useMemo(
    () => fleetMachines.find((item) => item.id === id) ?? fleetMachines[0],
    [id, fleetMachines],
  )

  const selected = useMemo(
    () =>
      selectedFrom(
        activeMachine.id,
        activeMachine.currentToolId ?? 'TL-001',
        fleetJobs[activeMachine.id]?.materialId ?? 'aisi4140',
        fleetMachines,
        fleetTools,
        fleetJobs,
        fleetMaterials,
      ),
    [activeMachine, fleetMachines, fleetTools, fleetJobs, fleetMaterials],
  )

  const [signals, setSignals] = useState<LiveSignals>(() => createLiveSignals(selected.job))
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)
  const [prepared, setPrepared] = useState(false)

  useEffect(() => {
    setMachineId(selected.machine.id)
    setToolId(selected.tool.id)
    setMaterialId(selected.material.id)
    setSignals(createLiveSignals(selected.job))
    setPrepared(false)

    const handle = window.setInterval(() => {
      setSignals(createLiveSignals(selected.job))
    }, 2400)
    return () => window.clearInterval(handle)
  }, [
    selected.machine.id,
    selected.tool.id,
    selected.material.id,
    selected.job,
    setMachineId,
    setToolId,
    setMaterialId,
  ])

  const metrics = useMemo(
    () => getToolMetrics(selected.tool, selected.material, selected.job),
    [selected.tool, selected.material, selected.job],
  )

  const machineStatusStyle = statusColor[selected.machine.status]
  const mrrValue = mrr(metrics.vc, selected.job.feed, selected.job.depth, selected.job.width)

  const alertSeverity =
    metrics.status === 'Critical'
      ? 'error'
      : metrics.status === 'Monitor'
        ? 'warning'
        : 'success'

  return (
    <Stack spacing={4} sx={{ maxWidth: 1280, mx: 'auto', pb: 8 }}>
      <MachineSubTabs machineId={selected.machine.id} />

      {/* One-row Header: Machine selector + Simulated data pill + Refresh + "..." Menu */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 230 }, width: { xs: '100%', sm: 'auto' } }}>
            <InputLabel>Machine</InputLabel>
            <Select
              label="Machine"
              value={selected.machine.id}
              onChange={(e) => navigate(`/machines/${e.target.value}`)}
              sx={{ borderRadius: '8px', bgcolor: '#14181D' }}
            >
              {fleetMachines.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.id} · {m.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tooltip title="Spindle telemetry is simulated; remaining life, wear %, and cost savings are calculated via Taylor physics.">
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

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Refresh machine telemetry">
            <IconButton
              onClick={() => {
                refreshCatalogue()
                setSignals(createLiveSignals(selected.job))
              }}
              aria-label="Refresh machine"
              sx={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', bgcolor: '#14181D' }}
            >
              <RefreshCw size={18} />
            </IconButton>
          </Tooltip>

          <IconButton
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-label="More machine actions"
            sx={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', bgcolor: '#14181D' }}
          >
            <MoreVertical size={18} />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem
              disabled={fleetMachines.length <= 1}
              onClick={() => {
                setMenuAnchor(null)
                deleteMachine(selected.machine.id)
                navigate('/dashboard')
              }}
              sx={{ color: '#DC2626', fontSize: 14 }}
            >
              Remove machine
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>

      {catalogueLoading && <LinearProgress sx={{ borderRadius: 2 }} />}

      {/* ONE-line Alert Banner + Single "Prepare" button */}
      <Alert
        severity={alertSeverity}
        sx={{
          borderRadius: '12px',
          alignItems: 'center',
          '& .MuiAlert-message': { width: '100%' },
        }}
        action={
          <Button
            size="small"
            variant="outlined"
            color={alertSeverity}
            onClick={() => setPrepared(true)}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            {prepared ? 'Prepared' : 'Prepare'}
          </Button>
        }
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
          Tool {selected.tool.id} has ~{metrics.remainingMin} min left. Stage backup tool in T05 before part{' '}
          {selected.job.partsCompleted}/{selected.job.batchSize}.
        </Typography>
      </Alert>

      {/* ONE Machine Summary Card with 3 Columns */}
      <Card sx={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography sx={{ fontSize: 12, color: '#64748B', mb: 0.5 }}>Machine</Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
                  {selected.machine.id} · {selected.machine.name}
                </Typography>
                <Chip
                  label={selected.machine.status}
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    bgcolor: machineStatusStyle.bg,
                    color: machineStatusStyle.color,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
              </Stack>
              <Typography sx={{ fontSize: 13, color: '#64748B', mt: 0.5 }}>
                {selected.machine.controller} · {selected.machine.location}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Active tool</InputLabel>
                <Select
                  label="Active tool"
                  value={selected.tool.id}
                  onChange={(e) => mountToolOnMachine(selected.machine.id, e.target.value)}
                  sx={{ borderRadius: '8px' }}
                >
                  {fleetTools.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.id} · {t.name} ({t.pocket})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Workpiece material</InputLabel>
                <Select
                  label="Workpiece material"
                  value={selected.material.id}
                  onChange={(e) => assignMaterialToMachine(selected.machine.id, e.target.value)}
                  sx={{ borderRadius: '8px' }}
                >
                  {fleetMaterials.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name} ({m.hardness})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography sx={{ fontSize: 12, color: '#64748B', mt: 0.75 }}>
                Recommended Vc: {selected.material.vcMin}–{selected.material.vcMax} m/min
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Row 1: Left 60% CNC 3D Twin (420px) + Right 40% Tool Twin */}
      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 7 }}>
          <CNCMachine3D
            machine={selected.machine}
            tool={selected.tool}
            material={selected.material}
            rpm={selected.job.rpm}
            feed={selected.job.feed}
            wear={selected.job.vbWearMm}
            job={selected.job}
            height={420}
            showPanel={false}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <ToolMagazineTwinPanel
            machine={selected.machine}
            toolsList={fleetTools}
            material={selected.material}
            job={selected.job}
            onMountTool={mountToolOnMachine}
            showTwin
            showCatalogue={false}
          />
        </Grid>
      </Grid>

      {/* Row 2: Process Signals (3x2 Grid + More signals expander) */}
      <Card sx={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
              Process signals
            </Typography>
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
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 6, md: 4 }}>
              <SignalTile label="Spindle speed" value={Math.round(signals.rpm)} unit="RPM" />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <SignalTile label="Feed" value={metrics.feed} unit="mm/tooth" />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <SignalTile
                label="Depth × width"
                value={`${selected.job.depth} × ${selected.job.width}`}
                unit="mm"
              />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <SignalTile label="Spindle load" value={Math.round(signals.load)} unit="%" />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <SignalTile label="Vibration" value={signals.vibration.toFixed(1)} unit="mm/s" />
            </Grid>
            <Grid size={{ xs: 6, md: 4 }}>
              <SignalTile label="Coolant temp" value={Math.round(signals.temperature)} unit="°C" />
            </Grid>
          </Grid>

          <Accordion
            elevation={0}
            disableGutters
            sx={{
              mt: 2,
              bgcolor: 'transparent',
              '&:before': { display: 'none' },
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <AccordionSummary expandIcon={<ChevronDown size={16} />} sx={{ px: 0, minHeight: 40 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1565C0' }}>
                More signals
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pt: 0 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <SignalTile label="Material removal" value={mrrValue} unit="cm³/min" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <SignalTile label="Part cycle time" value={selected.job.cycleTimeSec} unit="sec" />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <SignalTile label="Coolant delivery" value={selected.job.coolant} unit="mode" />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Row 3: Full-width Tool Life & Decision Card */}
      <ToolLifeDecisionCard
        machine={selected.machine}
        tool={selected.tool}
        material={selected.material}
        job={selected.job}
      />

      {/* Floating "Ask AI" Button + Slide-over Drawer */}
      <Button
        variant="contained"
        startIcon={<Sparkles size={16} />}
        onClick={() => setAiDrawerOpen(true)}
        sx={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 1200,
          borderRadius: '12px',
          px: 2.5,
          py: 1.25,
          textTransform: 'none',
          fontWeight: 600,
          bgcolor: '#1565C0',
          boxShadow: '0 8px 24px rgba(21,101,192,.28)',
        }}
      >
        Ask AI
      </Button>

      <Drawer
        anchor="right"
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 2.5, bgcolor: '#14181D' } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
            AI Tooling Assistant
          </Typography>
          <IconButton onClick={() => setAiDrawerOpen(false)} aria-label="Close AI drawer">
            <X size={18} />
          </IconButton>
        </Stack>

        <AiAssistantCard
          machine={selected.machine}
          tool={selected.tool}
          material={selected.material}
          job={selected.job}
          actualTimeMin={metrics.actualCutMin}
          predictedTimeMin={metrics.remainingMin}
          score={metrics.score}
          savings={metrics.savingInr}
        />
      </Drawer>
    </Stack>
  )
}
