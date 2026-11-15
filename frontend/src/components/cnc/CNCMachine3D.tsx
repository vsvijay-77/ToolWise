import { Suspense, useEffect, useRef, useState } from 'react'
import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { jobs, machineDesignLabels, type Job, type Machine, type Material, type Tool } from '../../data'
import { getToolMetrics } from '../../utils/toolMetrics'
import { LiveStatusChip } from './TwinStatusPanel'
import { MachineModelByType, resolveDesignType } from './MachineModels3D'

type CameraView = 'Iso' | 'Front' | 'Top' | 'Tool'
const VIEWS: CameraView[] = ['Iso', 'Front', 'Top', 'Tool']
const TOUR_MS = 5000
const TRANSITION_S = 1.6
const viewPositions: Record<CameraView, Vector3> = {
  Iso: new Vector3(2.75, 2.65, 5.1),
  Front: new Vector3(0, 2.05, 5.5),
  Top: new Vector3(0, 5.8, 2.2),
  Tool: new Vector3(0.85, 1.85, 2.45),
}
const viewTargets: Record<CameraView, Vector3> = {
  Iso: new Vector3(0, 1.05, 0),
  Front: new Vector3(0, 1.05, 0),
  Top: new Vector3(0, 1.0, 0),
  Tool: new Vector3(0, 1.25, 0.05),
}
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function CameraRig({ view, machineId }: { view: CameraView; machineId: string }) {
  const camera = useThree(state => state.camera)
  const controls = useThree(state => state.controls) as OrbitControlsImpl | null
  const anim = useRef({ t: 0, fromPos: new Vector3(), fromTarget: new Vector3(), started: false })
  useEffect(() => {
    anim.current.t = 0
    anim.current.started = false
  }, [view, machineId])
  useFrame((_, delta) => {
    const a = anim.current
    if (a.t >= 1) return
    if (!a.started) {
      a.fromPos.copy(camera.position)
      a.fromTarget.copy(controls?.target ?? viewTargets.Iso)
      a.started = true
    }
    a.t = Math.min(1, a.t + delta / TRANSITION_S)
    const e = easeInOutCubic(a.t)
    camera.position.lerpVectors(a.fromPos, viewPositions[view], e)
    if (controls) {
      controls.target.lerpVectors(a.fromTarget, viewTargets[view], e)
      controls.update()
    } else camera.lookAt(viewTargets[view])
  })
  return null
}

function MachineScene({
  machine,
  tool,
  material,
  rpm,
  wear,
  view,
  onInteract,
}: {
  machine: Machine
  tool: Tool
  material: Material
  rpm: number
  wear: number
  view: CameraView
  onInteract?: () => void
}) {
  const machineGroupRef = useRef<import('three').Group>(null)

  useFrame(({ clock }) => {
    if (machineGroupRef.current) {
      // Smoothly oscillate within a front-facing ±16° showcase arc so the solid back wall never blocks the camera
      machineGroupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.55) * 0.28
    }
  })

  return (
    <>
      <CameraRig view={view} machineId={machine.id} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />
      <directionalLight position={[-3, 2, -4]} intensity={0.7} />
      <group ref={machineGroupRef} position={[0, 0.32, 0]} scale={0.94}>
        <MachineModelByType
          machine={machine}
          tool={tool}
          material={material}
          rpm={rpm}
          wearPct={(wear / tool.vb_limit_mm) * 100}
        />
      </group>
      <ContactShadows position={[0, 0.33, 0]} opacity={0.28} scale={7} blur={2} />
      <OrbitControls
        makeDefault
        target={[0, 1.05, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.9}
        maxDistance={8.5}
        minPolarAngle={0.18}
        maxPolarAngle={Math.PI / 2.15}
        minAzimuthAngle={-Math.PI / 3.2}
        maxAzimuthAngle={Math.PI / 3.2}
        onStart={onInteract}
      />
      <Environment preset="warehouse" />
    </>
  )
}

export function CNCMachine3D({
  machine,
  tool,
  material,
  rpm,
  wear,
  height = 560,
  job,
  showPanel = true,
  autoTour = true,
}: {
  machine: Machine
  tool: Tool
  material: Material
  rpm: number
  feed?: number
  wear: number
  height?: number
  job?: Job
  showPanel?: boolean
  autoTour?: boolean
}) {
  const [view, setView] = useState<CameraView>('Iso')
  const [touring, setTouring] = useState(autoTour)
  const activeJob = job ?? jobs[machine.id] ?? jobs['CNC-01']
  const designInfo = machineDesignLabels[resolveDesignType(machine)]
  const metrics = getToolMetrics(tool, material, activeJob)
  const canvasHeight = Math.max(260, height - (showPanel ? 96 : 52))

  // Re-center to Iso whenever the user selects a different machine
  useEffect(() => {
    setView('Iso')
  }, [machine.id])

  useEffect(() => {
    if (!touring) return
    const id = window.setTimeout(() => setView(current => VIEWS[(VIEWS.indexOf(current) + 1) % VIEWS.length]), TOUR_MS)
    return () => window.clearTimeout(id)
  }, [touring, view])

  const riskLabel = metrics.status === 'Critical' ? 'High' : metrics.status === 'Monitor' ? 'Moderate' : 'Low'

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: 'hidden',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        bgcolor: '#14181D',
      }}
    >
      {/* Header bar ABOVE the canvas — zero overlap */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.25}
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          bgcolor: '#14181D',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25} flexWrap="wrap" useFlexGap>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
            Live {designInfo.category} twin
          </Typography>
          <LiveStatusChip machine={machine} />
        </Stack>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_, next: CameraView | null) => {
            if (!next) return
            setTouring(false)
            setView(next)
          }}
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
              '&.Mui-selected': {
                bgcolor: '#14181D',
                color: '#1565C0',
                boxShadow: '0 1px 2px rgba(15,23,42,.08)',
              },
            },
          }}
        >
          {VIEWS.map(v => (
            <ToggleButton key={v} value={v}>
              {v}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>

      {/* Dark 3D scene canvas — no text overlaid */}
      <Box
        sx={{
          height: canvasHeight,
          background: 'radial-gradient(115% 85% at 65% 15%, #1E293B 0%, #0F172A 65%, #090D16 100%)',
          position: 'relative',
        }}
      >
        <Suspense
          fallback={
            <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
              <CircularProgress size={28} sx={{ color: '#60A5FA' }} />
            </Box>
          }
        >
          <Canvas dpr={[1, 2]} shadows camera={{ position: [6.5, 4.5, 7.5], fov: 38 }} gl={{ antialias: true, toneMapping: 4 }} style={{ background: 'transparent' }}>
            <MachineScene
              machine={machine}
              tool={tool}
              material={material}
              rpm={rpm}
              wear={wear}
              view={view}
              onInteract={() => setTouring(false)}
            />
          </Canvas>
        </Suspense>
      </Box>

      {/* Single status strip below the canvas */}
      {showPanel && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1}
          sx={{
            px: 2.5,
            py: 1.25,
            bgcolor: 'rgba(255,255,255,0.03)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
            Tool change in {metrics.remainingMin} min
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: '#94A3B8' }}>
            Running {tool.id} ({material.name}) · Break risk: {riskLabel} · Next tool: T05 Sister
          </Typography>
        </Stack>
      )}
    </Paper>
  )
}
