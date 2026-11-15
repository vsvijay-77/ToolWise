import { costParameters, type Job, type Material, type Tool } from '../data'
import { predictTaylorLife, remainingLife } from './calculations'
import { scenarioCost } from './cost'
import { scoreTool, type ScoreResult } from './score'

export type UnifiedToolStatus = 'OK' | 'Monitor' | 'Critical'

export interface UnifiedToolMetrics {
  vc: number
  predictedLifeMin: number
  actualCutMin: number
  remainingMin: number
  lifeUsedPct: number
  wearMm: number
  wearLimitMm: number
  wearPct: number
  actualWearRateMmPerMin: number
  expectedWearRateMmPerMin: number
  wearRateVariancePct: number
  feed: string
  score: number
  scoreResult: ScoreResult
  status: UnifiedToolStatus
  partsRemaining: number
  batchPct: number
  batchTimeLeftMin: number
  partsUntilReplacement: number
  damageRiskParts: number
  scenarios: {
    change: ReturnType<typeof scenarioCost>
    planned: ReturnType<typeof scenarioCost>
    failure: ReturnType<typeof scenarioCost>
  }
  recommendedAction: 'Change now' | 'Plan change' | 'Continue'
  savingInr: number
}

export interface ToolDecisionResult {
  verdict: 'Replace now' | 'Replace at batch end' | 'Monitor, prepare sister tool' | 'Keep running'
  statusLabel: 'Replace now' | 'Replace soon' | 'Monitor' | 'OK'
  severity: 'error' | 'warning' | 'success'
  reason: string
}

export interface CostComparisonRow {
  key: 'change' | 'planned' | 'failure'
  option: string
  toolCost: number
  downtime: number
  scrap: number
  rework: number
  scrapRework: number
  total: number
  savedVsFailure: number
  recommended: boolean
  parts: Record<string, number>
}

/**
 * Single source of truth for all tool telemetry, RUL, wear %, wear rate,
 * health score, and cost scenarios across Dashboard, Machine Monitor, Process, and Report.
 */
export function getToolMetrics(
  tool: Tool,
  material: Material,
  job: Job,
  hourlyRate = costParameters.machineHourlyRate,
  partCost = costParameters.partCost,
): UnifiedToolMetrics {
  const vc = Math.max(1, Math.round((Math.PI * tool.diameter_mm * job.rpm) / 1000))
  const rawPredictedLife = predictTaylorLife(tool, material, vc)
  const predictedLifeMin = Math.round(rawPredictedLife)
  const actualCutMin = Math.round(job.timeInCutMin)
  const remainingMin = Math.max(0, Math.round(remainingLife(rawPredictedLife, job.timeInCutMin)))
  const lifeUsedPct = Math.min(100, Math.round((job.timeInCutMin / Math.max(1, rawPredictedLife)) * 100))
  const wearPct = Math.min(100, Math.round((job.vbWearMm / tool.vb_limit_mm) * 100))
  const feed = job.feed.toFixed(3)

  const actualWearRateMmPerMin =
    job.timeInCutMin > 0 ? Number((job.vbWearMm / job.timeInCutMin).toFixed(4)) : 0
  const expectedWearRateMmPerMin = Number((tool.vb_limit_mm / Math.max(1, rawPredictedLife)).toFixed(4))
  const wearRateVariancePct =
    expectedWearRateMmPerMin > 0 && job.timeInCutMin > 0
      ? Math.round(((actualWearRateMmPerMin - expectedWearRateMmPerMin) / expectedWearRateMmPerMin) * 100)
      : 0

  const baseScore = scoreTool(
    tool,
    material,
    job.timeInCutMin,
    job.vbWearMm,
    vc,
    job.load,
    job.vibration,
  )
  const score = remainingMin <= 0 ? 0 : baseScore.score
  const scoreResult: ScoreResult = {
    ...baseScore,
    score,
    band:
      score >= 80
        ? 'Healthy'
        : score >= 50
          ? 'Monitor'
          : score >= 25
            ? 'Plan change'
            : 'Replace now',
  }

  const status: UnifiedToolStatus =
    score <= 0 || remainingMin <= 15 || wearPct >= 85
      ? 'Critical'
      : score < 75 || remainingMin <= 45 || wearPct >= 65
        ? 'Monitor'
        : 'OK'

  const partsRemaining = Math.max(0, job.batchSize - job.partsCompleted)
  const batchPct = Math.min(100, Math.round((job.partsCompleted / Math.max(1, job.batchSize)) * 100))
  const partMinutes = Math.max(0.5, job.cycleTimeSec / 60)
  const batchTimeLeftMin = Math.round(partsRemaining * partMinutes)
  const partsUntilReplacement = Math.max(0, Math.floor(remainingMin / partMinutes))
  const damageRiskParts =
    status === 'Critical'
      ? Math.max(1, Math.min(partsRemaining || 1, 3))
      : Math.max(0, partsRemaining - partsUntilReplacement)

  const base = {
    toolCost: tool.cost,
    wearRatio: job.vbWearMm / tool.vb_limit_mm,
    lifeRatio: job.timeInCutMin / Math.max(1, rawPredictedLife),
    partsAtRisk: Math.max(1, partsRemaining),
    partCost,
    reworkCost: costParameters.reworkCost,
    downtimeHours: 2.6,
    hourlyRate,
    labourCost: costParameters.labourChangeCost,
    holderDamageCost: costParameters.holderDamageCost,
  }

  const scenarios = {
    change: scenarioCost('change', base),
    planned: scenarioCost('planned', base),
    failure: scenarioCost('failure', base),
  }

  const bestCost = Math.min(scenarios.change.total, scenarios.planned.total)
  const savingInr = Math.max(0, Math.round(scenarios.failure.total - bestCost))
  const recommendedAction: UnifiedToolMetrics['recommendedAction'] =
    status === 'Critical' ? 'Change now' : status === 'Monitor' ? 'Plan change' : 'Continue'

  return {
    vc,
    predictedLifeMin,
    actualCutMin,
    remainingMin,
    lifeUsedPct,
    wearMm: Number(job.vbWearMm.toFixed(2)),
    wearLimitMm: Number(tool.vb_limit_mm.toFixed(2)),
    wearPct,
    actualWearRateMmPerMin,
    expectedWearRateMmPerMin,
    wearRateVariancePct,
    feed,
    score,
    scoreResult,
    status,
    partsRemaining,
    batchPct,
    batchTimeLeftMin,
    partsUntilReplacement,
    damageRiskParts,
    scenarios,
    recommendedAction,
    savingInr,
  }
}

