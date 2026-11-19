import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Grid as DreiGrid, Html, OrbitControls } from '@react-three/drei'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  ArrowRight,
  ExternalLink,
  Factory,
  Plus,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  jobs as defaultJobs,
  machineDesignLabels,
  materials,
  type Job,
  type Machine,
  type MachineCategory,
  type MachineDesignType,
  type MachineStatus,
  type Material,
  type Tool,
  type ToolType,
} from '../../data'
import { useSelection } from '../../context/SelectionContext'
import { MachineModelByType, resolveDesignType } from './MachineModels3D'

const statusMeta: Record<MachineStatus, { color: string; bg: string; label: string }> = {
  Running: { color: '#2E7D32', bg: 'rgba(46,125,50,.12)', label: 'RUNNING' },
  Idle: { color: '#ED6C02', bg: 'rgba(237,108,2,.12)', label: 'IDLE' },
  Maintenance: { color: '#D32F2F', bg: 'rgba(211,47,47,.12)', label: 'MAINTENANCE' },
  Offline: { color: '#64748B', bg: 'rgba(100,116,139,.12)', label: 'OFFLINE' },
}

const CNC_DESIGNS: MachineDesignType[] = ['CNC-VMC', 'CNC-Turning', 'CNC-5Axis']
const PLC_DESIGNS: MachineDesignType[] = ['PLC-Conveyor', 'PLC-Robotic', 'PLC-DrillStation']

/** 3D position on the white lined factory floor for each CNC/PLC machine */
const bayPosition = (index: number): [number, number, number] => {
  const cols = 3
  const row = Math.floor(index / cols)
  const col = index % cols
  return [(col - 1) * 7.8, 0, row * 7.2 - 3.2]
}

function FactoryCameraRig({
  focusMode,
  selectedPos,
}: {
  focusMode: 'overview' | 'focus'
  selectedPos: [number, number, number]
}) {
  const camera = useThree(state => state.camera)
  const controls = useThree(state => state.controls) as OrbitControlsImpl | null
  const anim = useRef({ t: 0, fromPos: new Vector3(), fromTarget: new Vector3(), started: false })

  const targetPos = useMemo(
    () =>
      focusMode === 'overview'
        ? new Vector3(0, 14.0, 18.5)
        : new Vector3(selectedPos[0] + 3.4, 2.9, selectedPos[2] + 4.2),
    [focusMode, selectedPos]
  )

  const lookAtPos = useMemo(
    () =>
      focusMode === 'overview'
        ? new Vector3(0, 0.6, 0.2)
        : new Vector3(selectedPos[0], 1.1, selectedPos[2]),
    [focusMode, selectedPos]
  )

  useEffect(() => {
    anim.current.t = 0
    anim.current.started = false
  }, [targetPos, lookAtPos])

  useFrame((_, delta) => {
    const a = anim.current
    if (a.t >= 1) return
    if (!a.started) {
      a.fromPos.copy(camera.position)
      a.fromTarget.copy(controls?.target ?? new Vector3(0, 0.6, 0))
      a.started = true
    }
    a.t = Math.min(1, a.t + delta / 1.1)
    const ease = a.t < 0.5 ? 4 * a.t * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 3) / 2
    camera.position.lerpVectors(a.fromPos, targetPos, ease)
    if (controls) {
      controls.target.lerpVectors(a.fromTarget, lookAtPos, ease)
      controls.update()
    } else {
      camera.lookAt(lookAtPos)
    }
  })

  return null
}

