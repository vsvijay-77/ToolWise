import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  ButtonBase,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Cylinder, Environment, OrbitControls, Torus } from '@react-three/drei'
import type { Group } from 'three'
import { Box as BoxIcon, CheckCircle2, ChevronDown, Layers, Wrench } from 'lucide-react'
import type { Job, Machine, Material, Tool } from '../../data'
import { sisterToolFor } from '../../utils/toolForecast'
import { getToolMetrics } from '../../utils/toolMetrics'
import { money } from '../../utils/format'

const coatings: Record<string, string> = {
  AlTiN: '#454052',
  TiN: '#C49A28',
  TiSiN: '#8A6642',
  AlCrN: '#536C84',
  CVD: '#6D726F',
  TiAlN: '#5B4B6E',
  Uncoated: '#9FA7AF',
}

function RotatingTool3D({ tool, wearPct, spinning }: { tool: Tool; wearPct: number; spinning: boolean }) {
  const group = useRef<Group>(null)
  const coating = coatings[tool.coating] ?? '#5D6570'
  const tipColor = wearPct >= 80 ? '#D32F2F' : wearPct >= 55 ? '#ED6C02' : '#2E7D32'
  const radius = Math.max(0.14, tool.diameter_mm / 75)
  const flutes = useMemo(() => Array.from({ length: Math.min(tool.flute_count, 6) }, (_, index) => index), [tool.flute_count])

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * (spinning ? 2.4 : 0.6)
    }
  })

  return (
    <group ref={group} position={[0, 0.15, 0]}>
      <Cylinder args={[0.24, 0.34, 0.55, 36]} position={[0, 0.85, 0]}>
        <meshPhysicalMaterial color="#475569" metalness={0.88} roughness={0.22} />
      </Cylinder>
      <Cylinder args={[0.42, 0.42, 0.14, 36]} position={[0, 0.52, 0]}>
        <meshPhysicalMaterial color="#1E293B" metalness={0.9} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.32, 0.25, 0.38, 36]} position={[0, 0.26, 0]}>
        <meshPhysicalMaterial color="#64748B" metalness={0.85} roughness={0.25} />
      </Cylinder>
      <Cylinder args={[radius, radius, 1.05, 40]} position={[0, -0.42, 0]}>
        <meshPhysicalMaterial color={coating} metalness={0.85} roughness={0.26} />
      </Cylinder>
      {flutes.map(index => (
        <Torus
          key={index}
          args={[radius * 1.02, 0.016, 10, 28, Math.PI * 1.45]}
          position={[0, -0.15 - index * 0.16, 0]}
          rotation={[0.35, index * ((Math.PI * 2) / flutes.length), Math.PI / 2]}
        >
          <meshStandardMaterial color="#CBD5E1" metalness={0.85} roughness={0.22} />
        </Torus>
      ))}
      <Cylinder args={[radius * 1.04, radius * 0.86, 0.12, 40]} position={[0, -0.96, 0]}>
        <meshStandardMaterial color={tipColor} emissive={tipColor} emissiveIntensity={0.35} />
      </Cylinder>
    </group>
  )
}

