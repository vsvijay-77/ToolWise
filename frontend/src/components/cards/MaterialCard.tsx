import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { ListPlus, Play } from 'lucide-react'
import type { IsoGroup, Material } from '../../data'

const isoBadgeColors: Record<IsoGroup, { bg: string; fg: string; border: string }> = {
  'ISO N': { bg: '#ECFDF5', fg: '#047857', border: '#A7F3D0' },
  'ISO P': { bg: '#EFF6FF', fg: '#1D4ED8', border: '#BFDBFE' },
  'ISO S': { bg: '#FFFBEB', fg: '#B45309', border: '#FDE68A' },
  'ISO M': { bg: '#FEFCE8', fg: '#A16207', border: '#FEF08A' },
  'ISO K': { bg: '#FEF2F2', fg: '#B91C1C', border: '#FECACA' },
  'ISO H': { bg: '#F1F5F9', fg: '#334155', border: '#CBD5E1' },
}

export function MaterialCard({
  material,
  onAssign,
  onQueue,
  activeMachineId,
}: {
  material: Material
  onAssign?: () => void
  onQueue?: () => void
  activeMachineId?: string
}) {
  const isoStyle = isoBadgeColors[material.isoGroup] ?? isoBadgeColors['ISO P']

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2.25, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Header: 64x64 Material Billet Thumbnail + Name + ISO Badge */}
        <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              component="img"
              src={material.imageUrl}
              alt={material.name}
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.08)',
                flexShrink: 0,
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontSize: 16, lineHeight: 1.25 }} noWrap>
                {material.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                {material.group} · {material.hardness}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  color: '#94A3B8',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Vc {material.vcMin}–{material.vcMax} m/min
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={material.isoGroup}
            size="small"
            sx={{
              height: 22,
              fontSize: 10.5,
              fontWeight: 800,
              bgcolor: isoStyle.bg,
              color: isoStyle.fg,
              border: `1px solid ${isoStyle.border}`,
              flexShrink: 0,
            }}
          />
        </Stack>

        {/* Factory Context Pills */}
        <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="caption" fontWeight={700} color="#F8FAFC" sx={{ display: 'block', mb: 0.75 }} noWrap>
            {material.factoryContext.partName}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip
              label={`Wear ${material.factoryContext.wearMultiplier}x`}
              size="small"
              color={material.factoryContext.wearMultiplier >= 2 ? 'warning' : 'default'}
              variant="outlined"
              sx={{ height: 22, fontSize: 11 }}
            />
            <Chip
              label={material.factoryContext.operationType}
              size="small"
              sx={{ height: 22, fontSize: 11, bgcolor: '#14181D', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <Chip
              label={material.factoryContext.coolantStrategy}
              size="small"
              sx={{ height: 22, fontSize: 11, bgcolor: '#14181D', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <Chip
              label={material.factoryContext.recommendedCutter}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 22, fontSize: 11 }}
            />
          </Stack>
        </Box>

        {/* Quick Actions */}
        {(onAssign || onQueue) && (
          <Stack direction="row" spacing={1} sx={{ mt: 'auto', pt: 0.5 }}>
            {onAssign && (
              <Button
                size="small"
                variant="contained"
                startIcon={<Play size={13} />}
                onClick={onAssign}
                sx={{ flex: 1, fontSize: 12 }}
              >
                Assign {activeMachineId ?? ''}
              </Button>
            )}
            {onQueue && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<ListPlus size={13} />}
                onClick={onQueue}
                sx={{ flex: 1, fontSize: 12 }}
              >
                Add to Queue
              </Button>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
