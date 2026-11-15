import type { Job, Tool } from '../data'

export type ForecastSeverity = 'ok' | 'watch' | 'warning' | 'critical'

export type ToolForecast = {
  /** Wear as % of the tool's VB limit. */
  wearPct: number
  /** Life consumed as % of the approved life limit. */
  lifePct: number
  /** Estimated minutes of cutting until the tool reaches its wear/life limit (break risk). */
  minutesToBreak: number
  /** Minutes of cutting until the recommended (planned) change point. */
  minutesToChange: number
  /** Parts that can still be produced before the planned change. */
  partsBeforeChange: number
  /** Parts left in the current batch. */
  partsLeftInBatch: number
  severity: ForecastSeverity
  headline: string
  advice: string
}

/** Sister (replacement) tool staged in the magazine for the running tool. */
export const sisterToolFor = (tool: Tool) => {
  const pocketNumber = Number(tool.pocket.replace(/\D/g, '')) || 1
  return { id: `${tool.id}-S`, name: tool.name, pocket: `T${String(pocketNumber + 20).padStart(2, '0')}`, coating: tool.coating, holder: tool.holder, status: 'Preset & ready' as const }
}

/**
 * Engineering estimate of when the running tool will reach its limit.
 * Uses the observed wear rate (VB / time in cut) with an acceleration factor for
 * the tertiary wear zone, capped by the approved life limit. Simulated data only.
 */
export const forecastTool = (tool: Tool, job: Job, elapsedSec = 0): ToolForecast => {
  const timeInCut = job.timeInCutMin + elapsedSec / 60
  const wearRate = job.vbWearMm / Math.max(job.timeInCutMin, 1)
  const vb = Math.min(tool.vb_limit_mm, job.vbWearMm + wearRate * (elapsedSec / 60))
  const byWear = ((tool.vb_limit_mm - vb) / Math.max(wearRate, 1e-6)) * 0.85
  const byLife = tool.life_limit_min - timeInCut
  const minutesToBreak = Math.max(0, Math.min(byWear, byLife))
  const minutesToChange = Math.max(0, minutesToBreak - tool.life_limit_min * 0.15)
  const cycleMin = job.cycleTimeSec / 60
  const partsBeforeChange = Math.floor(minutesToChange / Math.max(cycleMin, 0.1))
  const partsLeftInBatch = Math.max(0, job.batchSize - job.partsCompleted)
  const wearPct = Math.min(100, (vb / tool.vb_limit_mm) * 100)
  const lifePct = Math.min(100, (timeInCut / tool.life_limit_min) * 100)

  let severity: ForecastSeverity = 'ok'
  if (minutesToChange <= 0) severity = 'critical'
  else if (minutesToChange < 30) severity = 'warning'
  else if (partsBeforeChange < partsLeftInBatch) severity = 'watch'

  const headline = {
    ok: 'Tool will finish this batch',
    watch: 'Tool change needed before batch ends',
    warning: 'Plan tool change soon',
    critical: 'Change tool now — break risk high',
  }[severity]

  const advice = severity === 'ok'
    ? `${partsLeftInBatch} parts left · tool has headroom for ~${partsBeforeChange} parts`
    : severity === 'critical'
      ? `Stop at next safe point and load the sister tool`
      : `Change after ~${partsBeforeChange} more parts · ${partsLeftInBatch} parts left in batch`

  return { wearPct, lifePct, minutesToBreak, minutesToChange, partsBeforeChange, partsLeftInBatch, severity, headline, advice }
}

export const formatCountdown = (minutes: number) => {
  const total = Math.max(0, Math.round(minutes * 60))
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const formatClockAt = (minutesFromNow: number) =>
  new Date(Date.now() + minutesFromNow * 60_000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