/**
 * State-aware tool replacement verdict used by Overview & Report.
 */
export function getToolDecision(
  tool: Tool,
  material: Material,
  job: Job,
): ToolDecisionResult {
  const m = getToolMetrics(tool, material, job)

  if (m.wearPct >= 90 || m.remainingMin < 10) {
    return {
      verdict: 'Replace now',
      statusLabel: 'Replace now',
      severity: 'error',
      reason: `Replace now: tool is at ${m.wearPct}% of its wear limit (${m.wearMm.toFixed(2)}/${m.wearLimitMm.toFixed(2)} mm).`,
    }
  }
  if (m.wearPct >= 70 || m.remainingMin < m.batchTimeLeftMin) {
    const targetPart = Math.min(job.batchSize, job.partsCompleted + Math.max(1, m.partsUntilReplacement))
    return {
      verdict: 'Replace at batch end',
      statusLabel: 'Replace soon',
      severity: 'warning',
      reason: `Replace after part ${targetPart} (~${m.remainingMin} min left).`,
    }
  }
  if (m.wearPct >= 35) {
    return {
      verdict: 'Monitor, prepare sister tool',
      statusLabel: 'Monitor',
      severity: 'warning',
      reason: `Monitor, ${m.remainingMin} min left (~${m.partsUntilReplacement} pcs before limit).`,
    }
  }
  return {
    verdict: 'Keep running',
    statusLabel: 'OK',
    severity: 'success',
    reason: `Monitor, ${m.remainingMin} min left (${m.wearPct}% wear).`,
  }
}

/**
 * Shared cost-comparison selector used by both Machine Monitor Overview (Table B)
 * and the Score & Cost Report tab so rupee totals always match.
 */
export function getCostComparison(
  tool: Tool,
  material: Material,
  job: Job,
  hourlyRate = costParameters.machineHourlyRate,
  partCost = costParameters.partCost,
): { rows: CostComparisonRow[]; recommendedKey: 'change' | 'planned' | 'failure'; bestSaving: number } {
  const m = getToolMetrics(tool, material, job, hourlyRate, partCost)
  const failureTotal = Math.round(m.scenarios.failure.total)

  const entries: { key: 'change' | 'planned' | 'failure'; option: string }[] = [
    { key: 'change', option: 'Change now' },
    { key: 'planned', option: 'Run to planned limit' },
    { key: 'failure', option: 'Run to failure' },
  ]

  const recommendedKey = (
    Object.entries(m.scenarios).sort(([, a], [, b]) => a.total - b.total)[0][0]
  ) as 'change' | 'planned' | 'failure'

  const rows: CostComparisonRow[] = entries.map(({ key, option }) => {
    const s = m.scenarios[key]
    const total = Math.round(s.total)
    const scrap = Math.round(s.parts.scrap)
    const rework = Math.round(s.parts.rework)
    return {
      key,
      option,
      toolCost: Math.round(s.parts.wastedTool),
      downtime: Math.round(s.parts.downtime),
      scrap,
      rework,
      scrapRework: scrap + rework,
      total,
      savedVsFailure: key === 'failure' ? 0 : Math.max(0, failureTotal - total),
      recommended: recommendedKey === key,
      parts: s.parts,
    }
  })

  const bestTotal = Math.min(...rows.map((r) => r.total))
  return {
    rows,
    recommendedKey,
    bestSaving: Math.max(0, failureTotal - bestTotal),
  }
}
