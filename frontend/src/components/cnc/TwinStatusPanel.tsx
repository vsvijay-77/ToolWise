import { useEffect, useState } from 'react'
import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material'
import { keyframes } from '@mui/system'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRightLeft, CheckCircle2, Clock3, Cpu, OctagonAlert, PauseCircle, Wrench } from 'lucide-react'
import type { Job, Machine, Tool } from '../../data'
import { forecastTool, formatClockAt, formatCountdown, sisterToolFor, type ForecastSeverity } from '../../utils/toolForecast'

const pulse = keyframes`0% { box-shadow: 0 0 0 0 rgba(46,125,50,.55) } 70% { box-shadow: 0 0 0 8px rgba(46,125,50,0) } 100% { box-shadow: 0 0 0 0 rgba(46,125,50,0) }`
const blink = keyframes`50% { opacity: .55 }`

const tone: Record<ForecastSeverity, { main: string; soft: string; icon: typeof CheckCircle2 }> = {
  ok: { main: '#2E7D32', soft: 'rgba(46,125,50,.10)', icon: CheckCircle2 },
  watch: { main: '#1565C0', soft: 'rgba(21,101,192,.10)', icon: Clock3 },
  warning: { main: '#ED6C02', soft: 'rgba(237,108,2,.12)', icon: AlertTriangle },
  critical: { main: '#D32F2F', soft: 'rgba(211,47,47,.12)', icon: OctagonAlert },
}

const glass = {
  bgcolor: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 2.5,
  boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
  transition: 'background .3s ease, border-color .3s ease, box-shadow .25s ease, transform .25s ease',
  '&:hover': { boxShadow: '0 8px 22px rgba(0,0,0,0.36)', transform: 'translateY(-1px)' },
}

const wearColour = (pct: number) => (pct >= 85 ? '#D32F2F' : pct >= 60 ? '#ED6C02' : '#2E7D32')

export function LiveStatusChip({ machine }: { machine: Machine }) {
  const running = machine.status === 'Running'
  const colour = running ? '#2E7D32' : machine.status === 'Maintenance' ? '#ED6C02' : '#8A96A3'
  return (
    <Stack direction="row" alignItems="center" spacing={0.8} sx={{ ...glass, borderRadius: 999, px: 1.5, py: 0.65, width: 'fit-content' }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colour, animation: running ? `${pulse} 1.8s infinite` : 'none' }} />
      <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', color: colour }}>{running ? 'RUNNING' : machine.status.toUpperCase()}</Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>· {machine.id} {machine.name}</Typography>
    </Stack>
  )
}