function Tool2DBlueprint({ tool, wearPct, vbWear }: { tool: Tool; wearPct: number; vbWear: number }) {
  const coating = coatings[tool.coating] ?? '#5D6570'
  const tipColor = wearPct >= 80 ? '#D32F2F' : wearPct >= 55 ? '#ED6C02' : '#2E7D32'

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        bgcolor: '#14181D',
        backgroundImage:
          'linear-gradient(to right, rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,.18) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
        p: 2,
      }}
    >
      <svg viewBox="0 0 360 230" width="100%" height="100%" style={{ maxHeight: 225 }}>
        <line x1="24" y1="115" x2="336" y2="115" stroke="#94A3B8" strokeWidth="1" strokeDasharray="6 4" />
        <polygon points="36,82 95,72 95,158 36,148" fill="#64748B" stroke="#334155" strokeWidth="1.5" />
        <rect x="95" y="60" width="18" height="110" rx="3" fill="#1E293B" />
        <polygon points="113,70 158,82 158,148 113,160" fill="#475569" stroke="#1E293B" strokeWidth="1.5" />
        <rect x="158" y="92" width="132" height="46" rx="2" fill={coating} stroke="#0F172A" strokeWidth="1.5" />
        {[178, 202, 226, 250, 272].map(x => (
          <line key={x} x1={x} y1="92" x2={x + 14} y2="138" stroke="rgba(255,255,255,.45)" strokeWidth="2.5" />
        ))}
        <rect x="282" y="91" width="10" height="48" rx="2" fill={tipColor} />

        <line x1="158" y1="42" x2="290" y2="42" stroke="#1565C0" strokeWidth="1.5" />
        <line x1="158" y1="36" x2="158" y2="90" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="290" y1="36" x2="290" y2="90" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
        <text x="224" y="35" textAnchor="middle" fill="#1565C0" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono, monospace">
          Overhang: {tool.overhang_mm} mm
        </text>

        <line x1="312" y1="92" x2="312" y2="138" stroke="#00897B" strokeWidth="1.5" />
        <line x1="292" y1="92" x2="318" y2="92" stroke="#00897B" strokeWidth="1" />
        <line x1="292" y1="138" x2="318" y2="138" stroke="#00897B" strokeWidth="1" />
        <text x="320" y="119" fill="#00897B" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono, monospace">
          Ø{tool.diameter_mm}mm
        </text>

        <line x1="287" y1="142" x2="265" y2="184" stroke={tipColor} strokeWidth="1.5" />
        <rect x="175" y="184" width="160" height="26" rx="6" fill="#FFFFFF" stroke={tipColor} strokeWidth="1.5" />
        <text x="255" y="201" textAnchor="middle" fill={tipColor} fontSize="11" fontWeight="800" fontFamily="JetBrains Mono, monospace">
          VB Wear: {vbWear.toFixed(2)} / {tool.vb_limit_mm.toFixed(2)} mm
        </text>

        <text x="85" y="198" textAnchor="middle" fill="#475569" fontSize="10.5" fontWeight="700">
          {tool.holder} · {tool.pocket}
        </text>
      </svg>
    </Box>
  )
}

