import type { Material, Tool } from '../data'
import { clamp } from './format'

export type ScoreResult = { score: number; band: 'Healthy' | 'Monitor' | 'Plan change' | 'Replace now'; parts: { label: string; value: number; weight: number }[]; reasons: string[]; recommendations: string[] }

export function scoreTool(tool: Tool, material: Material, timeInCut: number, vb: number, vc: number, load: number, vibration: number): ScoreResult {
  const remaining = clamp(100 * (1 - timeInCut / tool.life_limit_min), 0, 100)
  const wear = clamp(100 * (1 - vb / tool.vb_limit_mm), 0, 100)
  const parameterFit = clamp(100 - Math.abs(vc - (material.vcMin + material.vcMax) / 2) / ((material.vcMax - material.vcMin) / 2) * 42, 0, 100)
  const stability = clamp(100 - Math.max(0, load - 65) * 1.1 - Math.max(0, vibration - 3) * 9, 0, 100)
  const compatibility = material.recommendedCoatings.includes(tool.coating) ? 100 : 48
  const rawScore = Math.round(remaining * .35 + wear * .25 + parameterFit * .15 + stability * .15 + compatibility * .1)
  const score = remaining <= 0 ? 0 : rawScore
  const band = score >= 80 ? 'Healthy' : score >= 50 ? 'Monitor' : score >= 25 ? 'Plan change' : 'Replace now'
  const reasons = [
    vc > material.vcMax ? `Cutting speed is ${Math.round((vc / material.vcMax - 1) * 100)}% above ${material.name}'s recommended range — accelerates flank wear.` : `Cutting speed is inside the recommended ${material.vcMin}–${material.vcMax} m/min range.`,
    `VB is ${vb.toFixed(2)} mm, ${Math.round(vb / tool.vb_limit_mm * 100)}% of the ${tool.vb_limit_mm.toFixed(2)} mm limit.`,
    material.recommendedCoatings.includes(tool.coating) ? `${tool.coating} coating is well suited to ${material.group.toLowerCase()}.` : `${tool.coating} coating is a weaker match for ${material.group.toLowerCase()}.`,
  ]
  const recommendations = [vc > material.vcMax ? `Reduce Vc to ${material.vcMax} m/min.` : 'Maintain the current cutting speed window.', `Plan an inspection before ${Math.max(1, Math.round((tool.life_limit_min - timeInCut) / 2))} more cutting minutes.`, vb / tool.vb_limit_mm > .8 ? 'Stage a replacement tool at the next planned stop.' : 'Continue monitoring VB wear at the next part check.']
  return { score, band, parts: [{ label: 'Remaining life', value: remaining, weight: 35 }, { label: 'Wear VB', value: wear, weight: 25 }, { label: 'Parameter fit', value: parameterFit, weight: 15 }, { label: 'Stability', value: stability, weight: 15 }, { label: 'Coating match', value: compatibility, weight: 10 }], reasons, recommendations }
}
