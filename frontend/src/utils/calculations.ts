import type { Material, Tool } from '../data'

const taylorConstants: Record<string, { c: number; n: number }> = {
  'Carbide:Alloy steel': { c: 390, n: .25 }, 'Carbide:Titanium': { c: 170, n: .22 }, 'Carbide:Nickel alloy': { c: 110, n: .2 }, 'Carbide:Aluminium': { c: 780, n: .3 },
}

export const predictTaylorLife = (tool: Tool, material: Material, vc: number) => {
  const pair = taylorConstants[`${tool.material}:${material.group}`] ?? { c: 300, n: .24 }
  const minutes = pair.c / Math.pow(Math.max(vc, 1), pair.n)
  return Math.round(Math.max(12, Math.min(minutes, tool.life_limit_min)) * 10) / 10
}

export const wearAtTime = (timeInCut: number, vb0 = .015, k = .00042, exponent = 1.22) => Math.max(vb0, vb0 + k * Math.pow(timeInCut, exponent))
export const remainingLife = (predictedLife: number, timeInCut: number) => Math.max(0, predictedLife - timeInCut)
export const failureProbability = (wearRatio: number, lifeRatio: number) => 1 / (1 + Math.exp(-7 * ((wearRatio * .62 + lifeRatio * .38) - .78)))
export const mrr = (vc: number, feed: number, depth: number, width: number) => Number(((vc * feed * depth * width) / 1000).toFixed(2))
