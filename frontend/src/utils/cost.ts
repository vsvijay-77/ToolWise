import { failureProbability } from './calculations'

export type CostInput = { toolCost: number; wearRatio: number; lifeRatio: number; partsAtRisk: number; partCost: number; reworkCost: number; downtimeHours: number; hourlyRate: number; labourCost: number; holderDamageCost: number }
export const scenarioCost = (kind: 'change' | 'planned' | 'failure', input: CostInput) => {
  const p = kind === 'change' ? .01 : kind === 'planned' ? failureProbability(input.wearRatio * .8, input.lifeRatio * .9) : Math.min(.92, failureProbability(input.wearRatio * 1.2, input.lifeRatio * 1.25) + .25)
  const wastedTool = kind === 'change' ? input.toolCost * Math.max(.1, 1 - input.wearRatio) : 0
  const scrap = p * input.partsAtRisk * input.partCost
  const rework = p * input.partsAtRisk * input.reworkCost
  const downtime = (kind === 'change' ? .2 : kind === 'planned' ? .38 : input.downtimeHours) * input.hourlyRate
  const labour = kind === 'failure' ? input.labourCost * 1.8 : input.labourCost
  const damage = kind === 'failure' ? p * input.holderDamageCost : p * input.holderDamageCost * .08
  return { probability: p, parts: { wastedTool, scrap, rework, downtime, labour, damage }, total: wastedTool + scrap + rework + downtime + labour + damage }
}
