export type MachineStatus = 'Running' | 'Idle' | 'Offline' | 'Maintenance'
export type MachineCategory = 'CNC' | 'PLC'
export type MachineDesignType =
  | 'CNC-VMC'
  | 'CNC-Turning'
  | 'CNC-5Axis'
  | 'PLC-Conveyor'
  | 'PLC-Robotic'
  | 'PLC-DrillStation'

export type ToolType = 'End mill' | 'Turning insert' | 'Drill'

export type Machine = {
  id: string
  name: string
  make: string
  controller: string
  status: MachineStatus
  currentToolId: string
  location: string
  category?: MachineCategory
  designType?: MachineDesignType
  weeklyRunHours?: number
}

export type Tool = {
  id: string
  name: string
  type: ToolType
  material: string
  coating: string
  diameter_mm: number
  flute_count: number
  life_limit_min: number
  vb_limit_mm: number
  cost: number
  overhang_mm: number
  holder: string
  pocket: string
  supplier: string
}

export type IsoGroup = 'ISO N' | 'ISO P' | 'ISO S' | 'ISO M' | 'ISO K' | 'ISO H'

export type MaterialFactoryContext = {
  partName: string
  operationType: 'Roughing' | 'Semi-Finishing' | 'Finishing' | 'High-Speed Milling' | 'Drilling'
  coolantStrategy: 'Flood Coolant' | 'MQL' | 'High-Pressure Through-Tool' | 'Dry Air Blast'
  recommendedCutter: string
  wearMultiplier: number
}

export type Material = {
  id: string
  name: string
  group: string
  isoGroup: IsoGroup
  hardness: string
  machinability: number
  vcMin: number
  vcMax: number
  colour: string
  imageUrl: string
  recommendedCoatings: string[]
  factoryContext: MaterialFactoryContext
}

