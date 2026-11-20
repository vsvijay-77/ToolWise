import { useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { PieChart } from '@mui/x-charts/PieChart'
import { ArrowRight, CalendarPlus, ChevronDown, Download } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { ScoreGauge } from '../components/cards/ScoreGauge'
import { MachineSubTabs } from '../components/nav/MachineSubTabs'
import { costParameters, jobs, machines, materials, tools } from '../data'
import { money } from '../utils/format'
import { getToolMetrics } from '../utils/toolMetrics'

const partLabels: Record<string, string> = {
  wastedTool: 'Tool value wasted',
  scrap: 'Scrap risk',
  rework: 'Rework',
  downtime: 'Machine downtime',
  labour: 'Labour change',
  damage: 'Spindle / holder damage',
}

export default function Report() {
  const { id = 'CNC-01' } = useParams()
  const machine = machines.find((item) => item.id === id) ?? machines[0]
  const tool = tools.find((item) => item.id === machine.currentToolId) ?? tools[0]
  const job = jobs[machine.id] ?? jobs['CNC-01']
  const material = materials.find((item) => item.id === job.materialId) ?? materials[0]

  const [hourlyRate, setHourlyRate] = useState(costParameters.machineHourlyRate)
  const [partCost, setPartCost] = useState(costParameters.partCost)
  const [currency, setCurrency] = useState<'USD' | 'INR'>('INR')
  const [scheduled, setScheduled] = useState(false)

  const metrics = useMemo(
    () => getToolMetrics(tool, material, job, hourlyRate, partCost),
    [tool, material, job, hourlyRate, partCost],
  )

  const sortedParts = useMemo(
    () => [...metrics.scoreResult.parts].sort((a, b) => a.value - b.value).slice(0, 5),
    [metrics.scoreResult.parts],
  )

  const recommendedKey = (
    Object.entries(metrics.scenarios).sort(([, a], [, b]) => a.total - b.total)[0][0]
  ) as 'change' | 'planned' | 'failure'

  const pie = useMemo(
    () =>
      Object.entries(metrics.scenarios[recommendedKey].parts)
        .filter(([, val]) => val > 0)
        .map(([key, value], index) => ({
          id: index,
          label: partLabels[key] ?? key,
          value: Math.round(value),
        })),
    [metrics.scenarios, recommendedKey],
  )

  // Merge Reasons -> Actions, dropping the redundant VB wear line
  const reasonActionPairs = useMemo(() => {
    const pairs: { reason: string; action: string }[] = []
    if (metrics.vc > material.vcMax) {
      pairs.push({
        reason: `Cutting speed ${Math.round((metrics.vc / material.vcMax) * 100)}% of ${material.name} max (${metrics.vc} m/min)`,
        action: `Reduce Vc to ${material.vcMax} m/min`,
      })
    } else {
      pairs.push({
        reason: `Cutting speed (${metrics.vc} m/min) is within ${material.name} window`,
        action: 'Maintain current spindle speed window',
      })
    }

    pairs.push({
      reason: `Remaining tool life is ${metrics.remainingMin} min (${metrics.partsRemaining} parts left in batch)`,
      action:
        metrics.remainingMin <= 30
          ? 'Stage replacement tool before next part starts'
          : `Inspect flank wear within ${Math.max(5, Math.round(metrics.remainingMin / 2))} min`,
    })

    const coatingOk = material.recommendedCoatings.includes(tool.coating)
    pairs.push({
      reason: coatingOk
        ? `${tool.coating} coating matches ${material.group.toLowerCase()} thermal profile`
        : `${tool.coating} coating is suboptimal for ${material.group.toLowerCase()}`,
      action: coatingOk
        ? 'Keep current tool grade for next batch'
        : `Switch to ${material.recommendedCoatings[0] ?? 'TiAlN'} coated cutter on next setup`,
    })
    return pairs.slice(0, 3)
  }, [metrics, material, tool])

  const rateLabel = currency === 'INR' ? 'Machine ₹/hour' : 'Machine $/hour'

  return (
    <Stack spacing={5} sx={{ maxWidth: 1280, mx: 'auto' }}>
      <MachineSubTabs machineId={machine.id} />

      {/* 1) Decision Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#F8FAFC', lineHeight: 1.2 }}>
              {metrics.recommendedAction} · Save {money(metrics.savingInr, currency)}
            </Typography>
            <Tooltip title="Telemetry & wear progression are simulated; tool life, score, and rupee cost impact are calculated from Taylor physics.">
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
          <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5 }}>
            {machine.id} ({machine.name}) · {tool.id} · {material.name}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            startIcon={<Download size={16} />}
            variant="outlined"
            onClick={() => window.print()}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
          >
            Export PDF
          </Button>
          <Button
            startIcon={<CalendarPlus size={16} />}
            variant="contained"
            onClick={() => setScheduled(true)}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, bgcolor: '#1565C0' }}
          >
            {scheduled ? 'Change Scheduled' : 'Schedule Tool Change'}
          </Button>
        </Stack>
      </Stack>

      {/* 2) Score Card: Donut Left, 5 Lowest-First Breakdown Bars Right */}
      <Card sx={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', mb: 2.5 }}>
            Tool Health Score
          </Typography>
          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'center' }}>
              <ScoreGauge score={metrics.score} band={metrics.scoreResult.band} />
              <Typography sx={{ fontSize: 12, color: '#64748B', mt: 1.5 }}>
                Sorted lowest-scoring factors first
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={2}>
                {sortedParts.map((part) => {
                  const val = Math.round(part.value)
                  const barColor = val >= 80 ? '#16A34A' : val >= 50 ? '#D97706' : '#DC2626'
                  return (
                    <Box key={part.label}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>
                          {part.label}{' '}
                          <Typography component="span" sx={{ fontSize: 12, color: '#64748B' }}>
                            ({part.weight}%)
                          </Typography>
                        </Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: barColor }}>
                          {val}%
                        </Typography>
                      </Stack>
                      <Box sx={{ height: 8, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
                        <Box sx={{ height: '100%', width: `${val}%`, bgcolor: barColor, borderRadius: 8 }} />
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 3) Cost of Loss Card */}
      <Card sx={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
                Cost of Loss Comparison
              </Typography>
              <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.25 }}>
                Assumptions: adjust commercial rates to recalculate scenario totals
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <TextField
                size="small"
                label={rateLabel}
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                sx={{ width: 140 }}
              />
              <TextField
                size="small"
                label="Part cost"
                type="number"
                value={partCost}
                onChange={(e) => setPartCost(Number(e.target.value))}
                sx={{ width: 120 }}
              />
              <TextField
                select
                size="small"
                label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'USD' | 'INR')}
                sx={{ width: 96 }}
              >
                <MenuItem value="INR">INR</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            </Stack>
          </Stack>

          {/* 3-Column Comparison Cards */}
          <Grid container spacing={3}>
            {(
              [
                { key: 'change', title: 'Change now' },
                { key: 'planned', title: 'Run to planned limit' },
                { key: 'failure', title: 'Run to failure' },
              ] as const
            ).map(({ key, title }) => {
              const isRec = recommendedKey === key
              const scenario = metrics.scenarios[key]
              return (
                <Grid key={key} size={{ xs: 12, md: 4 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderLeft: isRec ? '3px solid #1565C0' : '1px solid rgba(255,255,255,0.08)',
                      bgcolor: isRec ? 'rgba(59,130,246,0.1)' : '#14181D',
                      height: '100%',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
                        {title}
                      </Typography>
                      {isRec && (
                        <Chip
                          label="Recommended"
                          size="small"
                          sx={{
                            borderRadius: '8px',
                            bgcolor: 'rgba(59,130,246,0.14)',
                            color: '#1565C0',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Stack>

                    <Typography
                      sx={{
                        fontSize: 26,
                        fontWeight: 700,
                        fontFamily: '"JetBrains Mono", monospace',
                        color: key === 'failure' ? '#DC2626' : '#0F172A',
                        mb: 1.5,
                      }}
                    >
                      {money(scenario.total, currency)}
                    </Typography>

                    <Accordion
                      elevation={0}
                      disableGutters
                      sx={{
                        bgcolor: 'transparent',
                        '&:before': { display: 'none' },
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <AccordionSummary expandIcon={<ChevronDown size={16} />} sx={{ px: 0, minHeight: 36 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#1565C0' }}>
                          Breakdown
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0, pt: 0 }}>
                        <Stack spacing={0.75}>
                          {Object.entries(scenario.parts).map(([k, v]) => (
                            <Stack key={k} direction="row" justifyContent="space-between">
                              <Typography sx={{ fontSize: 12, color: '#64748B' }}>
                                {partLabels[k] ?? k}
                              </Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC' }}>
                                {money(v, currency)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                </Grid>
              )
            })}
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Recommended Cost Share: PieChart on >=sm (no legend overlap), List on Mobile */}
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', mb: 2 }}>
            Recommended Scenario Cost Share
          </Typography>

          <Box sx={{ display: { xs: 'none', sm: 'block' }, minHeight: 240 }}>
            <PieChart
              height={240}
              series={[
                {
                  data: pie,
                  innerRadius: 52,
                  outerRadius: 88,
                  paddingAngle: 2,
                  cornerRadius: 4,
                },
              ]}
              margin={{ top: 10, bottom: 50, left: 10, right: 10 }}
              slotProps={{
                legend: {
                  direction: 'row',
                  position: { vertical: 'bottom', horizontal: 'middle' },
                },
              }}
            />
          </Box>

          <Stack spacing={1} sx={{ display: { xs: 'flex', sm: 'none' } }}>
            {pie.map((item) => (
              <Stack key={item.id} direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: '#94A3B8' }}>{item.label}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
                  {money(item.value, currency)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* 4) Merged Reasons -> Actions Card */}
      <Card sx={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', mb: 2 }}>
            Reasons & Recommended Actions
          </Typography>
          <Stack divider={<Divider />} spacing={2}>
            {reasonActionPairs.map((item) => (
              <Stack
                key={item.reason}
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1.5}
              >
                <Typography sx={{ fontSize: 14, color: '#94A3B8' }}>{item.reason}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                  <ArrowRight size={15} color="#1565C0" />
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1565C0' }}>
                    {item.action}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