export function TwinStatusPanel({ machine, tool, job, compact = false }: { machine: Machine; tool: Tool; job: Job; compact?: boolean }) {
  const running = machine.status === 'Running'
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setElapsed(value => value + 1), 1000)
    return () => window.clearInterval(id)
  }, [running])

  const forecast = forecastTool(tool, job, elapsed)
  const sister = sisterToolFor(tool)
  const t = tone[forecast.severity]
  const SeverityIcon = t.icon

  if (!running) {
    return (
      <Stack direction="row" spacing={1.75} alignItems="center" sx={{ ...glass, px: 2.25, py: 1.75 }}>
        <PauseCircle size={22} color="#8A96A3" />
        <Box>
          <Typography variant="body2" fontWeight={800}>Spindle stopped — {machine.status.toLowerCase()}</Typography>
          <Typography variant="caption" color="text.secondary">
            {tool.id} is mounted · {forecast.wearPct.toFixed(0)}% of wear limit used · forecast resumes when the machine runs
          </Typography>
        </Box>
      </Stack>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
      <Stack spacing={1.25}>
        {/* Action banner */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{
            ...glass,
            bgcolor: 'rgba(255,255,255,.94)',
            borderLeft: `4px solid ${t.main}`,
            px: 2,
            py: 1.25,
            '&:hover': {},
          }}
        >
          <Box
            sx={{
              p: 0.75,
              borderRadius: 1.75,
              bgcolor: t.soft,
              color: t.main,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              transition: 'all .5s ease',
              animation: forecast.severity === 'critical' ? `${blink} 1s infinite` : 'none',
            }}
          >
            <SeverityIcon size={18} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: t.main, lineHeight: 1.25 }}>{forecast.headline}</Typography>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.35, overflowWrap: 'anywhere' }}>{forecast.advice}</Typography>
          </Box>
          {!compact && (
            <Chip
              size="small"
              label={`Change at ${formatClockAt(forecast.minutesToChange)}`}
              sx={{ bgcolor: t.soft, color: t.main, fontWeight: 700, flexShrink: 0, display: { xs: 'none', sm: 'flex' } }}
            />
          )}
        </Stack>

        {/* Three insight tiles */}
        <Box
          sx={{
            display: 'grid',
            gap: 1.25,
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              lg: compact ? '1fr 1fr' : 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {/* Current tool */}
          <Box sx={{ ...glass, px: 2, py: 1.6, minWidth: 0, display: { xs: 'none', lg: compact ? 'none' : 'block' } }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Cpu size={14} color="#1565C0" />
              <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', color: 'text.secondary' }}>RUNNING TOOL</Typography>
            </Stack>
            <Typography sx={{ fontSize: 13, fontWeight: 800, mt: 0.5, lineHeight: 1.25 }} noWrap>
              {tool.id} · {tool.name}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.3 }} noWrap>
              {tool.coating} · {tool.pocket} · {job.operation}
            </Typography>
            <Stack direction="row" justifyContent="space-between" mt={0.85}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Wear (VB)</Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 800, fontFamily: '"JetBrains Mono", monospace', color: wearColour(forecast.wearPct) }}>
                {forecast.wearPct.toFixed(0)}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={forecast.wearPct}
              sx={{
                height: 6,
                borderRadius: 6,
                mt: 0.4,
                bgcolor: '#EEF2F6',
                '& .MuiLinearProgress-bar': {
                  bgcolor: wearColour(forecast.wearPct),
                  borderRadius: 6,
                  transition: 'transform .8s ease, background-color .5s ease',
                },
              }}
            />
          </Box>

          {/* Break countdown */}
          <Box sx={{ ...glass, px: 2, py: 1.6, minWidth: 0, background: `linear-gradient(135deg, rgba(255,255,255,.94), ${t.soft})` }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Clock3 size={14} color={t.main} />
              <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', color: 'text.secondary' }}>TOOL BREAK RISK IN</Typography>
            </Stack>
            <Typography
              sx={{
                fontSize: { xs: 19, sm: 21 },
                fontWeight: 800,
                mt: 0.35,
                color: t.main,
                fontFamily: '"JetBrains Mono", monospace',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-.01em',
                lineHeight: 1.2,
                transition: 'color .5s ease',
              }}
            >
              {formatCountdown(forecast.minutesToBreak)}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.3, lineHeight: 1.35 }}>
              Change in <b>{Math.round(forecast.minutesToChange)} min</b> (~{forecast.partsBeforeChange} parts)
            </Typography>
          </Box>

          {/* Next tool */}
          <Box sx={{ ...glass, px: 2, py: 1.6, minWidth: 0 }}>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <ArrowRightLeft size={14} color="#00897B" />
              <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', color: 'text.secondary' }}>NEXT TOOL TO LOAD</Typography>
            </Stack>
            <Stack direction="row" spacing={0.9} alignItems="center" mt={0.5}>
              <Box sx={{ p: 0.55, borderRadius: 1.5, bgcolor: 'rgba(0,137,123,.10)', color: '#00897B', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Wrench size={14} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.25 }} noWrap>
                  {sister.id} · {sister.pocket}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.3 }} noWrap>
                  Sister {tool.name}
                </Typography>
              </Box>
            </Stack>
            <Chip
              size="small"
              icon={<CheckCircle2 size={12} />}
              label={sister.status}
              sx={{
                mt: 0.7,
                height: 21,
                fontSize: 10.5,
                fontWeight: 700,
                bgcolor: 'rgba(46,125,50,.10)',
                color: '#2E7D32',
                '& .MuiChip-icon': { color: '#2E7D32' },
              }}
            />
          </Box>
        </Box>
      </Stack>
    </motion.div>
  )
}