export function makeMetallicBilletSvg(base: string, sheen: string, code: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${sheen}"/>
        <stop offset="48%" stop-color="${base}"/>
        <stop offset="100%" stop-color="#1E293B"/>
      </linearGradient>
      <pattern id="lines" width="128" height="4" patternUnits="userSpaceOnUse">
        <line x1="0" y1="1" x2="128" y2="1" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>
        <line x1="0" y1="3" x2="128" y2="3" stroke="rgba(0,0,0,0.12)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="128" height="128" rx="16" fill="url(#g)"/>
    <rect width="128" height="128" rx="16" fill="url(#lines)"/>
    <rect x="6" y="6" width="116" height="116" rx="12" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <text x="14" y="108" font-family="monospace" font-size="18" font-weight="700" fill="rgba(255,255,255,0.88)">${code}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const presetMaterialTextures = [
  { label: 'Brushed Aluminium', colour: '#CBD5E1', imageUrl: makeMetallicBilletSvg('#94A3B8', '#E2E8F0', 'AL') },
  { label: 'Alloy Steel Billet', colour: '#475569', imageUrl: makeMetallicBilletSvg('#475569', '#94A3B8', 'FE') },
  { label: 'Titanium Forging', colour: '#64748B', imageUrl: makeMetallicBilletSvg('#64748B', '#CBD5E1', 'TI') },
  { label: 'Nickel Superalloy', colour: '#78716C', imageUrl: makeMetallicBilletSvg('#57534E', '#A8A29E', 'NI') },
]

export type Job = {
  machineId: string
  materialId: string
  partNumber: string
  operationNumber: string
  operation: string
  batchSize: number
  partsCompleted: number
  cycleTimeSec: number
  timeInCutMin: number
  partsProduced: number
  vbWearMm: number
  rpm: number
  feed: number
  depth: number
  width: number
  coolant: string
  temperature: number
  vibration: number
  load: number
}

export type QueuedJob = {
  id: string
  partNumber: string
  operationNumber: string
  operation: string
  materialId: string
  toolId: string
  batchSize: number
  expectedStartOffsetMin: number
  expectedDurationMin: number
}

export const machineDesignLabels: Record<MachineDesignType, { category: MachineCategory; label: string; subtitle: string }> = {
  'CNC-VMC': { category: 'CNC', label: '3-Axis Vertical Machining Center (VMC)', subtitle: 'Vertical spindle + T-slot bed' },
  'CNC-Turning': { category: 'CNC', label: 'Horizontal Slant-Bed Turning Center', subtitle: '3-jaw rotary chuck + indexing turret' },
  'CNC-5Axis': { category: 'CNC', label: '5-Axis Bridge Gantry Mill-Turn', subtitle: 'Dual-pillar gantry + rotary trunnion table' },
  'PLC-Conveyor': { category: 'PLC', label: 'PLC Transfer Line & Indexing Station', subtitle: 'Twin-rail belt conveyor + overhead head' },
  'PLC-Robotic': { category: 'PLC', label: 'PLC Articulated Robotic Machining Cell', subtitle: '6-axis industrial arm + safety pedestal' },
  'PLC-DrillStation': { category: 'PLC', label: 'PLC Rotary Dial Multi-Spindle Station', subtitle: 'Rotary indexing dial + twin drill columns' },
}

export const machines: Machine[] = [
  { id: 'CNC-01', name: 'VMC Alpha', make: 'Makino', controller: 'Fanuc 31i', status: 'Running', currentToolId: 'TL-001', location: 'Bay 01', category: 'CNC', designType: 'CNC-VMC', weeklyRunHours: 112 },
  { id: 'CNC-02', name: 'MillTurn 500', make: 'DMG Mori', controller: 'Siemens 840D', status: 'Idle', currentToolId: 'TL-003', location: 'Bay 02', category: 'CNC', designType: 'CNC-Turning', weeklyRunHours: 84 },
  { id: 'CNC-03', name: 'VF-4SS', make: 'Haas', controller: 'Haas NGC', status: 'Running', currentToolId: 'TL-004', location: 'Bay 03', category: 'CNC', designType: 'CNC-5Axis', weeklyRunHours: 120 },
  { id: 'CNC-04', name: 'Nexturn 320', make: 'Doosan', controller: 'Siemens S7-1500 PLC', status: 'Offline', currentToolId: 'TL-005', location: 'Bay 04', category: 'PLC', designType: 'PLC-Conveyor', weeklyRunHours: 60 },
  { id: 'CNC-05', name: 'DMC 635', make: 'DMG Mori', controller: 'Allen-Bradley ControlLogix', status: 'Maintenance', currentToolId: 'TL-009', location: 'Bay 05', category: 'PLC', designType: 'PLC-Robotic', weeklyRunHours: 96 },
]

export const tools: Tool[] = [
  { id: 'TL-001', name: 'Ø12 Roughing End Mill', type: 'End mill', material: 'Carbide', coating: 'AlTiN', diameter_mm: 12, flute_count: 4, life_limit_min: 180, vb_limit_mm: 0.3, cost: 68, overhang_mm: 42, holder: 'BT40 hydraulic', pocket: 'T01', supplier: 'Sandvik' },
  { id: 'TL-002', name: 'Ø8 Finishing End Mill', type: 'End mill', material: 'Carbide', coating: 'TiSiN', diameter_mm: 8, flute_count: 4, life_limit_min: 120, vb_limit_mm: 0.25, cost: 46, overhang_mm: 32, holder: 'BT40 collet', pocket: 'T02', supplier: 'Kennametal' },
  { id: 'TL-003', name: 'CNMG 120408 Insert', type: 'Turning insert', material: 'Carbide', coating: 'CVD', diameter_mm: 12, flute_count: 1, life_limit_min: 95, vb_limit_mm: 0.3, cost: 18, overhang_mm: 28, holder: 'PCLNR 2525', pocket: 'T05', supplier: 'Seco' },
  { id: 'TL-004', name: 'Ø10 Through-Coolant Drill', type: 'Drill', material: 'Carbide', coating: 'AlCrN', diameter_mm: 10, flute_count: 2, life_limit_min: 145, vb_limit_mm: 0.25, cost: 74, overhang_mm: 50, holder: 'BT40 shrink fit', pocket: 'T07', supplier: 'Walter' },
  { id: 'TL-005', name: 'DNMG 150608 Insert', type: 'Turning insert', material: 'Carbide', coating: 'CVD', diameter_mm: 15, flute_count: 1, life_limit_min: 110, vb_limit_mm: 0.3, cost: 21, overhang_mm: 29, holder: 'DCLNR 2525', pocket: 'T03', supplier: 'Iscar' },
  { id: 'TL-006', name: 'Ø6 Ball Nose', type: 'End mill', material: 'Carbide', coating: 'TiAlN', diameter_mm: 6, flute_count: 2, life_limit_min: 90, vb_limit_mm: 0.2, cost: 39, overhang_mm: 38, holder: 'BT40 collet', pocket: 'T11', supplier: 'OSG' },
  { id: 'TL-009', name: 'Ø20 5F End Mill', type: 'End mill', material: 'Carbide', coating: 'AlTiN', diameter_mm: 20, flute_count: 5, life_limit_min: 220, vb_limit_mm: 0.35, cost: 112, overhang_mm: 55, holder: 'BT40 hydraulic', pocket: 'T09', supplier: 'Sandvik' },
]

export const materials: Material[] = [
  {
    id: 'al6061',
    name: 'Al 6061-T6',
    group: 'Aluminium',
    isoGroup: 'ISO N',
    hardness: '95 HB',
    machinability: 90,
    vcMin: 350,
    vcMax: 650,
    colour: '#CBD5E1',
    imageUrl: makeMetallicBilletSvg('#94A3B8', '#E2E8F0', 'AL6061'),
    recommendedCoatings: ['TiN', 'ZrN'],
    factoryContext: {
      partName: 'Aerospace Bracket #A-104',
      operationType: 'High-Speed Milling',
      coolantStrategy: 'Flood Coolant',
      recommendedCutter: 'Uncoated 3-Flute Carbide',
      wearMultiplier: 0.6,
    },
  },
  {
    id: 'aisi4140',
    name: 'AISI 4140',
    group: 'Alloy steel',
    isoGroup: 'ISO P',
    hardness: '28 HRC',
    machinability: 65,
    vcMin: 130,
    vcMax: 210,
    colour: '#475569',
    imageUrl: makeMetallicBilletSvg('#475569', '#94A3B8', '4140'),
    recommendedCoatings: ['AlTiN', 'TiSiN', 'AlCrN'],
    factoryContext: {
      partName: 'Hydraulic Manifold #HM-221',
      operationType: 'Roughing',
      coolantStrategy: 'Flood Coolant',
      recommendedCutter: 'AlTiN 4-Flute Carbide End Mill',
      wearMultiplier: 1.0,
    },
  },
  {
    id: 'ti64',
    name: 'Ti-6Al-4V',
    group: 'Titanium',
    isoGroup: 'ISO S',
    hardness: '34 HRC',
    machinability: 25,
    vcMin: 45,
    vcMax: 85,
    colour: '#64748B',
    imageUrl: makeMetallicBilletSvg('#64748B', '#CBD5E1', 'TI64'),
    recommendedCoatings: ['AlTiN', 'AlCrN'],
    factoryContext: {
      partName: 'Turbine Housing #TH-018',
      operationType: 'Semi-Finishing',
      coolantStrategy: 'High-Pressure Through-Tool',
      recommendedCutter: 'AlCrN Variable-Helix Carbide',
      wearMultiplier: 2.1,
    },
  },
  {
    id: 'in718',
    name: 'Inconel 718',
    group: 'Nickel alloy',
    isoGroup: 'ISO S',
    hardness: '36 HRC',
    machinability: 18,
    vcMin: 28,
    vcMax: 55,
    colour: '#78716C',
    imageUrl: makeMetallicBilletSvg('#57534E', '#A8A29E', 'IN718'),
    recommendedCoatings: ['AlTiN', 'AlCrN'],
    factoryContext: {
      partName: 'Exhaust Seal Ring #ENG-011',
      operationType: 'Finishing',
      coolantStrategy: 'High-Pressure Through-Tool',
      recommendedCutter: 'AlTiN Ceramic-Carbide Insert',
      wearMultiplier: 2.8,
    },
  },
]

export type SampleAlert = {
  id: string
  machineId: string
  severity: 'error' | 'warning' | 'info'
  title: string
  detail: string
  time: string
}

export const sampleAlerts: SampleAlert[] = [
  {
    id: 'ALT-01',
    machineId: 'CNC-05',
    severity: 'error',
    title: 'TL-009 VB wear at 77% (Maintenance)',
    detail: 'DMC 635 flank wear reached 0.27 / 0.35 mm. Stage replacement before next batch.',
    time: '2m ago',
  },
  {
    id: 'ALT-02',
    machineId: 'CNC-04',
    severity: 'warning',
    title: 'TL-005 approaching VB limit on Inconel 718',
    detail: 'Nexturn 320 insert at 0.25 / 0.30 mm (29 min RUL remaining).',
    time: '9m ago',
  },
  {
    id: 'ALT-03',
    machineId: 'CNC-01',
    severity: 'info',
    title: 'VMC Alpha sister tool T21 preset',
    detail: 'Queue #1 (BRK-4140-222) scheduled in 178 min after roughing batch.',
    time: '18m ago',
  },
]

export const jobs: Record<string, Job> = {
  'CNC-01': { machineId: 'CNC-01', materialId: 'aisi4140', partNumber: 'BRK-4140-221', operationNumber: 'OP-30', operation: 'Roughing pocket', batchSize: 120, partsCompleted: 76, cycleTimeSec: 242, timeInCutMin: 109, partsProduced: 76, vbWearMm: 0.16, rpm: 4200, feed: 0.12, depth: 1.2, width: 7.2, coolant: 'Flood', temperature: 42, vibration: 2.8, load: 67 },
  'CNC-02': { machineId: 'CNC-02', materialId: 'ti64', partNumber: 'AERO-TI-018', operationNumber: 'OP-20', operation: 'OD turning', batchSize: 30, partsCompleted: 11, cycleTimeSec: 390, timeInCutMin: 48, partsProduced: 11, vbWearMm: 0.11, rpm: 1100, feed: 0.16, depth: 0.8, width: 1, coolant: 'High pressure', temperature: 45, vibration: 2.1, load: 49 },
  'CNC-03': { machineId: 'CNC-03', materialId: 'al6061', partNumber: 'AL-6061-099', operationNumber: 'OP-15', operation: 'Drilling', batchSize: 250, partsCompleted: 188, cycleTimeSec: 76, timeInCutMin: 71, partsProduced: 188, vbWearMm: 0.09, rpm: 6100, feed: 0.11, depth: 16, width: 10, coolant: 'Through tool', temperature: 33, vibration: 1.6, load: 42 },
  'CNC-04': { machineId: 'CNC-04', materialId: 'in718', partNumber: 'ENG-718-011', operationNumber: 'OP-40', operation: 'Finish turning', batchSize: 18, partsCompleted: 5, cycleTimeSec: 524, timeInCutMin: 81, partsProduced: 5, vbWearMm: 0.25, rpm: 780, feed: 0.14, depth: 0.45, width: 1, coolant: 'High pressure', temperature: 56, vibration: 4.2, load: 74 },
  'CNC-05': { machineId: 'CNC-05', materialId: 'aisi4140', partNumber: 'GEAR-4140-060', operationNumber: 'OP-10', operation: 'Face milling', batchSize: 80, partsCompleted: 24, cycleTimeSec: 282, timeInCutMin: 135, partsProduced: 24, vbWearMm: 0.27, rpm: 2350, feed: 0.15, depth: 1.8, width: 14, coolant: 'Flood', temperature: 48, vibration: 3.7, load: 70 },
}

export const materialQueues: Record<string, QueuedJob[]> = {
  'CNC-01': [
    { id: 'Q-101', partNumber: 'BRK-4140-222', operationNumber: 'OP-40', operation: 'Finish contour milling', materialId: 'aisi4140', toolId: 'TL-002', batchSize: 120, expectedStartOffsetMin: 178, expectedDurationMin: 145 },
    { id: 'Q-102', partNumber: 'FLG-6061-104', operationNumber: 'OP-10', operation: 'High-speed pocket roughing', materialId: 'al6061', toolId: 'TL-001', batchSize: 90, expectedStartOffsetMin: 323, expectedDurationMin: 110 },
    { id: 'Q-103', partNumber: 'AERO-TI-044', operationNumber: 'OP-25', operation: '3D profile ball milling', materialId: 'ti64', toolId: 'TL-006', batchSize: 40, expectedStartOffsetMin: 433, expectedDurationMin: 195 },
  ],
  'CNC-02': [
    { id: 'Q-201', partNumber: 'AERO-TI-019', operationNumber: 'OP-30', operation: 'Finish OD turning', materialId: 'ti64', toolId: 'TL-005', batchSize: 30, expectedStartOffsetMin: 124, expectedDurationMin: 95 },
    { id: 'Q-202', partNumber: 'SHF-4140-088', operationNumber: 'OP-15', operation: 'Rough shoulder turning', materialId: 'aisi4140', toolId: 'TL-003', batchSize: 65, expectedStartOffsetMin: 219, expectedDurationMin: 140 },
  ],
  'CNC-03': [
    { id: 'Q-301', partNumber: 'AL-6061-100', operationNumber: 'OP-20', operation: 'Chamfer & finish milling', materialId: 'al6061', toolId: 'TL-002', batchSize: 250, expectedStartOffsetMin: 79, expectedDurationMin: 120 },
    { id: 'Q-302', partNumber: 'MAN-4140-310', operationNumber: 'OP-10', operation: 'Deep hole coolant drilling', materialId: 'aisi4140', toolId: 'TL-004', batchSize: 85, expectedStartOffsetMin: 199, expectedDurationMin: 165 },
  ],
  'CNC-04': [
    { id: 'Q-401', partNumber: 'ENG-718-012', operationNumber: 'OP-50', operation: 'Grooving & thread turning', materialId: 'in718', toolId: 'TL-005', batchSize: 18, expectedStartOffsetMin: 114, expectedDurationMin: 130 },
    { id: 'Q-402', partNumber: 'RING-4140-019', operationNumber: 'OP-10', operation: 'Rough bore turning', materialId: 'aisi4140', toolId: 'TL-003', batchSize: 50, expectedStartOffsetMin: 244, expectedDurationMin: 105 },
  ],
  'CNC-05': [
    { id: 'Q-501', partNumber: 'GEAR-4140-061', operationNumber: 'OP-20', operation: 'Slot & pocket milling', materialId: 'aisi4140', toolId: 'TL-001', batchSize: 80, expectedStartOffsetMin: 263, expectedDurationMin: 160 },
    { id: 'Q-502', partNumber: 'HSG-6061-212', operationNumber: 'OP-10', operation: 'Face milling', materialId: 'al6061', toolId: 'TL-009', batchSize: 110, expectedStartOffsetMin: 423, expectedDurationMin: 135 },
  ],
}

export const costParameters = { machineHourlyRate: 95, partCost: 82, reworkCost: 31, labourChangeCost: 42, holderDamageCost: 650, currency: 'USD' as const }

export type LiveSignals = { rpm: number; feed: number; load: number; vibration: number; temperature: number; coolant: string }
export const createLiveSignals = (job: Job): LiveSignals => ({
  rpm: Math.round(job.rpm * (0.97 + Math.random() * 0.06)),
  feed: Number((job.feed * (0.96 + Math.random() * 0.08)).toFixed(3)),
  load: Math.round(job.load * (0.92 + Math.random() * 0.15)),
  vibration: Number((job.vibration * (0.85 + Math.random() * 0.3)).toFixed(1)),
  temperature: Math.round(job.temperature * (0.97 + Math.random() * 0.08)),
  coolant: job.coolant,
})

export const wearHistory = Array.from({ length: 16 }, (_, index) => ({
  time: index * 8,
  wear: Number((0.018 + 0.0032 * index + 0.00055 * index ** 1.7).toFixed(3)),
  load: 50 + index * 3.3 + Math.sin(index) * 7,
}))