/** 3D Bay Unit on the White-Lined Floor with Unique 3D Architecture, Open Page click, and Delete button */
function FactoryBayUnit3D({
  machine,
  tool,
  material,
  job,
  index,
  position,
  selected,
  canDelete,
  onOpenPage,
  onDelete,
}: {
  machine: Machine
  tool: Tool
  material: Material
  job: Job
  index: number
  position: [number, number, number]
  selected: boolean
  canDelete: boolean
  onOpenPage: () => void
  onDelete: () => void
}) {
  const wearPct = (job.vbWearMm / tool.vb_limit_mm) * 100
  const meta = statusMeta[machine.status]
  const designType = resolveDesignType(machine, index)
  const designInfo = machineDesignLabels[designType]

  return (
    <group
      position={position}
      scale={0.76}
      onClick={event => {
        event.stopPropagation()
        onOpenPage()
      }}
    >
      {/* White floor bay boundary pad + glowing selection border */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[5.1, 0.03, 4.1]} />
        <meshStandardMaterial color={selected ? '#E3F0FF' : '#FFFFFF'} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.35, 2.52, 4]} />
        <meshBasicMaterial color={selected ? '#1565C0' : '#CBD5E1'} />
      </mesh>

      {/* Distinct 3D Machine Model by CNC / PLC Type */}
      <MachineModelByType
        machine={machine}
        tool={tool}
        material={material}
        rpm={job.rpm}
        wearPct={wearPct}
        fallbackIndex={index}
      />

      {/* Interactive Badge above each 3D Machine: Click to open specific page + Delete button */}
      <Html position={[0, 2.85, 0]} center zIndexRange={[4, 0]}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{
            px: 1.15,
            py: 0.45,
            borderRadius: 999,
            whiteSpace: 'nowrap',
            bgcolor: selected ? '#1D4ED8' : 'rgba(20,24,29,0.92)',
            backdropFilter: 'blur(8px)',
            color: '#F8FAFC',
            border: selected ? '1.5px solid #60A5FA' : '1px solid rgba(255,255,255,0.16)',
            boxShadow: selected ? '0 8px 22px rgba(59,130,246,.35)' : '0 4px 12px rgba(0,0,0,.45)',
            transition: 'all .25s ease',
            '&:hover': { transform: 'translateY(-2px)' },
          }}
        >
          <Box
            onClick={e => {
              e.stopPropagation()
              onOpenPage()
            }}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.65, cursor: 'pointer', pr: 0.4 }}
          >
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: selected ? '#A7F3D0' : meta.color }} />
            <Chip
              label={designInfo.category}
              size="small"
              sx={{
                height: 16,
                fontSize: 9,
                fontWeight: 800,
                px: 0.2,
                bgcolor: selected
                  ? 'rgba(255,255,255,.22)'
                  : designInfo.category === 'PLC'
                    ? 'rgba(20,184,166,.18)'
                    : 'rgba(59,130,246,.2)',
                color: selected ? '#FFFFFF' : designInfo.category === 'PLC' ? '#5EEAD4' : '#60A5FA',
              }}
            />
            <Typography sx={{ fontSize: 11, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', color: '#F8FAFC' }}>
              {machine.id}
            </Typography>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: selected ? '#E2E8F0' : '#CBD5E1' }}>
              · {machine.name}
            </Typography>
            <ExternalLink size={11} color="#94A3B8" />
          </Box>

          {canDelete && (
            <Tooltip title={`Delete ${machine.id}`}>
              <IconButton
                size="small"
                onClick={e => {
                  e.stopPropagation()
                  onDelete()
                }}
                sx={{
                  p: 0.35,
                  color: selected ? '#FCA5A5' : '#D32F2F',
                  '&:hover': { bgcolor: 'rgba(211,47,47,.14)' },
                }}
              >
                <Trash2 size={12} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Html>
    </group>
  )
}

