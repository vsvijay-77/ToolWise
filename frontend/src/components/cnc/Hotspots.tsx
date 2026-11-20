import { Html } from '@react-three/drei'
import { Box, Typography } from '@mui/material'

type Spot = {
  position: [number, number, number]
  title: string
  value: string
  colour: string
  anchor: 'left' | 'right'
}

function Label({ title, value, colour, anchor }: Omit<Spot, 'position'>) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.15,
        py: 0.5,
        borderRadius: 999,
        whiteSpace: 'nowrap',
        bgcolor: 'rgba(20,24,29,0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 16px rgba(15,23,42,.12)',
        transform: anchor === 'left' ? 'translate(-100%, -50%)' : 'translate(0%, -50%)',
        pointerEvents: 'none',
        transition: 'all .35s ease',
      }}
    >
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: colour, boxShadow: `0 0 0 3px ${colour}26` }} />
      <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: '#64748B', letterSpacing: '.06em' }}>{title}</Typography>
      <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#F8FAFC', fontFamily: '"JetBrains Mono", monospace' }}>{value}</Typography>
    </Box>
  )
}

export function Hotspots({
  rpm,
  feed,
  toolId,
  wear,
  wearLimit,
  minutesToBreak,
  visible,
}: {
  rpm: number
  feed: number
  toolId: string
  wear: number
  wearLimit: number
  minutesToBreak?: number
  visible: boolean
}) {
  if (!visible) return null
  const wearPct = (wear / wearLimit) * 100
  const wearColour = wearPct >= 85 ? '#D32F2F' : wearPct >= 60 ? '#ED6C02' : '#2E7D32'

  // Spread across distinct quadrants around the machine so labels never collide in Iso, Front, Top, or Tool views
  const spots: Spot[] = [
    { position: [-0.85, 2.55, 0.2], title: 'SPINDLE', value: `${rpm.toLocaleString()} rpm`, colour: '#1565C0', anchor: 'left' },
    { position: [0.85, 2.05, 0.35], title: 'TOOL', value: toolId, colour: '#5E35B1', anchor: 'right' },
    { position: [-1.15, 1.35, 0.55], title: 'FEED', value: `${feed} mm/t`, colour: '#00897B', anchor: 'left' },
    {
      position: [0.95, 1.25, 0.65],
      title: 'WEAR',
      value: `${wearPct.toFixed(0)}%${minutesToBreak !== undefined ? ` · ${Math.round(minutesToBreak)}m` : ''}`,
      colour: wearColour,
      anchor: 'right',
    },
  ]

  return (
    <>
      {spots.map(spot => (
        <Html key={spot.title} position={spot.position} zIndexRange={[5, 0]}>
          <Label title={spot.title} value={spot.value} colour={spot.colour} anchor={spot.anchor} />
        </Html>
      ))}
    </>
  )
}
