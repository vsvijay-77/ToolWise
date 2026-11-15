import { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { LineChart } from '@mui/x-charts/LineChart'
import { ArrowRight, Check, CheckCircle2, ChevronDown, ChevronUp, MoreVertical, Sparkles, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { type Job, type Machine, type Material, type Tool } from '../../data'
import { wearAtTime } from '../../utils/calculations'
import { money } from '../../utils/format'
import { sisterToolFor } from '../../utils/toolForecast'
import {
  getCostComparison,
  getToolDecision,
  getToolMetrics,
} from '../../utils/toolMetrics'

interface ToolLifeDecisionCardProps {
  machine: Machine
  tool?: Tool
  material: Material
  job: Job
  currency?: 'INR' | 'USD'
  onMountToolClick?: () => void
}

const statusPalette = {
  OK: { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.14)' },
  Monitor: { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)' },
  'Replace soon': { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)' },
  'Replace now': { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.16)' },
} as const

const COST_COLORS = {
  tool: '#3B82F6',
  downtime: '#F59E0B',
  scrap: '#EF4444',
  rework: '#A855F7',
}

export function ToolLifeDecisionCard({
  machine,
  tool,
  material,
  job,
  currency = 'INR',
  onMountToolClick,
}: ToolLifeDecisionCardProps) {
  const navigate = useNavigate()
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [doneIds, setDoneIds] = useState<Record<string, boolean>>({})

  const metrics = useMemo(
    () => (tool ? getToolMetrics(tool, material, job) : null),
    [tool, material, job],
  )
  const decision = useMemo(
    () => (tool ? getToolDecision(tool, material, job) : null),
    [tool, material, job],
  )
  const costComp = useMemo(
    () => (tool ? getCostComparison(tool, material, job) : null),
    [tool, material, job],
  )

  const wearChart = useMemo(() => {
    if (!tool || job.timeInCutMin <= 0 || !metrics) return null
    const maxT = Math.max(20, metrics.predictedLifeMin, Math.round(job.timeInCutMin))
    const steps = 6
    const x: string[] = []
    const actual: (number | null)[] = []
    const predicted: number[] = []
    const limitLine: number[] = []
    const planLine: number[] = []

    const planThreshold = Number((tool.vb_limit_mm * 0.7).toFixed(2))
    for (let i = 0; i <= steps; i++) {
      const t = Math.round((maxT / steps) * i)
      x.push(`${t}m`)
      predicted.push(Number((metrics.expectedWearRateMmPerMin * t).toFixed(3)))
      actual.push(
        t <= job.timeInCutMin
          ? Number(Math.min(tool.vb_limit_mm * 1.05, wearAtTime(t)).toFixed(3))
          : null,
      )
      limitLine.push(tool.vb_limit_mm)
      planLine.push(planThreshold)
    }
    return { x, actual, predicted, limitLine, planLine, planThreshold }
  }, [tool, job.timeInCutMin, metrics])

  const sister = useMemo(() => (tool ? sisterToolFor(tool) : null), [tool])

  const actions = useMemo(() => {
    if (!tool || !metrics || !sister || !decision) return []
    const atLimit = metrics.remainingMin <= 0 || metrics.wearPct >= 90
    const fasterWear = metrics.wearRateVariancePct > 10
    const coatingOk = material.recommendedCoatings.includes(tool.coating)
    const inspectIn = Math.max(1, Math.round(metrics.remainingMin / 2))

    const list = [
      {
        id: 'sister',
        priorityRank: 0,
        priority: atLimit ? 'Now' : 'Next part',
        priorityColor: atLimit ? '#EF4444' : '#F59E0B',
        title: atLimit
          ? `Swap to sister tool ${sister.id} (${sister.pocket}) before next cycle`
          : `Stage sister tool ${sister.id} in ${sister.pocket} for planned change`,
        reason: atLimit
          ? `Tool reached ${metrics.wearPct}% of its ${metrics.wearLimitMm.toFixed(2)} mm limit — changing now prevents unplanned failure.`
          : `~${metrics.remainingMin} min (${metrics.partsUntilReplacement} pcs) remaining before replacement threshold.`,
        impact: metrics.savingInr > 0 ? `Save ${money(metrics.savingInr, currency)}` : '',
      },
      {
        id: 'vc',
        priorityRank: fasterWear ? 1 : 2,
        priority: fasterWear ? 'Next part' : 'Next batch',
        priorityColor: fasterWear ? '#F59E0B' : '#3B82F6',
        title: fasterWear
          ? `Lower cutting speed Vc to ${material.vcMax} m/min`
          : `Keep current cutting speed (${metrics.vc} m/min) and feed`,
        reason: fasterWear
          ? `Observed wear rate is +${metrics.wearRateVariancePct}% faster than Taylor prediction.`
          : `Wear rate is ${Math.abs(metrics.wearRateVariancePct)}% slower than predicted — parameters are well matched.`,
        impact: fasterWear ? '+18 min life' : '',
      },
      {
        id: 'inspect',
        priorityRank: atLimit ? 1 : 2,
        priority: atLimit ? 'Now' : 'Next part',
        priorityColor: atLimit ? '#EF4444' : '#F59E0B',
        title: atLimit
          ? 'Inspect surface finish on last part before resuming'
          : `Schedule VB inspection in ${inspectIn} cutting min`,
        reason: atLimit
          ? `Flank wear is ${metrics.wearMm.toFixed(2)} / ${metrics.wearLimitMm.toFixed(2)} mm, increasing burr risk.`
          : `Current flank wear is ${metrics.wearMm.toFixed(2)} / ${metrics.wearLimitMm.toFixed(2)} mm (${metrics.wearPct}%).`,
        impact: 'Prevent burr & scrap',
      },
      {
        id: 'coating',
        priorityRank: 3,
        priority: 'Next batch',
        priorityColor: '#3B82F6',
        title: coatingOk
          ? `Continue ${tool.coating} insert grade for ${material.name}`
          : `Switch to ${material.recommendedCoatings[0] ?? 'PVD/AlTiN'} coated inserts next batch`,
        reason: coatingOk
          ? `${tool.coating} matches ${material.group} thermal load.`
          : `${tool.coating} has lower thermal match for ${material.group}.`,
        impact: coatingOk ? '' : '+15% wear margin',
      },
    ]

    return list.sort((a, b) => a.priorityRank - b.priorityRank)
  }, [tool, metrics, sister, decision, material, currency])

  const handleExportCsv = () => {
    setMenuAnchor(null)
    if (!tool || !metrics || !costComp || !decision) return
    const lines = [
      ['Machine', machine.id, 'Tool', tool.id, 'Material', material.name].join(','),
      ['Verdict', decision.verdict, 'Reason', `"${decision.reason}"`].join(','),
      '',
      'Tool life actual vs predicted',
      'Metric,Actual,Predicted,Variance',
      `Cutting time,${metrics.actualCutMin} min,${metrics.predictedLifeMin} min,${metrics.lifeUsedPct}% used`,
      `Flank wear,${metrics.wearMm} mm,${metrics.wearLimitMm} mm,${metrics.wearPct}%`,
      `Parts produced,${job.partsCompleted},${job.batchSize},${metrics.batchPct}%`,
      `Wear rate,${metrics.actualWearRateMmPerMin} mm/min,${metrics.expectedWearRateMmPerMin} mm/min,${metrics.wearRateVariancePct}%`,
      `Parts until replacement,-,~${metrics.partsUntilReplacement} pcs,-`,
      '',
      'Cost comparison',
      'Option,Tool,Downtime,Scrap,Rework,Total,Saved vs failure',
      ...costComp.rows.map((r) =>
        [
          r.option,
          r.toolCost,
          r.downtime,
          r.scrap,
          r.rework,
          r.total,
          r.key === 'failure' ? 0 : r.savedVsFailure,
        ].join(','),
      ),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${machine.id}-${tool.id}-decision.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Empty state: no tool mounted
  if (!tool || !metrics || !decision || !costComp) {
    return (
      <Card
        sx={{
          maxWidth: 1280,
          bgcolor: '#14181D',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          color: '#F8FAFC',
          boxShadow: 'none',
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Wrench size={28} color="#94A3B8" />
          <Typography sx={{ fontSize: 16, fontWeight: 700, mt: 1.5 }}>
            Mount a tool to see life and decision data
          </Typography>
          <Button
            variant="contained"
            onClick={onMountToolClick}
            sx={{ mt: 2, borderRadius: '8px', textTransform: 'none', fontWeight: 600, bgcolor: '#3B82F6' }}
          >
            Mount Tool
          </Button>
        </CardContent>
      </Card>
    )
  }

  const st = statusPalette[decision.statusLabel]
  const wearVarianceGood = metrics.wearRateVariancePct <= 0
  const wearVarianceHigh = metrics.wearRateVariancePct > 10
  const wearPill = wearVarianceGood
    ? { label: 'Slower wear', arrow: '▼', color: '#22C55E', bg: 'rgba(34,197,94,0.14)' }
    : wearVarianceHigh
      ? { label: 'Faster wear', arrow: '▲', color: '#EF4444', bg: 'rgba(239,68,68,0.16)' }
      : { label: 'On track', arrow: '▲', color: '#F59E0B', bg: 'rgba(245,158,11,0.14)' }

  const verdictSentence =
    metrics.wearPct >= 90 || metrics.remainingMin < 10
      ? `${tool.id} reached ${metrics.wearPct}% of its wear limit. Changing now saves ${money(costComp.bestSaving, currency)} versus running to failure.`
      : `${decision.reason} Changing on schedule saves ${money(costComp.bestSaving, currency)} versus running to failure.`

  const kpiTiles = [
    {
      label: 'Remaining life',
      value: `${metrics.remainingMin} min`,
      sub: metrics.remainingMin <= 0 ? 'Limit reached' : `~${metrics.partsUntilReplacement} pcs left`,
      color: st.color,
    },
    {
      label: 'Flank wear VB',
      value: `${metrics.wearMm.toFixed(2)} / ${metrics.wearLimitMm.toFixed(2)} mm`,
      sub: `${metrics.wearPct}% of limit`,
      progress: metrics.wearPct,
      color: st.color,
    },
    {
      label: 'Parts done',
      value: `${job.partsCompleted} / ${job.batchSize}`,
      sub: `${metrics.batchPct}% of batch`,
      progress: metrics.batchPct,
      color: '#3B82F6',
    },
    {
      label: 'Tool score',
      value: `${metrics.score}/100`,
      sub: decision.statusLabel,
      color: st.color,
    },
  ]

  const tableRows = [
    {
      metric: 'Cutting time',
      actual: `${metrics.actualCutMin}`,
      actualUnit: 'min',
      predicted: `${metrics.predictedLifeMin}`,
      predictedUnit: 'min',
      variance: `${metrics.lifeUsedPct}% used`,
      pill: null,
    },
    {
      metric: 'Flank wear',
      actual: `${metrics.wearMm.toFixed(2)}`,
      actualUnit: 'mm',
      predicted: `${metrics.wearLimitMm.toFixed(2)}`,
      predictedUnit: 'mm',
      variance: `${metrics.wearPct}%`,
      pill: null,
    },
    {
      metric: 'Parts produced',
      actual: `${job.partsCompleted}`,
      actualUnit: 'pcs',
      predicted: `${job.batchSize}`,
      predictedUnit: 'batch',
      variance: `${metrics.batchPct}%`,
      pill: null,
    },
    {
      metric: 'Wear rate',
      actual: `${metrics.actualWearRateMmPerMin.toFixed(4)}`,
      actualUnit: 'mm/m',
      predicted: `${metrics.expectedWearRateMmPerMin.toFixed(4)}`,
      predictedUnit: 'mm/m',
      variance: `${wearPill.arrow} ${wearPill.label}`,
      pill: wearPill,
    },
    {
      metric: 'Parts until replacement',
      actual: '-',
      actualUnit: '',
      predicted: `~${metrics.partsUntilReplacement}`,
      predictedUnit: 'pcs',
      variance: '-',
      pill: null,
    },
  ]

  return (
    <Card
      sx={{
        maxWidth: 1280,
        width: '100%',
        bgcolor: '#14181D',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        color: '#F8FAFC',
        boxShadow: 'none',
        transition: 'all 200ms ease',
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack spacing={4}>
          {/* 1. HEADER ROW */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
                Tool Life &amp; Decision
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#94A3B8', mt: 0.5 }}>
                {machine.id} · {tool.id} · {tool.name} · {material.name}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip
                label={decision.statusLabel}
                size="small"
                sx={{
                  borderRadius: '8px',
                  bgcolor: st.bg,
                  color: st.color,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              />
              <Button
                size="small"
                endIcon={<ArrowRight size={14} />}
                onClick={() => navigate(`/machines/${machine.id}/report`)}
                sx={{ textTransform: 'none', fontWeight: 600, color: '#60A5FA' }}
              >
                Full report
              </Button>
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                aria-label="Export or print"
                sx={{ color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              >
                <MoreVertical size={16} />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem onClick={handleExportCsv} sx={{ fontSize: 14 }}>
                  Export CSV
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null)
                    window.print()
                  }}
                  sx={{ fontSize: 14 }}
                >
                  Print
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>

          {/* 2. VERDICT HERO (60% Left | 40% Right, 4px left accent) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '60fr 40fr' },
              gap: 3,
              alignItems: 'center',
              pl: 2.5,
              borderLeft: `4px solid ${st.color}`,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: st.color, lineHeight: 1.15 }}>
                {decision.verdict}
              </Typography>
              <Typography sx={{ fontSize: 14, color: '#CBD5E1', mt: 1, lineHeight: 1.55 }}>
                {verdictSentence}
              </Typography>
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                  Tool life used
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontVariantNumeric: 'tabular-nums',
                    color: '#F8FAFC',
                  }}
                >
                  {metrics.lifeUsedPct}%
                </Typography>
              </Stack>

              <Box sx={{ position: 'relative', height: 12, borderRadius: 6, bgcolor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${metrics.lifeUsedPct}%`,
                    bgcolor: st.color,
                    borderRadius: 6,
                    transition: 'width 200ms ease',
                  }}
                />
                {/* 70% Plan Marker */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: '70%',
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    bgcolor: '#F59E0B',
                  }}
                />
              </Box>

              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75 }}>
                <Typography sx={{ fontSize: 11, color: '#64748B' }}>0%</Typography>
                <Typography sx={{ fontSize: 11, color: '#F59E0B' }}>70% plan</Typography>
                <Typography sx={{ fontSize: 11, color: '#EF4444' }}>100% limit</Typography>
              </Stack>
            </Box>
          </Box>

          {/* 3. KPI TILES ROW (4 equal tiles, 96px tall, no nested borders) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            {kpiTiles.map((tile) => (
              <Box
                key={tile.label}
                sx={{
                  height: 96,
                  px: 2.5,
                  py: 2,
                  borderRadius: '10px',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>{tile.label}</Typography>
                <Typography
                  sx={{
                    fontSize: 20,
                    fontWeight: 700,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontVariantNumeric: 'tabular-nums',
                    color: '#F8FAFC',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tile.value}
                </Typography>
                {typeof tile.progress === 'number' ? (
                  <LinearProgress
                    variant="determinate"
                    value={tile.progress}
                    sx={{
                      height: 4,
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.08)',
                      '& .MuiLinearProgress-bar': { bgcolor: tile.color },
                    }}
                  />
                ) : (
                  <Typography sx={{ fontSize: 11.5, color: tile.color, fontWeight: 600 }}>
                    {tile.sub}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* 4. TWO-COLUMN SECTION: Actual vs Predicted (5 rows) | VB Wear Over Time */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.15fr 1fr' },
              gap: 3,
              alignItems: 'stretch',
            }}
          >
            {/* LEFT: Compact 5-row Table */}
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', mb: 2 }}>
                Tool life: actual vs predicted
              </Typography>

              {job.timeInCutMin <= 0 ? (
                <Typography sx={{ fontSize: 14, color: '#94A3B8', py: 3 }}>
                  Not enough wear data yet
                </Typography>
              ) : (
                <>
                  <TableContainer sx={{ display: { xs: 'none', sm: 'block' }, overflowX: 'auto' }}>
                    <Table
                      size="small"
                      sx={{
                        '& td, & th': {
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          borderLeft: 'none',
                          borderRight: 'none',
                          py: 1.25,
                        },
                      }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontSize: 12, color: '#94A3B8', pl: 0 }}>Metric</TableCell>
                          <TableCell align="right" sx={{ fontSize: 12, color: '#94A3B8', minWidth: 96 }}>
                            Actual
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 12, color: '#94A3B8', minWidth: 96 }}>
                            Predicted
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: 12, color: '#94A3B8', pr: 0, minWidth: 112 }}>
                            Variance
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tableRows.map((row) => (
                          <TableRow key={row.metric} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                            <TableCell sx={{ fontSize: 14, color: '#E2E8F0', pl: 0, whiteSpace: 'nowrap' }}>
                              {row.metric}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontSize: 14,
                                fontFamily: '"JetBrains Mono", monospace',
                                fontVariantNumeric: 'tabular-nums',
                                color: row.actual === '-' ? '#64748B' : '#F8FAFC',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {row.actual}{' '}
                              {row.actualUnit && (
                                <Typography component="span" sx={{ fontSize: 11.5, color: '#94A3B8' }}>
                                  {row.actualUnit}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontSize: 14,
                                fontFamily: '"JetBrains Mono", monospace',
                                fontVariantNumeric: 'tabular-nums',
                                color: '#CBD5E1',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {row.predicted}{' '}
                              {row.predictedUnit && (
                                <Typography component="span" sx={{ fontSize: 11.5, color: '#94A3B8' }}>
                                  {row.predictedUnit}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right" sx={{ pr: 0, whiteSpace: 'nowrap' }}>
                              {row.pill ? (
                                <Chip
                                  label={row.variance}
                                  size="small"
                                  sx={{
                                    height: 22,
                                    borderRadius: '8px',
                                    bgcolor: row.pill.bg,
                                    color: row.pill.color,
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                  }}
                                />
                              ) : (
                                <Typography
                                  sx={{
                                    fontSize: 13,
                                    fontFamily: '"JetBrains Mono", monospace',
                                    color: row.variance === '-' ? '#64748B' : '#CBD5E1',
                                  }}
                                >
                                  {row.variance}
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Mobile Stacked Rows */}
                  <Stack spacing={1.25} sx={{ display: { xs: 'flex', sm: 'none' } }}>
                    {tableRows.map((row) => (
                      <Box key={row.metric} sx={{ py: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>
                          {row.metric}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                          <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>
                            Act: {row.actual} {row.actualUnit}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>
                            Pred: {row.predicted} {row.predictedUnit}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: row.pill?.color ?? '#CBD5E1', fontWeight: 600 }}>
                            {row.variance}
                          </Typography>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </Box>

            {/* RIGHT: VB Wear Over Time Chart (minHeight 240px, inside same card) */}
            <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
                  VB wear over time
                </Typography>
                <Chip
                  label={`Now · ${metrics.wearMm.toFixed(2)} mm`}
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    bgcolor: 'rgba(59,130,246,0.16)',
                    color: '#60A5FA',
                    fontSize: 11.5,
                    fontWeight: 700,
                  }}
                />
              </Stack>

              {wearChart ? (
                <Box sx={{ minHeight: 240, flexGrow: 1 }}>
                  <LineChart
                    xAxis={[{ scaleType: 'point', data: wearChart.x, label: 'Cutting time' }]}
                    yAxis={[{ label: 'VB (mm)' }]}
                    series={[
                      { data: wearChart.actual, label: 'Actual VB', color: '#3B82F6', showMark: true },
                      { data: wearChart.predicted, label: 'Predicted', color: '#94A3B8', showMark: false },
                      {
                        data: wearChart.planLine,
                        label: `Plan ${wearChart.planThreshold} mm`,
                        color: '#F59E0B',
                        showMark: false,
                      },
                      {
                        data: wearChart.limitLine,
                        label: `Limit ${tool.vb_limit_mm.toFixed(2)} mm`,
                        color: '#EF4444',
                        showMark: false,
                      },
                    ]}
                    height={240}
                    margin={{ top: 16, right: 16, bottom: 36, left: 48 }}
                    sx={{
                      '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: 'rgba(255,255,255,0.2)' },
                      '& .MuiChartsAxis-tickLabel, & .MuiChartsAxis-label': { fill: '#94A3B8', fontSize: 11 },
                    }}
                  />
                </Box>
              ) : (
                <Typography sx={{ fontSize: 14, color: '#94A3B8', py: 3 }}>
                  Not enough wear data yet
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* 5. COST COMPARISON — 3 Option Cards + Expandable Breakdown Table */}
          <Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1.5}
              sx={{ mb: 2.5 }}
            >
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
                Replace or not: cost comparison
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {[
                  ['Tool', COST_COLORS.tool],
                  ['Downtime', COST_COLORS.downtime],
                  ['Scrap', COST_COLORS.scrap],
                  ['Rework', COST_COLORS.rework],
                ].map(([label, color]) => (
                  <Stack key={label} direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                    <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>{label}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 2.5,
              }}
            >
              {costComp.rows.map((row) => {
                const denom = Math.max(1, row.toolCost + row.downtime + row.scrap + row.rework)
                const segs = [
                  { k: 'tool', v: row.toolCost, c: COST_COLORS.tool },
                  { k: 'downtime', v: row.downtime, c: COST_COLORS.downtime },
                  { k: 'scrap', v: row.scrap, c: COST_COLORS.scrap },
                  { k: 'rework', v: row.rework, c: COST_COLORS.rework },
                ]
                return (
                  <Box
                    key={row.key}
                    sx={{
                      p: 2.5,
                      borderRadius: '10px',
                      bgcolor: row.recommended ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
                      border: row.recommended
                        ? '1px solid rgba(59,130,246,0.55)'
                        : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: row.recommended ? '0 0 24px rgba(59,130,246,0.14)' : 'none',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
                        {row.option}
                      </Typography>
                      {row.recommended && (
                        <Chip
                          label="✓ Recommended"
                          size="small"
                          sx={{
                            height: 22,
                            borderRadius: '8px',
                            bgcolor: 'rgba(59,130,246,0.2)',
                            color: '#60A5FA',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Stack>

                    <Typography
                      sx={{
                        fontSize: 24,
                        fontWeight: 700,
                        fontFamily: '"JetBrains Mono", monospace',
                        fontVariantNumeric: 'tabular-nums',
                        color: row.key === 'failure' ? '#EF4444' : '#F8FAFC',
                        mb: 1.5,
                      }}
                    >
                      {money(row.total, currency)}
                    </Typography>

                    {/* 4-segment stacked bar */}
                    <Box
                      sx={{
                        display: 'flex',
                        height: 8,
                        borderRadius: 4,
                        overflow: 'hidden',
                        bgcolor: 'rgba(255,255,255,0.08)',
                        mb: 1.5,
                      }}
                    >
                      {segs.map((s) => (
                        <Tooltip key={s.k} title={`${s.k}: ${money(s.v, currency)}`}>
                          <Box sx={{ width: `${(s.v / denom) * 100}%`, bgcolor: s.c }} />
                        </Tooltip>
                      ))}
                    </Box>

                    <Typography
                      sx={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: row.key === 'failure' ? '#94A3B8' : '#22C55E',
                      }}
                    >
                      {row.key === 'failure'
                        ? 'Baseline failure cost'
                        : `Saved vs failure ${money(row.savedVsFailure, currency)}`}
                    </Typography>
                  </Box>
                )
              })}
            </Box>

            <Button
              size="small"
              onClick={() => setShowBreakdown((v) => !v)}
              endIcon={showBreakdown ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              sx={{ mt: 2, textTransform: 'none', fontWeight: 600, color: '#60A5FA' }}
            >
              {showBreakdown ? 'Hide breakdown' : 'Show breakdown'}
            </Button>

            <Collapse in={showBreakdown}>
              <TableContainer sx={{ mt: 1.5, overflowX: 'auto' }}>
                <Table
                  size="small"
                  sx={{
                    '& td, & th': {
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      borderLeft: 'none',
                      borderRight: 'none',
                      whiteSpace: 'nowrap',
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          fontSize: 12,
                          color: '#94A3B8',
                          position: 'sticky',
                          left: 0,
                          bgcolor: '#14181D',
                          zIndex: 1,
                        }}
                      >
                        Option
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 12, color: '#94A3B8' }}>
                        Tool
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 12, color: '#94A3B8' }}>
                        Downtime
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 12, color: '#94A3B8' }}>
                        Scrap
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 12, color: '#94A3B8' }}>
                        Rework
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 12, color: '#94A3B8' }}>
                        Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 12, color: '#94A3B8' }}>
                        Saved
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {costComp.rows.map((r) => (
                      <TableRow key={r.key}>
                        <TableCell
                          sx={{
                            fontSize: 14,
                            color: '#F8FAFC',
                            fontWeight: r.recommended ? 700 : 500,
                            position: 'sticky',
                            left: 0,
                            bgcolor: '#14181D',
                            zIndex: 1,
                          }}
                        >
                          {r.option}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 14, fontFamily: '"JetBrains Mono", monospace', color: '#CBD5E1' }}>
                          {money(r.toolCost, currency)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 14, fontFamily: '"JetBrains Mono", monospace', color: '#CBD5E1' }}>
                          {money(r.downtime, currency)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 14, fontFamily: '"JetBrains Mono", monospace', color: '#CBD5E1' }}>
                          {money(r.scrap, currency)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 14, fontFamily: '"JetBrains Mono", monospace', color: '#CBD5E1' }}>
                          {money(r.rework, currency)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 14, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', color: '#F8FAFC' }}>
                          {money(r.total, currency)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: 14, fontFamily: '"JetBrains Mono", monospace', color: r.key === 'failure' ? '#64748B' : '#22C55E' }}>
                          {r.key === 'failure' ? '-' : money(r.savedVsFailure, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {/* 6. AI SUGGESTIONS */}
          <Box>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    bgcolor: 'rgba(59,130,246,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={15} color="#3B82F6" />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', lineHeight: 1.2 }}>
                    AI suggestions
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#64748B' }}>
                    Ranked by cost &amp; wear impact for {machine.id} · {tool.id}
                  </Typography>
                </Box>
              </Stack>

              <Typography sx={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                {Object.values(doneIds).filter(Boolean).length}/{actions.length} applied
              </Typography>
            </Stack>

            <Box
              sx={{
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)',
                bgcolor: 'rgba(255,255,255,0.02)',
                overflow: 'hidden',
              }}
            >
              {actions.map((item, idx) => {
                const isDone = Boolean(doneIds[item.id])
                const accentColor = isDone ? '#22C55E' : item.priorityColor
                return (
                  <Box
                    key={item.id}
                    sx={{
                      px: 2.5,
                      py: 2,
                      borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      borderLeft: `3px solid ${accentColor}`,
                      opacity: isDone ? 0.65 : 1,
                      transition: 'opacity 180ms ease, background-color 180ms ease',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.02)',
                      },
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      alignItems: { xs: 'flex-start', md: 'center' },
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
                        <Box
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            bgcolor: accentColor,
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: accentColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {item.priority}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#F8FAFC',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}
                        >
                          {item.title}
                        </Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 12.5, color: '#94A3B8', pl: 1.75 }}>
                        {item.reason}
                      </Typography>
                    </Box>

                    <Stack
                      direction="row"
                      spacing={1.25}
                      alignItems="center"
                      sx={{ flexShrink: 0, alignSelf: { xs: 'flex-end', md: 'center' } }}
                    >
                      {item.impact && (
                        <Chip
                          label={item.impact}
                          size="small"
                          sx={{
                            height: 24,
                            borderRadius: '8px',
                            bgcolor: 'rgba(34,197,94,0.12)',
                            color: '#22C55E',
                            fontSize: 11.5,
                            fontWeight: 700,
                          }}
                        />
                      )}
                      <Button
                        size="small"
                        variant={isDone ? 'outlined' : 'text'}
                        startIcon={isDone ? <Check size={14} /> : undefined}
                        onClick={() => setDoneIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                        sx={{
                          minWidth: 88,
                          height: 28,
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontSize: 12,
                          fontWeight: 600,
                          color: isDone ? '#22C55E' : '#3B82F6',
                          borderColor: isDone ? 'rgba(34,197,94,0.35)' : 'transparent',
                          bgcolor: isDone ? 'rgba(34,197,94,0.08)' : 'rgba(59,130,246,0.1)',
                          '&:hover': {
                            bgcolor: isDone ? 'rgba(34,197,94,0.16)' : 'rgba(59,130,246,0.18)',
                            borderColor: isDone ? 'rgba(34,197,94,0.5)' : 'transparent',
                          },
                        }}
                      >
                        {isDone ? 'Applied' : 'Apply'}
                      </Button>
                    </Stack>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