export function ToolMagazineTwinPanel({
  machine,
  toolsList,
  job,
  material,
  onMountTool,
  showTwin = true,
  showCatalogue = false,
}: {
  machine: Machine
  toolsList: Tool[]
  job: Job
  material: Material
  onMountTool: (machineId: string, toolId: string) => void
  showTwin?: boolean
  showCatalogue?: boolean
}) {
  const [selectedToolId, setSelectedToolId] = useState<string>(machine.currentToolId)
  const [toolViewMode, setToolViewMode] = useState<'3d' | '2d'>('3d')

  useEffect(() => {
    setSelectedToolId(machine.currentToolId)
  }, [machine.id, machine.currentToolId])

  const activeTool: Tool =
    toolsList.find(t => t.id === selectedToolId) ??
    toolsList.find(t => t.id === machine.currentToolId) ??
    toolsList[0]

  const metrics = getToolMetrics(activeTool, material, job)
  const sister = sisterToolFor(activeTool)

  const handlePickTool = (tool: Tool) => {
    setSelectedToolId(tool.id)
    onMountTool(machine.id, tool.id)
  }

  return (
    <Stack spacing={2.5}>
      {showTwin && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: '#14181D',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            height: '100%',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={1.5}
            mb={2}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Wrench size={18} color="#1565C0" />
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
                Tool twin
              </Typography>
            </Stack>

            <ToggleButtonGroup
              size="small"
              exclusive
              value={toolViewMode}
              onChange={(_, val) => val && setToolViewMode(val)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.06)',
                borderRadius: '8px',
                p: 0.35,
                '& .MuiToggleButton-root': {
                  border: 0,
                  borderRadius: '6px !important',
                  px: 1.5,
                  py: 0.4,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'none',
                  color: '#94A3B8',
                  '&.Mui-selected': { bgcolor: '#14181D', color: '#1565C0' },
                },
              }}
            >
              <ToggleButton value="3d">
                <BoxIcon size={13} style={{ marginRight: 5 }} />
                3D
              </ToggleButton>
              <ToggleButton value="2d">
                <Layers size={13} style={{ marginRight: 5 }} />
                2D
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* Single Selected Tool View (3D or 2D) */}
          {toolViewMode === '3d' ? (
            <Box
              sx={{
                height: 220,
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'radial-gradient(115% 85% at 65% 15%, #1E293B 0%, #0F172A 100%)',
                mb: 2.5,
              }}
            >
              <Suspense
                fallback={
                  <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
                    <CircularProgress size={24} sx={{ color: '#60A5FA' }} />
                  </Box>
                }
              >
                <Canvas dpr={[1, 2]} camera={{ position: [2.1, 0.9, 2.4], fov: 38 }}>
                  <ambientLight intensity={1.3} />
                  <directionalLight position={[3, 4, 3]} intensity={2.2} />
                  <RotatingTool3D tool={activeTool} wearPct={metrics.wearPct} spinning={machine.status === 'Running'} />
                  <ContactShadows position={[0, -1.1, 0]} opacity={0.25} scale={4} blur={2} />
                  <OrbitControls enablePan={false} minDistance={1.6} maxDistance={4.2} />
                  <Environment preset="warehouse" />
                </Canvas>
              </Suspense>
            </Box>
          ) : (
            <Box
              sx={{
                height: 220,
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                mb: 2.5,
              }}
            >
              <Tool2DBlueprint tool={activeTool} wearPct={metrics.wearPct} vbWear={metrics.wearMm} />
            </Box>
          )}

          {/* 2 Key Facts (Wear VB & Remaining moved to Tool Life & Decision Table A) */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              ['Tool ID / pocket', `${activeTool.id} · ${activeTool.pocket}`],
              ['Next sister tool', `${sister.id} (${sister.pocket})`],
            ].map(([label, val]) => (
              <Grid key={label} size={6}>
                <Typography sx={{ fontSize: 12, color: '#64748B' }}>{label}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', mt: 0.25 }}>
                  {val}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Collapsed Tool Details Accordion */}
          <Accordion
            elevation={0}
            disableGutters
            sx={{
              bgcolor: 'transparent',
              '&:before': { display: 'none' },
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <AccordionSummary expandIcon={<ChevronDown size={16} />} sx={{ px: 0, minHeight: 38 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1565C0' }}>
                Tool details
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pt: 0 }}>
              <Grid container spacing={1.5}>
                {[
                  ['Geometry', activeTool.type],
                  ['Coating', `${activeTool.material} · ${activeTool.coating}`],
                  ['Diameter & Flutes', `Ø${activeTool.diameter_mm} mm · ${activeTool.flute_count}F`],
                  ['Holder', `${activeTool.holder} · ${activeTool.overhang_mm} mm`],
                  ['Unit cost', `${money(activeTool.cost)} · ${activeTool.supplier}`],
                ].map(([label, val]) => (
                  <Grid key={label} size={6}>
                    <Typography sx={{ fontSize: 11.5, color: '#64748B' }}>{label}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>{val}</Typography>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}

      {showCatalogue && (
        <Paper sx={{ p: 3, bgcolor: '#14181D', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            spacing={1.25}
            mb={2}
          >
            <Box>
              <Typography variant="h6" sx={{ fontSize: 17, fontWeight: 800 }}>
                All Tools Magazine & Catalogue ({toolsList.length} Tools)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click any tool below to mount it on <b>{machine.id} · {machine.name}</b>
              </Typography>
            </Box>
            <Chip label={`Mounted: ${machine.currentToolId}`} color="primary" variant="outlined" size="small" />
          </Stack>

          <Grid container spacing={1.5}>
            {toolsList.map(tool => {
              const isSelected = tool.id === activeTool.id
              const isMounted = tool.id === machine.currentToolId
              const coatColor = coatings[tool.coating] ?? '#5D6570'

              return (
                <Grid key={tool.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <ButtonBase
                    onClick={() => handlePickTool(tool)}
                    sx={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'block',
                      p: 1.75,
                      borderRadius: 2.5,
                      border: isSelected ? '2px solid #1565C0' : '1px solid rgba(255,255,255,0.08)',
                      bgcolor: isSelected ? '#F4F9FF' : '#FFFFFF',
                      transition: 'all .18s ease',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                      <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: 1.5,
                            bgcolor: coatColor,
                            color: '#FFFFFF',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {tool.pocket}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: 'text.primary' }} noWrap>
                            {tool.id} · {tool.name}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
                            {tool.type} · Ø{tool.diameter_mm}mm · {tool.coating}
                          </Typography>
                        </Box>
                      </Stack>
                      {isMounted && (
                        <Chip label="Mounted" size="small" color="success" sx={{ height: 22, fontSize: 11, fontWeight: 800, flexShrink: 0 }} />
                      )}
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" mt={1.25} pt={1} borderTop="1px solid #F1F5F9">
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                        Holder: <b>{tool.holder}</b>
                      </Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', color: 'primary.main' }}>
                        {tool.life_limit_min}m · {money(tool.cost)}
                      </Typography>
                    </Stack>
                  </ButtonBase>
                </Grid>
              )
            })}
          </Grid>
        </Paper>
      )}
    </Stack>
  )
}