/** 3D Rotating Tool Mesh for the Selected Tool Inspector */
export function FactoryFloor2D({
  selectedMachineId,
  onSelectMachine,
}: {
  machinesList?: Machine[]
  toolsList?: Tool[]
  selectedMachineId?: string
  onSelectMachine?: (machineId: string) => void
}) {
  const navigate = useNavigate()
  const {
    fleetMachines,
    fleetTools,
    fleetJobs,
    fleetMaterials,
    machineId: contextMachineId,
    setMachineId,
    addMachineWithTool,
    deleteMachine,
  } = useSelection()

  const activeMachineId = selectedMachineId ?? contextMachineId ?? fleetMachines[0]?.id ?? 'CNC-01'
  const activeMachineIndex = Math.max(0, fleetMachines.findIndex(m => m.id === activeMachineId))
  const activeMachine = fleetMachines[activeMachineIndex] ?? fleetMachines[0]

  const [cameraFocus, setCameraFocus] = useState<'overview' | 'focus'>('overview')

  //Unified "+ Add Machine & Tool" modal state
  const [addMachineOpen, setAddMachineOpen] = useState(false)
  const [category, setCategory] = useState<MachineCategory>('CNC')
  const [designType, setDesignType] = useState<MachineDesignType>('CNC-VMC')
  const [toolOption, setToolOption] = useState<'existing' | 'new'>('new')

  const [newMachine, setNewMachine] = useState({
    name: 'VMC 850 Pro',
    make: 'Mazak',
    controller: 'Fanuc 31i',
    status: 'Running' as MachineStatus,
    existingToolId: 'TL-001',
    weeklyRunHours: 80,
  })

  const [newTool, setNewTool] = useState({
    name: 'Ø16 High-Feed End Mill',
    type: 'End mill' as ToolType,
    coating: 'AlTiN',
    diameter_mm: 16,
    flute_count: 5,
    life_limit_min: 160,
    vb_limit_mm: 0.3,
    cost: 88,
    overhang_mm: 46,
    holder: 'BT40 hydraulic',
    pocket: 'T14',
    supplier: 'Sandvik',
  })

  const handleCategoryChange = (nextCategory: MachineCategory) => {
    setCategory(nextCategory)
    if (nextCategory === 'CNC') {
      const nextDesign = CNC_DESIGNS[fleetMachines.filter(m => (m.category ?? 'CNC') === 'CNC').length % CNC_DESIGNS.length]
      setDesignType(nextDesign)
      setNewMachine(prev => ({ ...prev, name: 'VMC 850 Pro', make: 'Mazak', controller: 'Fanuc 31i' }))
    } else {
      const nextDesign = PLC_DESIGNS[fleetMachines.filter(m => m.category === 'PLC').length % PLC_DESIGNS.length]
      setDesignType(nextDesign)
      setNewMachine(prev => ({ ...prev, name: 'PLC AutoStation 400', make: 'Siemens', controller: 'Simatic S7-1500 PLC' }))
    }
  }

  const handleOpenAddDialog = () => {
    // Automatically pick the next distinct 3D design so each added machine looks different
    const allDesigns: MachineDesignType[] = [...CNC_DESIGNS, ...PLC_DESIGNS]
    const nextDesign = allDesigns[fleetMachines.length % allDesigns.length]
    const nextCat = machineDesignLabels[nextDesign].category
    setCategory(nextCat)
    setDesignType(nextDesign)
    setAddMachineOpen(true)
  }

  /** Clicking a machine opens its specific Machine Detail page (/machines/:id) */
  const handleOpenMachinePage = (machine: Machine) => {
    setMachineId(machine.id)
    onSelectMachine?.(machine.id)
    navigate(`/machines/${machine.id}`)
  }

  const handleCreateMachineAndTool = () => {
    const nextNumber = fleetMachines.length + 1
    const prefix = category === 'PLC' ? 'PLC' : 'CNC'
    const machineId = `${prefix}-0${nextNumber}`

    let assignedToolId = newMachine.existingToolId
    let createdTool: Tool | undefined

    if (toolOption === 'new') {
      const nextToolNum = fleetTools.length + 10
      assignedToolId = `TL-0${nextToolNum}`
      createdTool = {
        id: assignedToolId,
        name: newTool.name.trim() || `Ø${newTool.diameter_mm} Custom Cutter`,
        type: newTool.type,
        material: 'Carbide',
        coating: newTool.coating,
        diameter_mm: Number(newTool.diameter_mm) || 12,
        flute_count: Number(newTool.flute_count) || 4,
        life_limit_min: Number(newTool.life_limit_min) || 150,
        vb_limit_mm: Number(newTool.vb_limit_mm) || 0.3,
        cost: Number(newTool.cost) || 65,
        overhang_mm: Number(newTool.overhang_mm) || 40,
        holder: newTool.holder,
        pocket: newTool.pocket,
        supplier: newTool.supplier,
      }
    }

    const createdMachine: Machine = {
      id: machineId,
      name: newMachine.name.trim() || `${prefix} Cell ${nextNumber}`,
      make: newMachine.make.trim() || (category === 'PLC' ? 'Siemens' : 'Makino'),
      controller: newMachine.controller.trim() || (category === 'PLC' ? 'Siemens S7-1500 PLC' : 'Fanuc 31i'),
      status: newMachine.status,
      currentToolId: assignedToolId,
      location: `Bay 0${nextNumber}`,
      category,
      designType,
      weeklyRunHours: Number(newMachine.weeklyRunHours) || 80,
    }

    addMachineWithTool(createdMachine, createdTool)
    setAddMachineOpen(false)
  }

  return (
    <Stack spacing={3}>
      {/* 1. 3D WHITE LINED WORKSPACE WITH ALL CNC & PLC MACHINES */}
      <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: '#14181D' }}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          alignItems={{ lg: 'center' }}
          spacing={1.5}
          mb={2}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                icon={<Factory size={13} />}
                label="3D CNC & PLC FACTORY WORKSPACE"
                size="small"
                sx={{
                  bgcolor: 'rgba(21,101,192,.10)',
                  color: 'primary.main',
                  fontWeight: 800,
                  letterSpacing: '.07em',
                  '& .MuiChip-icon': { color: 'primary.main' },
                }}
              />
              <Chip
                label={`${fleetMachines.filter(m => m.status === 'Running').length} of ${fleetMachines.length} Running`}
                size="small"
                color="success"
                variant="outlined"
              />
              <Chip label={`${fleetTools.length} Tools Loaded`} size="small" variant="outlined" />
            </Stack>
            <Typography variant="h5" sx={{ mt: 0.75 }}>
              Click any 3D CNC / PLC machine to open its dedicated page, or delete/add bays
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={cameraFocus}
              onChange={(_, val) => val && setCameraFocus(val)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.06)',
                borderRadius: 2,
                p: 0.35,
                '& .MuiToggleButton-root': { border: 0, borderRadius: 1.5, px: 1.4, fontWeight: 700, textTransform: 'none' },
              }}
            >
              <ToggleButton value="overview">All Bays (Overview)</ToggleButton>
              <ToggleButton value="focus">Focus {activeMachine.id}</ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={15} />}
              onClick={handleOpenAddDialog}
            >
              Add Machine & Tool
            </Button>
            <Button
              variant="outlined"
              size="small"
              endIcon={<ArrowRight size={15} />}
              onClick={() => handleOpenMachinePage(activeMachine)}
            >
              Open {activeMachine.id} Page
            </Button>
          </Stack>
        </Stack>

        {/* 3D White Space with Grid Lines and All CNC / PLC Machines */}
        <Box
          sx={{
            position: 'relative',
            height: 510,
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            bgcolor: '#14181D',
          }}
        >
          {/* Top Machine Strip: Click to open specific machine page, or click trash icon to delete */}
          <Stack
            direction="row"
            spacing={0.8}
            flexWrap="wrap"
            useFlexGap
            sx={{
              position: 'absolute',
              top: 14,
              left: 14,
              right: 14,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            {fleetMachines.map((machine, idx) => {
              const selected = machine.id === activeMachine.id
              const meta = statusMeta[machine.status]
              const dType = resolveDesignType(machine, idx)
              const cat = machineDesignLabels[dType].category
              return (
                <Chip
                  key={machine.id}
                  onClick={() => handleOpenMachinePage(machine)}
                  onDelete={fleetMachines.length > 1 ? () => deleteMachine(machine.id) : undefined}
                  deleteIcon={
                    <Tooltip title={`Delete ${machine.id}`}>
                      <Trash2 size={13} />
                    </Tooltip>
                  }
                  label={`${cat} · ${machine.id} ${machine.name}`}
                  size="small"
                  sx={{
                    pointerEvents: 'auto',
                    fontWeight: 800,
                    bgcolor: selected ? '#1D4ED8' : 'rgba(20,24,29,0.9)',
                    backdropFilter: 'blur(8px)',
                    color: '#F8FAFC',
                    border: selected ? '1px solid #60A5FA' : '1px solid rgba(255,255,255,0.16)',
                    boxShadow: '0 4px 12px rgba(0,0,0,.35)',
                    '&:hover': { bgcolor: selected ? '#1E40AF' : 'rgba(30,36,44,0.95)' },
                    '& .MuiChip-deleteIcon': {
                      color: selected ? 'rgba(255,255,255,.8)' : '#F87171',
                      '&:hover': { color: selected ? '#FFFFFF' : '#EF4444' },
                    },
                    '&::before': {
                      content: '""',
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: selected ? '#A7F3D0' : meta.color,
                      ml: 1,
                      mr: -0.4,
                    },
                  }}
                />
              )
            })}
          </Stack>

          <Suspense
            fallback={
              <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                <CircularProgress />
              </Box>
            }
          >
            <Canvas
              dpr={[1, 2]}
              shadows
              camera={{ position: [0, 11.5, 14.5], fov: 38 }}
              style={{ background: '#0B0E14' }}
            >
              <color attach="background" args={['#FFFFFF']} />
              <FactoryCameraRig focusMode={cameraFocus} selectedPos={bayPosition(activeMachineIndex)} />
              <ambientLight intensity={1.35} />
              <directionalLight position={[8, 14, 10]} intensity={2.1} castShadow />
              <directionalLight position={[-8, 6, -8]} intensity={0.75} />

              {/* White Workspace Floor with crisp architectural grid lines */}
              <DreiGrid
                position={[0, 0.005, 0]}
                args={[38, 30]}
                cellSize={1}
                cellThickness={0.75}
                cellColor="#E2E8F0"
                sectionSize={5}
                sectionThickness={1.35}
                sectionColor="#94A3B8"
                fadeDistance={38}
                fadeStrength={1}
              />

              {/* Render all CNC & PLC Machines with distinct 3D designs */}
              {fleetMachines.map((machine, idx) => {
                const job = fleetJobs[machine.id] ?? defaultJobs[machine.id] ?? defaultJobs['CNC-01']
                const tool = fleetTools.find(t => t.id === machine.currentToolId) ?? fleetTools[0]
                const mat = materials.find(m => m.id === job.materialId) ?? materials[0]
                return (
                  <FactoryBayUnit3D
                    key={machine.id}
                    machine={machine}
                    tool={tool}
                    material={mat}
                    job={job}
                    index={idx}
                    position={bayPosition(idx)}
                    selected={machine.id === activeMachine.id}
                    canDelete={fleetMachines.length > 1}
                    onOpenPage={() => handleOpenMachinePage(machine)}
                    onDelete={() => deleteMachine(machine.id)}
                  />
                )
              })}

              <ContactShadows position={[0, 0.01, 0]} opacity={0.22} scale={28} blur={2.4} />
              <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.08}
                minDistance={3.5}
                maxDistance={26}
                maxPolarAngle={Math.PI / 2.1}
              />
              <Environment preset="warehouse" />
            </Canvas>
          </Suspense>
        </Box>
      </Paper>

      {/* UNIFIED DIALOG: Add CNC or PLC Machine (with distinct 3D design) + Add/Select Tool inside */}
      <Dialog open={addMachineOpen} onClose={() => setAddMachineOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Add CNC or PLC Machine & Configure Mounted Tool
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {/* Step 1: Select CNC vs PLC Category & 3D Architecture Design */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} mb={1}>
                1. Select Machine Category & 3D Architecture Design
              </Typography>
              <ToggleButtonGroup
                exclusive
                value={category}
                onChange={(_, val) => val && handleCategoryChange(val)}
                size="small"
                sx={{ mb: 2 }}
              >
                <ToggleButton value="CNC" sx={{ px: 2.5, fontWeight: 800 }}>
                  CNC Machining Center
                </ToggleButton>
                <ToggleButton value="PLC" sx={{ px: 2.5, fontWeight: 800 }}>
                  PLC Automated Station
                </ToggleButton>
              </ToggleButtonGroup>

              <Grid container spacing={1.5}>
                {(category === 'CNC' ? CNC_DESIGNS : PLC_DESIGNS).map(dType => {
                  const info = machineDesignLabels[dType]
                  const active = designType === dType
                  return (
                    <Grid key={dType} size={{ xs: 12, sm: 4 }}>
                      <ButtonBase
                        onClick={() => setDesignType(dType)}
                        sx={{
                          width: '100%',
                          textAlign: 'left',
                          display: 'block',
                          p: 1.5,
                          borderRadius: 2.5,
                          border: active ? '2px solid #1565C0' : '1px solid rgba(255,255,255,0.08)',
                          bgcolor: active ? '#F0F7FF' : '#FFFFFF',
                        }}
                      >
                        <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: active ? 'primary.main' : 'text.primary' }}>
                          {info.label}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.4 }}>
                          {info.subtitle}
                        </Typography>
                      </ButtonBase>
                    </Grid>
                  )
                })}
              </Grid>
            </Box>

            <Divider />

            {/* Step 2: Machine Identity & Controller */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} mb={1.5}>
                2. Machine Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    label="Machine Name"
                    value={newMachine.name}
                    onChange={e => setNewMachine({ ...newMachine, name: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    label="Make / OEM"
                    value={newMachine.make}
                    onChange={e => setNewMachine({ ...newMachine, make: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    label="Controller / PLC"
                    value={newMachine.controller}
                    onChange={e => setNewMachine({ ...newMachine, controller: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2.4 }}>
                  <TextField
                    select
                    label="Initial Status"
                    value={newMachine.status}
                    onChange={e => setNewMachine({ ...newMachine, status: e.target.value as MachineStatus })}
                    fullWidth
                    size="small"
                  >
                    {(['Running', 'Idle', 'Maintenance', 'Offline'] as MachineStatus[]).map(st => (
                      <MenuItem key={st} value={st}>
                        {st}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 2.4 }}>
                  <TextField
                    type="number"
                    label="Runs / Week (hrs)"
                    value={newMachine.weeklyRunHours}
                    onChange={e => setNewMachine({ ...newMachine, weeklyRunHours: Number(e.target.value) })}
                    inputProps={{ min: 1, max: 168 }}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Step 3: Add Tool inside the Add Machine Flow */}
            <Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={1.5}>
                <Typography variant="subtitle2" fontWeight={800}>
                  3. Tool Configuration for This Machine
                </Typography>
                <RadioGroup
                  row
                  value={toolOption}
                  onChange={e => setToolOption(e.target.value as 'existing' | 'new')}
                >
                  <FormControlLabel value="new" control={<Radio size="small" />} label={<Typography variant="body2" fontWeight={700}>Add a New Tool</Typography>} />
                  <FormControlLabel value="existing" control={<Radio size="small" />} label={<Typography variant="body2" fontWeight={700}>Use Existing Tool</Typography>} />
                </RadioGroup>
              </Stack>

              {toolOption === 'existing' ? (
                <TextField
                  select
                  label="Select Existing Tool from Magazine"
                  value={newMachine.existingToolId}
                  onChange={e => setNewMachine({ ...newMachine, existingToolId: e.target.value })}
                  fullWidth
                  size="small"
                >
                  {fleetTools.map(tool => (
                    <MenuItem key={tool.id} value={tool.id}>
                      {tool.id} · {tool.name} ({tool.type} · Ø{tool.diameter_mm}mm · {tool.coating})
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="New Tool Name"
                      value={newTool.name}
                      onChange={e => setNewTool({ ...newTool, name: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      select
                      label="Tool Type"
                      value={newTool.type}
                      onChange={e => setNewTool({ ...newTool, type: e.target.value as ToolType })}
                      fullWidth
                      size="small"
                    >
                      {(['End mill', 'Drill', 'Turning insert'] as ToolType[]).map(t => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      select
                      label="Coating"
                      value={newTool.coating}
                      onChange={e => setNewTool({ ...newTool, coating: e.target.value })}
                      fullWidth
                      size="small"
                    >
                      {['AlTiN', 'TiSiN', 'AlCrN', 'TiN', 'CVD', 'TiAlN'].map(c => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Diameter (mm)"
                      type="number"
                      value={newTool.diameter_mm}
                      onChange={e => setNewTool({ ...newTool, diameter_mm: Number(e.target.value) })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Flutes"
                      type="number"
                      value={newTool.flute_count}
                      onChange={e => setNewTool({ ...newTool, flute_count: Number(e.target.value) })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Overhang (mm)"
                      type="number"
                      value={newTool.overhang_mm}
                      onChange={e => setNewTool({ ...newTool, overhang_mm: Number(e.target.value) })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      label="Life Limit (min)"
                      type="number"
                      value={newTool.life_limit_min}
                      onChange={e => setNewTool({ ...newTool, life_limit_min: Number(e.target.value) })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField
                      label="Holder"
                      value={newTool.holder}
                      onChange={e => setNewTool({ ...newTool, holder: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField
                      label="Pocket"
                      value={newTool.pocket}
                      onChange={e => setNewTool({ ...newTool, pocket: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Tool Cost (₹)"
                      type="number"
                      value={newTool.cost}
                      onChange={e => setNewTool({ ...newTool, cost: Number(e.target.value) })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAddMachineOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateMachineAndTool}>
            Place {category} Machine & Mount Tool in 3D Floor
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
